// app/orgs/page.tsx  (Server Component — fetches + aggregates, then passes down)
import type { Metadata } from "next";
import OrgLeaderboard from "@/components/Organisation";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Team and organization standings ranked by average member MMR.",
};

export const revalidate = 60;

export default async function Page() {
  const supabase = createPublicClient();

  const [{ data: orgs }, { data: users }] = await Promise.all([
    supabase.from("orgs").select("id, name, tricode, logo, link"),
    supabase.from("Users").select("org_id, mmr, game"),
  ]);

  // Aggregate members + avg MMR per org, plus a per-game breakdown so the
  // client can filter/re-rank by game without another round trip.
  type Bucket = { members: number; total: number };
  const agg = new Map<number, Bucket & { byGame: Map<string, Bucket> }>();
  for (const u of users ?? []) {
    if (!u.org_id) continue;
    const e = agg.get(u.org_id) ?? { members: 0, total: 0, byGame: new Map<string, Bucket>() };
    e.members += 1;
    e.total += u.mmr ?? 0;
    const g = (u.game ?? "").trim();
    if (g) {
      const gb = e.byGame.get(g) ?? { members: 0, total: 0 };
      gb.members += 1;
      gb.total += u.mmr ?? 0;
      e.byGame.set(g, gb);
    }
    agg.set(u.org_id, e);
  }

  const rows = (orgs ?? [])
    .map((o) => {
      const a = agg.get(o.id) ?? { members: 0, total: 0, byGame: new Map<string, Bucket>() };
      const byGame: Record<string, { members: number; avgMmr: number }> = {};
      for (const [g, gb] of a.byGame) {
        byGame[g] = { members: gb.members, avgMmr: gb.members ? Math.round(gb.total / gb.members) : 0 };
      }
      return {
        name: o.name,
        tricode: o.tricode ?? "",
        logo: o.logo ?? "",
        link: o.link ?? "",
        members: a.members,
        totalMmr: a.total,
        avgMmr: a.members ? Math.round(a.total / a.members) : 0,
        byGame,
      };
    })
    .filter((o) => o.members > 0);

  return <OrgLeaderboard initialOrgs={rows} />;
}