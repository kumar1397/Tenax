# Migrating Supabase to US East (us-east-1)

A Supabase project's region is **fixed at creation** — it can't be switched in
place. To move to the US you create a **new project in us-east-1** and migrate
everything to it, then re-point the app. Plan for a short window of downtime
during cutover.

Vercel is already pinned to US East via `vercel.json` (`"regions": ["iad1"]`),
so keep the new Supabase project in **us-east-1** to co-locate them.

> Do this end-to-end in one sitting during a low-traffic window. Between the
> data dump and cutover, avoid writes on the old project or you'll lose them.

---

## 0. Prerequisites

- **Postgres client tools** (`pg_dump`, `psql`, `pg_restore`) — they ship with a
  normal Postgres install. Verify:
  ```bash
  pg_dump --version
  ```
- The **Supabase CLI is optional** — this runbook doesn't use it. (If you want it
  anyway on Windows: `scoop install supabase`, or run it ad hoc with
  `npx supabase`.)
- When creating the new project (§1), pick the **same Postgres major version** as
  the old one to avoid dump/restore version mismatches.
- Both projects' **database connection strings** (Dashboard → Project Settings →
  Database → Connection string → **URI**, "Use connection pooling" **off** /
  direct connection for the dump/restore).
- The new project's **API keys** (Settings → API): Project URL, `anon` key,
  `service_role` key.

Throughout, `OLD_DB_URL` and `NEW_DB_URL` are those direct Postgres URIs.

---

## 1. Create the new project

1. Supabase Dashboard → **New project** → Region: **East US (North Virginia) /
   us-east-1**.
2. Note its Project URL and keys.
3. Enable the same **extensions** the old one uses — most importantly
   **`pg_cron`** (used by the MMR-decay job): Dashboard → Database → Extensions.

---

## 2. Migrate the database (schema + data + auth)

This dumps the whole database including the `auth` schema (so logins, including
OAuth identities and password hashes, carry over) and `storage` schema (bucket
definitions + object metadata — the actual files are copied separately in §3).

```bash
# Dump everything from the old project
pg_dump "OLD_DB_URL" \
  --no-owner --no-privileges \
  -Fc -f tenax_old.dump

# Restore into the new project
pg_restore \
  --no-owner --no-privileges \
  --clean --if-exists \
  -d "NEW_DB_URL" tenax_old.dump
```

Notes:
- `--no-owner --no-privileges` avoids role-ownership errors between projects.
- Some non-fatal warnings on restore are normal (objects Supabase pre-creates).
- If a full dump fights the managed roles, fall back to splitting it:
  `pg_dump ... --schema=public --schema=auth --schema=storage`.

### 2a. Re-apply table GRANTs (important)

This project relies on explicit GRANTs to the `authenticated` role (the source
of past "permission denied for table X" errors). `--no-privileges` drops them,
so re-run the grants on the **new** DB (`psql "NEW_DB_URL" -f grants.sql`):

```sql
grant select, insert, update, delete on "Users" to authenticated;
grant select, insert, update, delete on event_participants to authenticated;
grant select, insert, update, delete on orgs to authenticated;
grant select on games to authenticated;
grant select on "Events" to authenticated;   -- writes go through service_role
-- add any others your project granted; verify with the query in §6.
```

### 2b. Re-create the MMR-decay cron job

`pg_cron` schedules don't come across in a normal dump. Re-create the decay
function + schedule on the new DB (use your existing decay SQL), e.g.:

```sql
-- (paste the decay_inactive_mmr() function definition here)
select cron.schedule('mmr-decay-daily', '0 3 * * *', $$ select decay_inactive_mmr(); $$);
```

Confirm: `select * from cron.job;`

---

## 3. Migrate Storage files

`pg_dump` copies bucket *definitions* and object *rows*, but not the actual
files. Copy the files with this Node script (needs `@supabase/supabase-js`),
run once per bucket — the app uses **`avatars`**, **`event-covers`**, and
**`org-logos`**:

```js
// migrate-storage.mjs  —  node migrate-storage.mjs
import { createClient } from '@supabase/supabase-js'

const OLD = createClient('OLD_URL', 'OLD_SERVICE_ROLE_KEY')
const NEW = createClient('NEW_URL', 'NEW_SERVICE_ROLE_KEY')
const BUCKETS = ['avatars', 'event-covers', 'org-logos']

for (const bucket of BUCKETS) {
  // ensure the bucket exists on the new project (public, like the originals)
  await NEW.storage.createBucket(bucket, { public: true }).catch(() => {})
  const { data: files, error } = await OLD.storage.from(bucket).list('', { limit: 10000 })
  if (error) { console.error(bucket, error); continue }
  for (const f of files ?? []) {
    const dl = await OLD.storage.from(bucket).download(f.name)
    if (dl.error) { console.error('download', bucket, f.name, dl.error); continue }
    const up = await NEW.storage.from(bucket).upload(f.name, dl.data, { upsert: true })
    if (up.error) console.error('upload', bucket, f.name, up.error)
    else console.log('ok', bucket, f.name)
  }
}
console.log('done')
```

> If any bucket has nested folders, list/recurse per prefix. Also copy each
> bucket's **storage policies** (Dashboard → Storage → Policies) to the new
> project, or re-create them.

Because uploaded URLs are stored as absolute Supabase URLs in the DB (e.g.
`cover_image`, `player_image`, `orgs.logo`), see §5 for rewriting them.

---

## 4. Update environment variables

Change these three everywhere (they point at the project that moved). Update in
**Vercel** (Project → Settings → Environment Variables, all environments) and in
local `.env`:

| Var | New value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | new project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | new `anon` key |
| `NEXT_SUPABASE_SERVICE_ROLE_KEY` | new `service_role` key |

Unchanged: `CHALLONGE_API_KEY`, `STEAM_API_KEY`, `STEAM_SECRET_SALT`.

Redeploy Vercel after saving so the new values load.

---

## 5. Rewrite stored storage URLs

Stored image URLs still contain the **old** project ref. After the files are
copied (§3), rewrite them on the new DB (`psql "NEW_DB_URL"`), swapping the old
ref for the new one in each column that holds a Supabase public URL:

```sql
-- Replace <OLD_REF> and <NEW_REF> with the project refs (the xxxx in
-- https://xxxx.supabase.co).
update "Users" set player_image = replace(player_image, '<OLD_REF>', '<NEW_REF>')
  where player_image like '%<OLD_REF>%';
update "Events" set cover_image = replace(cover_image, '<OLD_REF>', '<NEW_REF>')
  where cover_image like '%<OLD_REF>%';
update orgs set logo = replace(logo, '<OLD_REF>', '<NEW_REF>')
  where logo like '%<OLD_REF>%';
```

---

## 6. Auth: OAuth providers & URLs

- **Discord** (Supabase-managed OAuth): in the **Discord developer portal**, add
  the new project's callback (`https://<NEW_REF>.supabase.co/auth/v1/callback`)
  to the app's redirect URIs; then in Supabase → Auth → Providers → Discord,
  re-enter the client id/secret.
- **Supabase Auth → URL Configuration**: set **Site URL** and **Redirect URLs**
  to your Vercel/production domain (same as before — the domain didn't change).
- **Steam**: custom flow handled in the app (not Supabase GoTrue). Its callback
  is the app's own domain, so no Supabase-side change — it just needs the updated
  service-role key from §4.

Sanity-check GRANTs and cron on the new DB:

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated' order by table_name;

select jobname, schedule from cron.job;
```

---

## 7. Cutover & verify

1. Confirm §2–§6 done on the new project.
2. Redeploy Vercel with the new env vars.
3. Smoke test on production:
   - Sign in (Discord **and** Steam), and a fresh sign-up → onboarding saves.
   - Profile images / event covers / org logos load (URLs rewritten).
   - Register for an event (Challonge-profile gate works), leaderboard, MMR.
   - Admin: create/edit event, Challonge import, assign points & finalize.
4. Watch for `permission denied` (missing GRANT) or broken images (missed URL
   rewrite) and fix per §2a / §5.
5. Once healthy, **pause/keep the old project read-only for a week** as a safety
   net, then delete it.

---

## Rollback

If cutover fails, revert the three env vars in Vercel to the **old** project and
redeploy — the old project is untouched until you delete it in §7.
