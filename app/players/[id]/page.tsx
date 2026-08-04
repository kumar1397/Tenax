import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { Trophy, Clock, Shield, Building2, Calendar, Gamepad2, TrendingUp, ArrowLeft, AtSign } from "lucide-react";

export const revalidate = 60;

const STATUS_LABEL: Record<string, string> = { upcoming: "Upcoming", ongoing: "Live", completed: "Completed" };

// Same placeholder series the profile page uses (no per-period points tracked yet)
const POINTS_SERIES = [
  { label: "Feb", value: 120 }, { label: "Mar", value: 260 }, { label: "Apr", value: 190 },
  { label: "May", value: 420 }, { label: "Jun", value: 350 }, { label: "Jul", value: 540 },
];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: p } = await supabase.from("Users").select("player_name, handle").eq("id", Number(id)).maybeSingle();
  if (!p) return { title: "Player not found" };
  const name = p.player_name || p.handle || "Player";
  return { title: name, description: `${name}'s player profile — rank, MMR, win rate, and events on Tenax.` };
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();

  const [{ data: p }, { data: gamesRows }] = await Promise.all([
    supabase.from("Users").select("*, orgs(id, name, tricode, logo, link)").eq("id", Number(id)).maybeSingle(),
    supabase.from("games").select("name, cover_image"),
  ]);

  if (!p) notFound();

  const gameCovers: Record<string, string> = {};
  for (const g of gamesRows ?? []) if (g?.name && g?.cover_image) gameCovers[g.name] = g.cover_image;

  // Events this player has joined → powers "Events played" + "Most games played"
  const { data: parts } = await supabase.from("event_participants").select("Events(*)").eq("player_id", p.id);
  const eventsPlayed = (parts ?? [])
    .map((r: any) => r.Events)
    .filter(Boolean)
    .map((row: any) => ({
      id: String(row.id),
      title: row.event_name ?? "Untitled",
      game: row.game_name ?? "",
      status: STATUS_LABEL[row.event_status] ?? "Upcoming",
      cover: typeof row.cover_image === "string" && /^https?:\/\//.test(row.cover_image) ? row.cover_image : "",
      date: row.event_date ?? "",
    }));

  const mostGames = (() => {
    const m = new Map<string, number>();
    for (const e of eventsPlayed) if (e.game) m.set(e.game, (m.get(e.game) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([game, count]) => ({ game, count }));
  })();

  const org = (p as any).orgs ?? null;
  const displayName = p.player_name || p.handle || "Player";
  const initial = (displayName[0] ?? "?").toUpperCase();
  const stats = { mmr: p.mmr ?? 0, winrate: p.win_rate ?? 0, rank: p.rank || "Unranked", hours: p.hours_played ?? 0 };
  const joined = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";

  const statCards = [
    { label: "MMR", value: stats.mmr.toLocaleString(), icon: Trophy },
    { label: "Rank", value: stats.rank, icon: Shield },
    { label: "Hours", value: stats.hours.toLocaleString(), icon: Clock },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link href="/players" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <ArrowLeft className="size-4" /> All players
      </Link>

      {/* Banner */}
      <section className="relative h-52 md:h-64 overflow-hidden rounded-3xl border border-brand shadow-card-soft">
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_20%_10%,#C084FC_0%,#A855F7_35%,#5B21B6_75%,#2e1065_100%)]" />
        <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[120px] font-bold leading-none text-white/5 md:block">
          {displayName.toUpperCase()}
        </div>
        <div className="relative z-10 flex h-full flex-col justify-center p-6 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70 md:text-sm">Player Profile</div>
          <h1 className="mt-2 text-4xl font-bold text-white md:text-6xl">{displayName}</h1>
          {p.game && <p className="mt-3 max-w-md text-sm text-white/70">Competes in {p.game}</p>}
        </div>
      </section>

      {/* Header */}
      <div className="relative px-4 md:px-8">
        <div className="absolute -top-14 left-4 z-10 md:left-8">
          {p.player_image ? (
            <img src={p.player_image} alt="" className="size-28 rounded-full object-cover shadow-glow ring-4 ring-background md:size-32" />
          ) : (
            <div className="grid size-28 place-items-center rounded-full bg-gradient-brand text-4xl font-bold text-white shadow-glow ring-4 ring-background md:size-32">
              {initial}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-20 md:pl-40 md:pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-bold md:text-3xl">{displayName}</h2>
              {stats.rank && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gradient-brand px-2 py-0.5 text-[11px] font-bold text-white">
                  <Shield className="size-3" /> {stats.rank.toUpperCase()}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.handle && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/30">
                  <AtSign className="size-3.5" />{p.handle}
                </span>
              )}
              {org && (
                <Link href={`/organisation/${org.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground ring-1 ring-border transition hover:border-brand">
                  {org.logo ? <img src={org.logo} alt="" className="size-4 rounded" /> : <Building2 className="size-3.5" />}
                  {org.tricode || org.name}
                </Link>
              )}
              {joined && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground/80 ring-1 ring-border">
                  <Calendar className="size-3.5" /> Joined {joined}
                </span>
              )}
              {p.player_code && (
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 font-mono text-sm font-semibold text-foreground/70 ring-1 ring-border">
                  {p.player_code}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Win-rate ring + stats */}
      <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <WinRing value={stats.winrate} />
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-xs text-muted-foreground">{p.game || "No main game"}</div>
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

      {/* Points earned over time (placeholder data, same as profile) */}
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
                    ? <img src={gameCovers[g.game]} alt="" className="size-full object-cover" />
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
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventsPlayed.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5 transition hover:border-brand">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {e.cover ? <img src={e.cover} alt="" className="size-full object-cover" /> : null}
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
