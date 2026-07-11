"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrgStandings, type OrgRow } from "@/actions/event";
import { Trophy, Medal, Crown, Building2 } from "lucide-react";

const medalClass = (rank: number) => {
  if (rank === 1) return "from-yellow-300 to-amber-500 text-black";
  if (rank === 2) return "from-slate-200 to-slate-400 text-black";
  if (rank === 3) return "from-amber-600 to-amber-800 text-white";
  return "from-secondary to-secondary text-muted-foreground";
};

export default function OrgLeaderboardPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrgStandings().then((res) => {
      if (res.data) setOrgs(res.data);
      setLoading(false);
    });
  }, []);

  // Ranked strictly by average member MMR
  const ranked = useMemo(() => [...orgs].sort((a, b) => b.avgMmr - a.avgMmr), [orgs]);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading standings..." : `${ranked.length} orgs ranked by average MMR`}
        </p>
      </div>

      {/* Podium */}
      {top3.length === 3 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8 items-end">
          {[top3[1], top3[0], top3[2]].map((o, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const isFirst = rank === 1;
            return (
              <div key={o.name} className={[
                "relative rounded-2xl border p-5 text-center overflow-hidden",
                isFirst ? "md:-mt-4 bg-gradient-brand-soft border-brand shadow-glow" : "bg-card/60 backdrop-blur border-border",
              ].join(" ")}>
                <div className={["absolute top-3 left-3 size-9 rounded-xl grid place-items-center bg-gradient-to-br", medalClass(rank)].join(" ")}>
                  <Medal className="size-5" />
                </div>
                {isFirst && <Crown className="absolute top-3 right-3 size-5 text-primary" />}
                {o.logo
                  ? <img src={o.logo} alt="" className="size-16 mx-auto rounded-2xl bg-secondary" />
                  : <div className="size-16 mx-auto rounded-2xl bg-secondary grid place-items-center"><Building2 className="size-7 text-muted-foreground" /></div>}
                <div className="mt-3 font-bold text-lg truncate">{o.name}</div>
                <div className="text-xs text-muted-foreground">{o.tricode} · {o.members} players</div>
                <div className="mt-3 text-2xl font-bold text-gradient-brand">{o.avgMmr.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">avg MMR</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_120px_140px] px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border bg-secondary/40">
          <div>Rank</div><div>Org</div><div>Members</div><div className="text-right">Avg MMR</div>
        </div>
        <div className="divide-y divide-border">
          {ranked.map((o, i) => (
            <div key={o.name} className="grid grid-cols-[60px_1fr_120px_140px] items-center px-4 py-3 hover:bg-secondary/30 transition">
              {i < 3 ? (
                <div className={["size-8 rounded-lg grid place-items-center bg-gradient-to-br", medalClass(i + 1)].join(" ")}><Medal className="size-4" /></div>
              ) : (
                <div className="font-bold text-muted-foreground">#{i + 1}</div>
              )}
              <div className="flex items-center gap-3 min-w-0">
                {o.logo
                  ? <img src={o.logo} alt="" className="size-9 rounded-lg bg-secondary shrink-0" />
                  : <div className="size-9 rounded-lg bg-secondary grid place-items-center shrink-0"><Building2 className="size-4 text-muted-foreground" /></div>}
                <div className="min-w-0">
                  <div className="font-bold truncate">{o.name}</div>
                  <div className="text-[11px] text-muted-foreground">{o.tricode}</div>
                </div>
              </div>
              <div className="text-sm">{o.members}</div>
              <div className="text-right font-bold text-gradient-brand">{o.avgMmr.toLocaleString()}</div>
            </div>
          ))}
          {!loading && ranked.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="size-10 mx-auto mb-2 opacity-30" />No organizations yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}