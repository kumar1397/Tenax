// Challonge helpers.
//
// For now this only handles turning a tournament URL into an embeddable
// bracket. When we add the "import from Challonge" flow later, the API calls
// will live here too.

// Turn a Challonge tournament URL into the iframe `src` that renders its
// bracket. Challonge exposes every tournament's live bracket at
// `<tournament-url>/module`, so we just normalise the URL and append it.
//
// Handles both root tournaments (challonge.com/abc123) and community
// subdomains (myorg.challonge.com/abc123). Returns null for anything that
// isn't a Challonge URL, so callers can fall back to the native bracket.
export function challongeEmbedSrc(url?: string | null): string | null {
  if (!url) return null;

  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null; // not a valid absolute URL
  }

  // hostname is challonge.com or *.challonge.com
  if (!/(^|\.)challonge\.com$/i.test(u.hostname)) return null;

  // The tournament slug is the first path segment (challonge.com/<slug>).
  const slug = u.pathname.split("/").filter(Boolean)[0];
  if (!slug) return null;

  // show_final_results / show_standings surface the outcome once it's played;
  // they're ignored by Challonge while the tournament is still running.
  const params = "show_final_results=1&show_standings=1";
  return `${u.protocol}//${u.hostname}/${slug}/module?${params}`;
}

// True when the given URL points at a Challonge tournament we can embed.
export function isChallongeUrl(url?: string | null): boolean {
  return challongeEmbedSrc(url) !== null;
}

// Pull the Challonge username out of a player's profile URL. Challonge user
// profiles live at `challonge.com/users/<username>`. We also accept a bare
// username (what a player might type instead of the full link). The username
// is returned lowercased so matching against tournament participants later is
// case-insensitive. Returns null when we can't confidently extract one.
export function challongeUsernameFromUrl(input?: string | null): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bare username (no slash, no dot) — take it as-is.
  if (!raw.includes("/") && !raw.includes(".")) {
    return normalizeUsername(raw);
  }

  let u: URL;
  try {
    u = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!/(^|\.)challonge\.com$/i.test(u.hostname)) return null;

  // A user profile is `/users/<username>` — take the segment after "users"
  // so we don't mistake a tournament URL for a username.
  const segs = u.pathname.split("/").filter(Boolean);
  const usersIdx = segs.findIndex((s) => s.toLowerCase() === "users");
  const slug = usersIdx >= 0 ? segs[usersIdx + 1] : undefined;
  return slug ? normalizeUsername(slug) : null;
}

function normalizeUsername(s: string): string | null {
  const clean = s.trim().replace(/^@/, "").toLowerCase();
  return clean || null;
}
