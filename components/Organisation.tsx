"use client";

import { useMemo, useState } from "react";
import { Trophy, Medal, Crown, Building2 } from "lucide-react";

type OrgRow = {
  name: string;
  tricode: string;
  logo: string;
  link: string;
  members: number;
  totalMmr: number;
  avgMmr: number;
};

const medalClass = (rank: number) => {
  if (rank === 1) return "from-yellow-300 to-amber-500 text-black";
  if (rank === 2) return "from-slate-200 to-slate-400 text-black";
  if (rank === 3) return "from-amber-600 to-amber-800 text-white";
  return "from-secondary to-secondary text-muted-foreground";
};

export default function OrgLeaderboard({ initialOrgs }: { initialOrgs: OrgRow[] }) {
  const [orgs] = useState<OrgRow[]>(initialOrgs ?? []);

  // Ranked strictly by average member MMR
  const ranked = useMemo(() => [...orgs].sort((a, b) => b.avgMmr - a.avgMmr), [orgs]);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Organizations</h1>
      </div>

      {/* Podium */}
      {top3.length === 3 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-8 items-end">
          {[top3[1], top3[0], top3[2]].map((o, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const isFirst = rank === 1;
            return (
              <div key={o.name} className={[
                "relative rounded-xl md:rounded-2xl border p-2.5 md:p-5 text-center overflow-hidden",
                isFirst ? "md:-mt-4 bg-gradient-brand-soft border-brand shadow-glow" : "bg-card/60 backdrop-blur border-border",
              ].join(" ")}>
                <div className={["absolute top-1.5 left-1.5 md:top-3 md:left-3 size-5 md:size-9 rounded-md md:rounded-xl grid place-items-center bg-gradient-to-br", medalClass(rank)].join(" ")}>
                  <Medal className="size-3 md:size-5" />
                </div>
                {isFirst && <Crown className="absolute top-1.5 right-1.5 md:top-3 md:right-3 size-4 md:size-5 text-primary" />}
                {o.logo
                  ? <img src={o.logo} alt="" className="size-10 md:size-16 mx-auto rounded-lg md:rounded-2xl bg-secondary" />
                  : <div className="size-10 md:size-16 mx-auto rounded-lg md:rounded-2xl bg-secondary grid place-items-center"><Building2 className="size-4 md:size-7 text-muted-foreground" /></div>}
                <div className="mt-2 md:mt-3 font-bold text-xs md:text-lg truncate">{o.name}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground truncate">{o.tricode} · {o.members}p</div>
                <div className="mt-2 md:mt-3 text-sm md:text-2xl font-bold text-gradient-brand">{o.avgMmr.toLocaleString()}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">avg MMR</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_56px_84px] sm:grid-cols-[60px_1fr_120px_140px] gap-x-2 px-3 py-3 sm:px-4 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border bg-secondary/40">
          <div>Rank</div><div>Org</div><div className="text-right sm:text-left">Players</div><div className="text-right">Avg MMR</div>
        </div>
        <div className="divide-y divide-border">
          {ranked.map((o, i) => (
            <div key={o.name} className="grid grid-cols-[40px_1fr_56px_84px] sm:grid-cols-[60px_1fr_120px_140px] gap-x-2 items-center px-3 py-3 sm:px-4 hover:bg-secondary/30 transition">
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
              <div className="text-sm text-right sm:text-left">{o.members}</div>
              <div className="text-right font-bold text-gradient-brand">{o.avgMmr.toLocaleString()}</div>
            </div>
          ))}
          {ranked.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="size-10 mx-auto mb-2 opacity-30" />No organizations yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}