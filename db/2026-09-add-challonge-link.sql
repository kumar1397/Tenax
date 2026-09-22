-- Challonge account link for players.
--
-- Stage 1 of Challonge player matching: each player can save their Challonge
-- profile URL. We keep the raw URL for display and the extracted username
-- (lowercased) for matching tournament participants back to accounts later.
--
-- Run this in the Supabase SQL editor. Safe to run more than once.

alter table "Users"
  add column if not exists challonge_url text,
  add column if not exists challonge_username text;

-- Speeds up the "find the account for this Challonge username" lookup used by
-- the import/match step (Stage 2).
create index if not exists users_challonge_username_idx
  on "Users" (challonge_username);

-- PostgREST caches the schema — tell it to reload so the new columns are
-- visible to the API immediately.
notify pgrst, 'reload schema';
