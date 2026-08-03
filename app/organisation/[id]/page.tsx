import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createPublicClient } from "@/utils/supabase/public";
import { Building2, Trophy, Users, Crown, Gamepad2, ExternalLink, ArrowLeft, TrendingUp } from "lucide-react";

export const revalidate = 60;

const STATUS_LABEL: Record<string, string> = { upcoming: "Upcoming", ongoing: "Live", completed: "Completed" };

type Member = {
  id: number;
  player_name: string | null;
  handle: string | null;
  player_image: string | null;
  mmr: number | null;
  rank: string | null;
  region: string | null;
  game: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: org } = await supabase.from("orgs").select("name, tricode").eq("id", Number(id)).maybeSingle();
  if (!org) return { title: "Organization not found" };
  return {
    title: org.name,
    description: `${org.name}${org.tricode ? ` (${org.tricode})` : ""} — roster, events played, ranking, and cumulative MMR on Tenax.`,
  };
}

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orgId = Number(id);
  const supabase = createPublicClient();

  const [{ data: org }, { data: members }, { data: allUsers }] = await Promise.all([
    supabase.from("orgs").select("id, name, tricode, logo, link").eq("id", orgId).maybeSingle(),
    supabase
      .from("Users")
      .select("id, player_name, handle, player_image, mmr, rank, region, game")
      .eq("org_id", orgId)
      .order("mmr", { ascending: false, nullsFirst: false }),
    // org_id + mmr for every user — used to rank this org against all others
    supabase.from("Users").select("org_id, mmr"),
  ]);

  if (!org) notFound();

  const mem = (members ?? []) as Member[];
  const cumulativeMmr = mem.reduce((s, m) => s + (m.mmr ?? 0), 0);
  const avgMmr = mem.length ? Math.round(cumulativeMmr / mem.length) : 0;

  // Ranking among all orgs, by average member MMR (same metric as the leaderboard)
  const agg = new Map<number, { total: number; members: number }>();
  for (const u of allUsers ?? []) {
    if (!u.org_id) continue;
    const e = agg.get(u.org_id) ?? { total: 0, members: 0 };
    e.total += u.mmr ?? 0;
    e.members += 1;
    agg.set(u.org_id, e);
  }
  const standings = [...agg.entries()]
    .map(([oid, v]) => ({ oid, avg: v.members ? v.total / v.members : 0 }))
    .sort((a, b) => b.avg - a.avg);
  const rank = standings.findIndex((s) => s.oid === orgId) + 1; // 0 → unranked (no members)

  // Events the org's members have played (deduped across members)
  const memberIds = mem.map((m) => m.id);
  let events: { id: string; title: string; game: string; status: string; date: string; cover: string }[] = [];
  if (memberIds.length) {
    const { data: parts } = await supabase
      .from("event_participants")
      .select("Events(*)")
      .in("player_id", memberIds);
    const byId = new Map<string, any>();
    for (const r of parts ?? []) {
      const ev = (r as any).Events;
      if (ev && !byId.has(String(ev.id))) byId.set(String(ev.id), ev);
    }
    events = [...byId.values()].map((row) => ({
      id: String(row.id),
      title: row.event_name ?? "Untitled",
      game: row.game_name ?? "",
      status: STATUS_LABEL[row.event_status] ?? "Upcoming",
      date: row.event_date ?? "",
      cover: typeof row.cover_image === "string" && /^https?:\/\//.test(row.cover_image) ? row.cover_image : "",
    }));
  }

  const stats = [
    { label: "Ranking", value: rank > 0 ? `#${rank}` : "—", icon: Crown },
    { label: "Cumulative MMR", value: cumulativeMmr.toLocaleString(), icon: TrendingUp },
    { label: "Avg MMR", value: avgMmr.toLocaleString(), icon: Trophy },
    { label: "Players", value: String(mem.length), icon: Users },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link href="/organisation" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary">
        <ArrowLeft className="size-4" /> All organizations
      </Link>

      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-brand shadow-card-soft">
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_20%_10%,#C084FC_0%,#A855F7_35%,#5B21B6_75%,#2e1065_100%)]" />
        <div className="relative z-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:p-10">
          <div className="shrink-0">
            {org.logo ? (
              <img src={org.logo} alt="" className="size-24 rounded-2xl bg-white/10 object-cover ring-2 ring-white/25 md:size-28" />
            ) : (
              <div className="grid size-24 place-items-center rounded-2xl bg-white/10 ring-2 ring-white/25 md:size-28">
                <Building2 className="size-10 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-white md:text-5xl">{org.name}</h1>
              {org.tricode && <span className="rounded-md bg-black/30 px-2 py-1 text-sm font-bold text-white ring-1 ring-white/20">{org.tricode}</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {rank > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/20">
                  <Crown className="size-4" /> Ranked #{rank}
                </span>
              )}
              {org.link && (
                <a href={org.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-black/40">
                  <ExternalLink className="size-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <s.icon className="size-4 text-primary" /> {s.label}
            </div>
            <div className="mt-1.5 text-2xl font-bold text-gradient-brand md:text-3xl">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Players */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Players</h2>
          <span className="text-sm text-muted-foreground">({mem.length})</span>
        </div>
        {mem.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players in this organization yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mem.map((m) => {
              const name = m.player_name || m.handle || "Player";
              const sub = [m.handle ? `@${m.handle}` : "", m.region ?? ""].filter(Boolean).join(" · ");
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {m.player_image ? (
                      <img src={m.player_image} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center bg-gradient-brand text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{sub}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gradient-brand">{(m.mmr ?? 0).toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{m.rank || "MMR"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Events played */}
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Events Played</h2>
          <span className="text-sm text-muted-foreground">({events.length})</span>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">This organization hasn&apos;t played any events yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-2.5 transition hover:border-brand">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {e.cover ? <img src={e.cover} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><Gamepad2 className="size-4 text-muted-foreground" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {e.game}{e.date ? ` · ${new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                  </div>
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
