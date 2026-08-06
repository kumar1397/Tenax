"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Users2, Trophy, Trash2, Pencil, Plus, Loader2, ShieldCheck, ShieldPlus, ShieldMinus, Gamepad2, ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { deletePlayer, setPlayerRole } from "@/actions/admin";
import { deleteEvent } from "@/actions/event";

type PlayerRow = { id: number; name: string; handle: string; image: string; mmr: number; region: string; role: string; org: string };
type EventRow = { id: string; title: string; game: string; region: string; format: string; status: string; date: string; time: string; cover: string; prize: string; prizeNum: number; paid: boolean; participants: number; capacity: number };

const STATUS_STYLE: Record<string, string> = {
  Live: "bg-emerald-500 text-white",
  Upcoming: "bg-amber-500 text-black",
  Completed: "bg-zinc-600 text-white",
};

const STATUSES = ["All", "Live", "Upcoming", "Completed"];
const REGIONS = ["All", "NA", "EU", "APAC", "LATAM", "Global"];
const FORMATS = ["All", "Single Elimination", "Double Elimination", "Round Robin", "Swiss"];
const ENTRIES = ["All", "Free", "Paid"];

const eventTime = (date: string, time: string) =>
  date ? new Date(`${date}T${(time || "00:00").slice(0, 5)}`).getTime() : 0;

export default function AdminDashboard({
  players: p0,
  events: e0,
  gameCovers,
  games,
}: {
  players: PlayerRow[];
  events: EventRow[];
  gameCovers: Record<string, string>;
  games: string[];
}) {
  const [tab, setTab] = useState<"players" | "events">("players");
  const [players, setPlayers] = useState(p0);
  const [events, setEvents] = useState(e0);
  const [sort, setSort] = useState<"soon" | "late">("late");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Event filters (mirrors the /events page)
  const [status, setStatus] = useState("All");
  const [game, setGame] = useState("All");
  const [region, setRegion] = useState("All");
  const [format, setFormat] = useState("All");
  const [entry, setEntry] = useState("All");
  const [minPrize, setMinPrize] = useState(0);
  const gameOptions = ["All", ...games];
  const resetFilters = () => { setStatus("All"); setGame("All"); setRegion("All"); setFormat("All"); setEntry("All"); setMinPrize(0); };

  const filteredPlayers = players.filter(
    (p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.handle.toLowerCase().includes(q.toLowerCase())
  );

  const sortedEvents = [...events].sort((a, b) =>
    sort === "soon" ? eventTime(a.date, a.time) - eventTime(b.date, b.time) : eventTime(b.date, b.time) - eventTime(a.date, a.time)
  );

  const shown = sortedEvents.filter((e) =>
    (status === "All" || e.status === status) &&
    (game === "All" || e.game === game) &&
    (region === "All" || e.region === region) &&
    (format === "All" || e.format === format) &&
    (entry === "All" || (entry === "Free" ? !e.paid : e.paid)) &&
    e.prizeNum >= minPrize
  );

  async function onDeletePlayer(p: PlayerRow) {
    if (!confirm(`Delete ${p.name}'s profile? This permanently removes their account and registrations.`)) return;
    setBusy("p" + p.id);
    const res = await deletePlayer(p.id);
    setBusy(null);
    if (res.error) { toast.error(res.error); return; }
    setPlayers((xs) => xs.filter((x) => x.id !== p.id));
    toast.success("Player deleted");
  }

  async function onToggleRole(p: PlayerRow) {
    const makeAdmin = p.role !== "admin";
    if (!confirm(makeAdmin ? `Make ${p.name} an admin?` : `Remove admin access from ${p.name}?`)) return;
    setBusy("r" + p.id);
    const res = await setPlayerRole(p.id, makeAdmin ? "admin" : "user");
    setBusy(null);
    if (res.error) { toast.error(res.error); return; }
    setPlayers((xs) => xs.map((x) => (x.id === p.id ? { ...x, role: makeAdmin ? "admin" : "user" } : x)));
    toast.success(makeAdmin ? `${p.name} is now an admin` : "Admin access removed");
  }

  async function onDeleteEvent(e: EventRow) {
    if (!confirm(`Delete "${e.title}"? This removes the event and all its registrations.`)) return;
    setBusy("e" + e.id);
    const res = await deleteEvent(Number(e.id));
    setBusy(null);
    if (res.error) { toast.error(res.error); return; }
    setEvents((xs) => xs.filter((x) => x.id !== e.id));
    toast.success("Event deleted");
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="size-9 grid place-items-center rounded-lg bg-gradient-brand shadow-glow"><ShieldCheck className="size-5 text-white" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Control</h1>
          <p className="text-sm text-muted-foreground">Manage players and events.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {([
          { k: "players", label: `Players (${players.length})`, Icon: Users2 },
          { k: "events", label: `Events (${events.length})`, Icon: Trophy },
        ] as const).map(({ k, label, Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition",
              tab === k ? "border-transparent bg-gradient-brand text-white shadow-glow" : "border-border bg-card text-muted-foreground hover:border-brand hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {/* Players */}
      {tab === "players" && (
        <div>
          <div className="relative mb-4 w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players..." className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card/60">
            <div className="grid grid-cols-[1fr_72px_96px] sm:grid-cols-[1fr_120px_80px_90px_96px] gap-x-2 border-b border-border bg-secondary/40 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <div>Player</div><div className="hidden sm:block">Org</div><div className="hidden sm:block">Region</div><div className="text-right">MMR</div><div className="text-right">Action</div>
            </div>
            <div className="divide-y divide-border">
              {filteredPlayers.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_72px_96px] sm:grid-cols-[1fr_120px_80px_90px_96px] items-center gap-x-2 px-4 py-3 hover:bg-secondary/20">
                  <Link href={`/players/${p.id}`} className="flex min-w-0 items-center gap-3 hover:text-primary">
                    <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary">
                      {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : <span className="text-xs font-bold">{(p.name[0] ?? "?").toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate font-semibold">
                        {p.name}
                        {p.role === "admin" && <span className="rounded bg-gradient-brand px-1.5 py-0.5 text-[9px] font-bold text-white">ADMIN</span>}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">{p.handle ? `@${p.handle}` : ""}</div>
                    </div>
                  </Link>
                  <div className="hidden truncate text-sm sm:block">{p.org || "—"}</div>
                  <div className="hidden text-sm text-muted-foreground sm:block">{p.region || "—"}</div>
                  <div className="text-right font-bold text-gradient-brand">{p.mmr.toLocaleString()}</div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onToggleRole(p)}
                      disabled={busy === "r" + p.id}
                      title={p.role === "admin" ? "Remove admin" : "Make admin"}
                      aria-label={p.role === "admin" ? "Remove admin" : "Make admin"}
                      className="inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-brand hover:text-primary disabled:opacity-50"
                    >
                      {busy === "r" + p.id ? <Loader2 className="size-4 animate-spin" /> : p.role === "admin" ? <ShieldMinus className="size-4" /> : <ShieldPlus className="size-4" />}
                    </button>
                    <button
                      onClick={() => onDeletePlayer(p)}
                      disabled={busy === "p" + p.id}
                      title="Delete player"
                      aria-label="Delete player"
                      className="inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-red-400/50 hover:text-red-400 disabled:opacity-50"
                    >
                      {busy === "p" + p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {filteredPlayers.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No players found.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {tab === "events" && (
        <div>
          {/* Status tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                status === s ? "border-transparent bg-gradient-brand text-white shadow-glow" : "border-border bg-card text-muted-foreground hover:border-brand hover:text-foreground",
              ].join(" ")}>
                {s === "Live" && <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-white align-middle" />}
                {s}
              </button>
            ))}
          </div>

          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
            {/* Filters */}
            <aside className="mb-6 h-fit space-y-6 rounded-2xl border border-border bg-card/60 p-5 lg:sticky lg:top-20 lg:mb-0">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <SlidersHorizontal className="size-4 text-primary" />
                <h3 className="font-bold">Filters</h3>
                <button onClick={resetFilters} className="ml-auto text-xs text-muted-foreground hover:text-primary">Reset</button>
              </div>
              <FilterGroup label="Game" options={gameOptions} value={game} onChange={setGame} />
              <FilterGroup label="Region" options={REGIONS} value={region} onChange={setRegion} />
              <FilterGroup label="Format" options={FORMATS} value={format} onChange={setFormat} />
              <FilterGroup label="Entry" options={ENTRIES} value={entry} onChange={setEntry} />
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Prize Pool</div>
                <input type="range" min={0} max={100000} step={1000} value={minPrize} onChange={(e) => setMinPrize(+e.target.value)} className="w-full accent-[#8B5CF6]" />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>$0</span><span className="font-bold text-gradient-brand">${minPrize.toLocaleString()}+</span><span>$100K</span>
                </div>
              </div>
            </aside>

            {/* Right column */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <ArrowUpDown className="size-4 text-primary" />
                  <span className="text-muted-foreground">Sort by time</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as "soon" | "late")} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-brand focus:outline-none">
                    <option value="late">Newest first</option>
                    <option value="soon">Oldest first</option>
                  </select>
                </label>
                <span className="text-sm text-muted-foreground">{shown.length} shown</span>
                <Link href="/events/create" className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]">
                  <Plus className="size-4" /> Create Event
                </Link>
              </div>

              {shown.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No events match your filters.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {shown.map((e) => (
                    <div key={e.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card-soft">
                  <div className="relative aspect-[16/10]">
                    {e.cover ? <img src={e.cover} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-secondary"><Gamepad2 className="size-8 text-muted-foreground" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    <span className={["absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold", STATUS_STYLE[e.status] ?? "bg-black/60 text-white"].join(" ")}>{e.status.toUpperCase()}</span>
                    {gameCovers[e.game] && (
                      <div className="absolute bottom-3 right-3 size-10 overflow-hidden rounded-lg ring-1 ring-white/25">
                        <img src={gameCovers[e.game]} alt="" className="size-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/events/${e.id}`} className="truncate font-bold hover:text-primary">{e.title}</Link>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {e.game}
                      {e.date ? ` · ${new Date(`${e.date}T${(e.time || "00:00").slice(0, 5)}`).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-gradient-brand">{e.prize}</span>
                      <span className="text-muted-foreground">{e.participants}/{e.capacity || "∞"}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/events/${e.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-semibold transition hover:border-brand">
                        <Pencil className="size-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => onDeleteEvent(e)}
                        disabled={busy === "e" + e.id}
                        aria-label="Delete event"
                        className="inline-flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-red-400/50 hover:text-red-400 disabled:opacity-50"
                      >
                        {busy === "e" + e.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={[
              "rounded-md border px-2.5 py-1 text-xs font-medium transition",
              value === o ? "border-transparent bg-gradient-brand text-white" : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
