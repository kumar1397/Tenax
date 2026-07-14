"use client";

import { useMemo, useState } from "react";
import { Search, Trophy, Crown, TrendingUp, ChevronDown } from "lucide-react";

type Player = {
  id: string;
  name: string;
  handle: string;
  game: string;
  region: string;
  mmr: number;
  rank: string;
  winrate: number;
  hours: number;
  status: string;
  avatar: string;
  orgName: string;
  orgTricode: string;
  orgLogo: string;
  orgLink: string;
};

function toPlayer(row: any): Player {
  return {
    id: String(row.id),
    name: row.player_name ?? "Unknown",
    handle: row.handle ?? "",
    game: row.game ?? "",
    region: row.region ?? "",
    mmr: row.mmr ?? 0,
    rank: row.rank ?? "",
    winrate: row.win_rate ?? 0,
    hours: row.hours_played ?? 0,
    status: row.status ?? "Offline",
    avatar: row.player_image ?? "",
    orgName: row.org_name ?? "",
    orgTricode: row.org_tricode ?? "",
    orgLogo: row.org_logo ?? "",
    orgLink: row.org_link ?? "",
  };
}

function Avatar({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  if (src) {
    return <img src={src} alt={name} className={`object-cover bg-secondary ${className}`} />;
  }
  return (
    <div className={`bg-gradient-brand grid place-items-center text-white font-bold ${className}`}>
      {initial}
    </div>
  );
}

const gameOpts = ["All", "InvincibleVS", "2XKO", "Valorant", "Dead by Daylight"];
const regionOpts = ["All", "NA", "EU", "APAC", "LATAM", "Global"];
type SortKey = "mmr" | "winrate" | "duration" | "org";
const sortOpts: { value: SortKey; label: string }[] = [
  { value: "mmr", label: "MMR" },
  { value: "winrate", label: "Win Rate" },
  { value: "duration", label: "Duration" },
  { value: "org", label: "Org" },
];

export default function UsersPage({ initialPlayers }: { initialPlayers: any[] }) {
  // Data arrives from the server — map once, no fetch, no loading state
  const [players] = useState<Player[]>(() => (initialPlayers ?? []).map(toPlayer));

  const [q, setQ] = useState("");
  const [game, setGame] = useState("All");
  const [region, setRegion] = useState("All");
  const [org, setOrg] = useState("All");
  const [sort, setSort] = useState<SortKey>("mmr");

  const orgOpts = useMemo(() => {
    const names = Array.from(new Set(players.map((p) => p.orgName).filter(Boolean))).sort();
    return ["All", ...names];
  }, [players]);

  const filtered = useMemo(() => {
    let list = players.filter((p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.handle.includes(q.toLowerCase())) &&
      (game === "All" || p.game === game) &&
      (region === "All" || p.region === region) &&
      (org === "All" || p.orgName === org)
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "winrate": return b.winrate - a.winrate;
        case "duration": return b.hours - a.hours;
        case "org": return a.orgName.localeCompare(b.orgName) || b.mmr - a.mmr;
        default: return b.mmr - a.mmr;
      }
    });
    return list;
  }, [players, q, game, region, org, sort]);

  const top3 = filtered.slice(0, 3);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Players</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
        </div>
      </div>

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
                <Avatar src={p.avatar} name={p.name} className="size-20 mx-auto rounded-2xl text-2xl" />
                <div className="mt-3 font-bold text-lg">{p.name}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  {p.orgLogo && <img src={p.orgLogo} alt="" className="size-4 rounded" />}
                  {p.orgTricode || p.game}
                </div>
                <div className="mt-3 text-2xl font-bold text-gradient-brand">{p.mmr.toLocaleString()} MMR</div>
                <div className="text-xs text-muted-foreground">{p.winrate}% win &middot; {p.hours.toLocaleString()}h</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select label="Game" value={game} onChange={setGame} options={gameOpts} />
        <Select label="Region" value={region} onChange={setRegion} options={regionOpts} />
        <Select label="Org" value={org} onChange={setOrg} options={orgOpts} />
        <div className="ml-auto">
          <Select
            label="Sort by"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={sortOpts.map((s) => s.value)}
            labels={Object.fromEntries(sortOpts.map((s) => [s.value, s.label]))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="grid grid-cols-[50px_1fr_130px_120px_90px_110px_80px] px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border bg-secondary/40">
          <div>Rank</div><div>Player</div><div>Org</div><div>Game</div><div>Region</div><div className="text-right">MMR</div><div className="text-right">Win %</div>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[50px_1fr_130px_120px_90px_110px_80px] items-center px-4 py-3 hover:bg-secondary/30 transition">
              <div className="font-bold text-muted-foreground">#{i + 1}</div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <Avatar src={p.avatar} name={p.name} className="size-10 rounded-lg text-base" />
                  <span className={[
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                    p.status === "Online" ? "bg-green-500" : p.status === "In Match" ? "bg-primary" : "bg-muted",
                  ].join(" ")} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">@{p.handle} &middot; {p.hours.toLocaleString()}h</div>
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                {p.orgLogo && <img src={p.orgLogo} alt="" className="size-6 rounded bg-secondary shrink-0" />}
                <span className="text-sm font-semibold truncate">{p.orgTricode || "\u2014"}</span>
              </div>
              <div className="text-sm truncate">{p.game}</div>
              <div className="text-sm text-muted-foreground">{p.region}</div>
              <div className="text-right">
                <div className="font-bold text-gradient-brand">{p.mmr.toLocaleString()}</div>
                {p.rank && <div className="text-[10px] text-muted-foreground">{p.rank}</div>}
              </div>
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

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring/60 cursor-pointer min-w-[120px]"
        >
          {options.map((o) => (
            <option key={o} value={o}>{labels?.[o] ?? o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      </div>
    </label>
  );
}