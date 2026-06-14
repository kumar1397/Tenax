"use client";

import { useMemo, useState } from "react";
import { players } from "@/lib/mock";
import { Search, Trophy, Crown, TrendingUp } from "lucide-react";

const gameOpts = ["All", "Valorant", "League of Legends", "CS2", "Fortnite", "Apex Legends", "Rocket League", "Dota 2", "Overwatch 2"];
const regionOpts = ["All", "NA", "EU", "APAC", "LATAM", "Global"];

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [game, setGame] = useState("All");
  const [region, setRegion] = useState("All");
  const [sort, setSort] = useState<"rp" | "winrate">("rp");

  const filtered = useMemo(() => {
    let list = players.filter((p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.handle.includes(q.toLowerCase())) &&
      (game === "All" || p.game === game) &&
      (region === "All" || p.region === region)
    );
    list = [...list].sort((a, b) => sort === "rp" ? b.rp - a.rp : b.winrate - a.winrate);
    return list;
  }, [q, game, region, sort]);

  const top3 = filtered.slice(0, 3);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Players</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} competitors ranked globally</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
        </div>
      </div>

      {/* Podium */}
      {top3.length === 3 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[top3[1], top3[0], top3[2]].map((p, idx) => {
            const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
            return (
              <div key={p.id} className={[
                "relative rounded-2xl border p-5 text-center overflow-hidden",
                place === 1 ? "md:-mt-4 bg-gradient-brand-soft border-brand shadow-glow" : "bg-card/60 backdrop-blur border-border",
              ].join(" ")}>
                <div className="absolute top-3 left-3 size-8 rounded-lg bg-gradient-brand text-white grid place-items-center font-bold shadow-glow">#{place}</div>
                {place === 1 && <Crown className="absolute top-3 right-3 size-5 text-primary" />}
                <img src={p.avatar} alt="" className="size-20 mx-auto rounded-2xl bg-secondary" />
                <div className="mt-3 font-bold text-lg">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.game}</div>
                <div className="mt-3 text-2xl font-bold text-gradient-brand">{p.rp} RP</div>
                <div className="text-xs text-muted-foreground">{p.winrate}% win rate</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Group value={game} onChange={setGame} options={gameOpts} />
        <Group value={region} onChange={setRegion} options={regionOpts} />
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by</span>
          <button onClick={() => setSort("rp")} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${sort === "rp" ? "bg-gradient-brand text-white border-transparent" : "bg-card border-border"}`}>RP</button>
          <button onClick={() => setSort("winrate")} className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${sort === "winrate" ? "bg-gradient-brand text-white border-transparent" : "bg-card border-border"}`}>Win Rate</button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="grid grid-cols-[60px_1fr_120px_100px_120px_100px] px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border bg-secondary/40">
          <div>Rank</div><div>Player</div><div>Game</div><div>Region</div><div className="text-right">RP</div><div className="text-right">Win %</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[60px_1fr_120px_100px_120px_100px] items-center px-4 py-3 hover:bg-secondary/30 transition">
              <div className="font-bold text-muted-foreground">#{i + 1}</div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img src={p.avatar} alt="" className="size-10 rounded-lg bg-secondary" />
                  <span className={[
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                    p.status === "Online" ? "bg-green-500" : p.status === "In Match" ? "bg-primary" : "bg-muted",
                  ].join(" ")} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">@{p.handle}</div>
                </div>
              </div>
              <div className="text-sm">{p.game}</div>
              <div className="text-sm text-muted-foreground">{p.region}</div>
              <div className="text-right font-bold text-gradient-brand">{p.rp.toLocaleString()}</div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  <TrendingUp className="size-3 text-primary" />{p.winrate}%
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="size-10 mx-auto mb-2 opacity-30" />No players match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={[
          "px-3 py-1.5 rounded-md text-xs font-semibold border transition",
          value === o ? "bg-gradient-brand text-white border-transparent" : "bg-card border-border text-muted-foreground hover:text-foreground",
        ].join(" ")}>{o}</button>
      ))}
    </div>
  );
}