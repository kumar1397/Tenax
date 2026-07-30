"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { getMyProfile, updateProfile, type ProfileForm } from "@/actions/profile";
import { listOrgs, createOrg, type Org } from "@/actions/event"; // adjust path if you put org actions elsewhere
import {
  Trophy, Clock, Calendar, LogOut, Shield, Loader2, Save, Upload, Building2, Pencil, Camera, X, Gamepad2, TrendingUp,
} from "lucide-react";

const REGIONS = ["", "NA", "EU", "APAC", "LATAM", "Global"];

const STATUS_LABEL: Record<string, string> = { upcoming: "Upcoming", ongoing: "Live", completed: "Completed" };

// Placeholder points-over-time series (no real per-period points tracked yet)
const POINTS_SERIES = [
  { label: "Feb", value: 120 },
  { label: "Mar", value: 260 },
  { label: "Apr", value: 190 },
  { label: "May", value: 420 },
  { label: "Jun", value: 350 },
  { label: "Jul", value: 540 },
];

type PlayedEvent = { id: string; title: string; game: string; status: string; cover: string; date: string };

const EMPTY: ProfileForm = {
  player_name: "", handle: "", game: "", region: "", player_image: "", org_id: null,
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [gameCovers, setGameCovers] = useState<Record<string, string>>({});
  const [eventsPlayed, setEventsPlayed] = useState<PlayedEvent[]>([]);

  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [stats, setStats] = useState({ mmr: 0, winrate: 0, rank: "", hours: 0 });
  const [joined, setJoined] = useState("");
  const [email, setEmail] = useState("");
  const [authAvatar, setAuthAvatar] = useState("");

  // Org state
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", tricode: "", link: "", logo: "" });

  const update = <K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/auth");
        return;
      }
      setEmail(data.user.email ?? "");
      setAuthAvatar(data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || "");
      setJoined(new Date(data.user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }));

      const [orgRes, profRes, gamesRes] = await Promise.all([
        listOrgs(),
        getMyProfile(),
        supabase.from("games").select("name, cover_image"),
      ]);
      if (orgRes.data) setOrgs(orgRes.data);

      const covers: Record<string, string> = {};
      for (const g of gamesRes.data ?? []) if (g?.name && g?.cover_image) covers[g.name] = g.cover_image;
      setGameCovers(covers);

      const p = profRes.data;
      if (p) {
        setForm({
          player_name: p.player_name ?? "",
          handle: p.handle ?? "",
          game: p.game ?? "",
          region: p.region ?? "",
          player_image: p.player_image ?? "",
          org_id: p.org_id ?? null,
        });
        setStats({ mmr: p.mmr ?? 0, winrate: p.win_rate ?? 0, rank: p.rank ?? "Unranked", hours: p.hours_played ?? 0 });

        // Events the player has joined → powers "Events played" + "Most games played"
        const { data: parts } = await supabase
          .from("event_participants")
          .select("Events(*)")
          .eq("player_id", p.id);
        const evs: PlayedEvent[] = (parts ?? [])
          .map((r: any) => r.Events)
          .filter(Boolean)
          .map((row: any) => ({
            id: String(row.id),
            title: row.event_name ?? "Untitled",
            game: row.game_name ?? "",
            status: STATUS_LABEL[row.event_status] ?? "Upcoming",
            cover: row.cover_image ?? "",
            date: row.event_date ?? "",
          }));
        setEventsPlayed(evs);
      }
      setLoading(false);
    });
  }, [router]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) { setUploadingAvatar(false); toast.error(error.message); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const newImage = data.publicUrl;
    update("player_image", newImage);
    // Persist immediately — no separate save step for the picture
    const res = await updateProfile({ ...form, player_image: newImage });
    setUploadingAvatar(false);
    if (res.error) toast.error(res.error);
    else toast.success("Picture updated");
  }

  async function handleNewOrgLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file);
    if (error) { setUploadingLogo(false); toast.error(error.message); return; }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setNewOrg((s) => ({ ...s, logo: data.publicUrl }));
    setUploadingLogo(false);
  }

  async function handleSave() {
    setSaving(true);

    let orgId = form.org_id;

    // Creating a new org first, then linking to it
    if (creatingOrg) {
      if (!newOrg.name.trim()) { setSaving(false); toast.error("Enter an org name"); return; }
      const r = await createOrg({
        name: newOrg.name, tricode: newOrg.tricode, link: newOrg.link, logo: newOrg.logo,
      });
      if (r.error || !r.data) { setSaving(false); toast.error(r.error ?? "Couldn't create org"); return; }
      orgId = r.data.id;
      // add to local list & reset the create form
      setOrgs((prev) => (prev.some((o) => o.id === r.data!.id) ? prev : [...prev, r.data!]));
      setCreatingOrg(false);
      setNewOrg({ name: "", tricode: "", link: "", logo: "" });
      update("org_id", orgId);
    }

    const res = await updateProfile({ ...form, org_id: orgId });
    setSaving(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Profile saved");
    setEditOpen(false);
  }

  async function handleSignOut() {
    const supabase = createClient();    
    await supabase.auth.signOut();
    window.location.href = "/";          
  }

  if (loading) return <div className="p-10 text-muted-foreground">Loading profile…</div>;

  const displayName = form.player_name || form.handle || email.split("@")[0];
  const initial = (displayName[0] ?? "?").toUpperCase();
  const avatarSrc = form.player_image || authAvatar;
  const currentOrg = orgs.find((o) => o.id === form.org_id) ?? null;

  const statCards = [
    { label: "MMR", value: stats.mmr.toLocaleString(), icon: Trophy },
    { label: "Rank", value: stats.rank || "Unranked", icon: Shield },
    { label: "Hours", value: stats.hours.toLocaleString(), icon: Clock },
  ];

  const mostGames = (() => {
    const m = new Map<string, number>();
    for (const e of eventsPlayed) if (e.game) m.set(e.game, (m.get(e.game) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([game, count]) => ({ game, count }));
  })();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Banner (dummy name for now) */}
      <section className="relative h-52 md:h-64 overflow-hidden rounded-3xl border border-brand shadow-card-soft">
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_20%_10%,#C084FC_0%,#A855F7_35%,#5B21B6_75%,#2e1065_100%)]" />
        <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[120px] font-bold leading-none text-white/5 md:block">
          {(form.game || "TENAX").toUpperCase()}
        </div>
        <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
          Online <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
        </span>
        <div className="relative z-10 flex h-full flex-col justify-center p-6 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70 md:text-sm">Player Statistics</div>
          <h1 className="mt-2 text-4xl font-bold text-white md:text-6xl">{form.game || "Tenax"}</h1>
          <p className="mt-3 max-w-md text-sm text-white/70">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.</p>
        </div>
      </section>

      {/* Header */}
      <div className="relative px-4 md:px-8">
        {/* Avatar — click to change picture (overlaps the banner) */}
        <div className="absolute -top-14 left-4 z-10 md:left-8">
          <label className="group relative block size-28 cursor-pointer md:size-32">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="size-full rounded-full object-cover shadow-glow ring-4 ring-background" />
            ) : (
              <div className="grid size-full place-items-center rounded-full bg-gradient-brand text-4xl font-bold text-white shadow-glow ring-4 ring-background">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
              {uploadingAvatar ? <Loader2 className="size-6 animate-spin text-white" /> : <Camera className="size-6 text-white" />}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" disabled={uploadingAvatar} />
          </label>
          <span className="absolute bottom-2 right-2 size-4 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>

        {/* Identity + actions (below the banner so nothing gets clipped) */}
        <div className="flex flex-col gap-4 pt-20 sm:flex-row sm:items-start sm:justify-between md:pl-40 md:pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-bold md:text-3xl">{displayName}</h2>
              {stats.rank && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gradient-brand px-2 py-0.5 text-[11px] font-bold text-white">
                  <Shield className="size-3" /> {stats.rank.toUpperCase()}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {form.handle && <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">@{form.handle}</span>}
              {currentOrg && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">
                  {currentOrg.logo ? <img src={currentOrg.logo} alt="" className="size-3.5 rounded" /> : <Building2 className="size-3" />}
                  {currentOrg.tricode || currentOrg.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"><Calendar className="size-3" /> Joined {joined}</span>
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">{email}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary/40">
              <Pencil className="size-4" /> Edit
            </button>
            <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary/40">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Win-rate ring + stats laid out horizontally */}
      <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <WinRing value={stats.winrate} />
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-muted-foreground">{form.game || "No main game"}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 sm:gap-x-12">
            {statCards.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 sm:items-start">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <s.icon className="size-4 text-primary" /> {s.label}
                </div>
                <div className="text-3xl font-bold text-gradient-brand md:text-4xl">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Points earned over time (placeholder data for now) */}
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Points Earned</h2>
          <span className="ml-auto text-xs text-muted-foreground">Last 6 months</span>
        </div>
        <PointsChart data={POINTS_SERIES} />
      </div>

      {/* Most games played */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Gamepad2 className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Most Games Played</h2>
        </div>
        {mostGames.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games played yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mostGames.map((g) => (
              <div key={g.game} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5">
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {gameCovers[g.game]
                    ? <img src={gameCovers[g.game]} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="size-full object-cover" />
                    : <div className="grid size-full place-items-center"><Gamepad2 className="size-4 text-muted-foreground" /></div>}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{g.game}</div>
                  <div className="text-[11px] text-muted-foreground">{g.count} {g.count === 1 ? "event" : "events"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events played */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Events Played</h2>
        </div>
        {eventsPlayed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet — register for a tournament to see it here.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventsPlayed.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5 transition hover:border-brand">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {e.cover ? <img src={e.cover} alt="" onError={(ev) => { ev.currentTarget.style.display = "none"; }} className="size-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground">{e.game}{e.date ? ` · ${new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</div>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">{e.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal (handle / region / organisation) */}
      {editOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-card-soft">
            <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
              <Pencil className="size-5 text-primary" />
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} aria-label="Close" className="ml-auto grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display Name">
                <Input value={form.player_name} onChange={(v) => update("player_name", v)} placeholder="Your name" />
              </Field>
              <Field label="Handle" hint="Your @username">
                <Input value={form.handle} onChange={(v) => update("handle", v)} placeholder="e.g. phantom_100" />
              </Field>
              <Field label="Region">
                <Select value={form.region} onChange={(v) => update("region", v)} options={REGIONS} placeholder="Select a region" />
              </Field>

              {/* Organization: pick existing or create new */}
              <Field label="Organization" hint="Pick your org, or create a new one">
                <select
                  value={creatingOrg ? "__create__" : (form.org_id ? String(form.org_id) : "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__create__") { setCreatingOrg(true); update("org_id", null); }
                    else if (v === "") { setCreatingOrg(false); update("org_id", null); }
                    else { setCreatingOrg(false); update("org_id", Number(v)); }
                  }}
                  className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
                >
                  <option value="">No organization</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}{o.tricode ? ` (${o.tricode})` : ""}</option>
                  ))}
                  <option value="__create__">+ Create new org</option>
                </select>
              </Field>

              {/* Selected existing org preview */}
              <Field label="Selected Org">
                {creatingOrg ? (
                  <p className="text-sm text-muted-foreground py-2.5">Creating a new org below…</p>
                ) : currentOrg ? (
                  <div className="flex items-center gap-2 py-2">
                    {currentOrg.logo
                      ? <img src={currentOrg.logo} alt="" className="size-8 rounded bg-secondary" />
                      : <div className="size-8 rounded bg-secondary grid place-items-center"><Building2 className="size-4 text-muted-foreground" /></div>}
                    <span className="text-sm font-semibold">{currentOrg.name}{currentOrg.tricode ? ` · ${currentOrg.tricode}` : ""}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2.5">No org selected</p>
                )}
              </Field>

              {/* Create-new-org fields */}
              {creatingOrg && (
                <div className="grid gap-5 rounded-xl border border-dashed border-border p-4 sm:col-span-2 sm:grid-cols-2">
                  <Field label="Org Name">
                    <Input value={newOrg.name} onChange={(v) => setNewOrg((s) => ({ ...s, name: v }))} placeholder="e.g. Sentinels" />
                  </Field>
                  <Field label="Org Tricode">
                    <Input value={newOrg.tricode} onChange={(v) => setNewOrg((s) => ({ ...s, tricode: v }))} placeholder="e.g. SEN" />
                  </Field>
                  <Field label="Org Link">
                    <Input value={newOrg.link} onChange={(v) => setNewOrg((s) => ({ ...s, link: v }))} placeholder="https://..." />
                  </Field>
                  <Field label="Org Logo" hint="Uploaded once for this org">
                    <div className="flex items-center gap-3">
                      {newOrg.logo
                        ? <img src={newOrg.logo} alt="" className="size-12 rounded-lg object-cover bg-secondary shrink-0" />
                        : <div className="size-12 rounded-lg bg-secondary grid place-items-center text-muted-foreground text-[10px] shrink-0">Logo</div>}
                      <label className="flex-1 flex items-center gap-2 bg-secondary/60 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:border-brand transition">
                        <Upload className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{uploadingLogo ? "Uploading..." : "Upload logo"}</span>
                        <input type="file" accept="image/*" onChange={handleNewOrgLogo} className="hidden" disabled={uploadingLogo} />
                      </label>
                    </div>
                  </Field>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PointsChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 640, h = 160, pad = 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * stepX, h - pad - (d.value / max) * (h - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div>
      <div className="mb-2 text-2xl font-bold text-gradient-brand">{total.toLocaleString()} pts</div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-40 w-full">
        <defs>
          <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ptsFill)" />
        <path d={line} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  );
}

function WinRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  return (
    <div className="relative grid size-32 place-items-center">
      <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-secondary" />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke="url(#winGrad)" strokeDasharray={`${dash} ${c}`} />
        <defs>
          <linearGradient id="winGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Win rate</div>
        <div className="text-2xl font-bold text-gradient-brand">{pct}%</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand placeholder:text-muted-foreground"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o === "" ? placeholder : o}</option>
      ))}
    </select>
  );
}