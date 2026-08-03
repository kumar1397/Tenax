"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Trophy, Zap, Gamepad2, Play, Plus, X, MoreVertical, Tv, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "./useRole";
import { updateEventStream } from "@/actions/event";

type Event = {
  id: string;
  title: string;
  game: string;
  region: string;
  format: string;
  prize: string;
  entry: string;
  startsAt: string;
  status: "Live" | "Upcoming" | "Completed";
  participants: number;
  capacity: number;
  organizer: string;
  cover: string;
  streamUrl: string;
  eventTime: string;
};

const STATUS_MAP: Record<string, Event["status"]> = {
  upcoming: "Upcoming",
  ongoing: "Live",
  completed: "Completed",
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&q=75";

function toUiEvent(row: any): Event {
  return {
    id: String(row.id),
    title: row.event_name ?? "Untitled",
    game: row.game_name ?? "",
    region: row.event_region ?? "",
    format: row.event_format ?? "",
    prize: row.prize_pool ? `$${Number(row.prize_pool).toLocaleString()}` : "$0",
    entry: row.is_paid ? `$${row.event_fee ?? 0}` : "Free",
    startsAt: row.event_date ?? new Date().toISOString(),
    eventTime: row.event_time ?? "",
    status: STATUS_MAP[row.event_status] ?? "Upcoming",
    participants: row.no_of_player ?? 0,
    capacity: row.total_player ?? 0,
    organizer: row.organizer ?? "—",
    // Only trust real http(s) URLs — falls back for null/empty/junk values
    cover: typeof row.cover_image === "string" && /^https?:\/\//.test(row.cover_image)
      ? row.cover_image
      : FALLBACK_COVER,
    streamUrl: row.stream_url ?? "",
  };
}

const regionsList = ["All", "NA", "EU", "APAC", "LATAM", "Global"];
const statusList: Array<"All" | "Live" | "Upcoming" | "Completed"> = ["All", "Live", "Upcoming", "Completed"];
const formatList = ["All", "Single Elim", "Double Elim", "Round Robin", "Swiss"];
const entryList = ["All", "Free", "Paid"];

const STATUS_STYLE: Record<Event["status"], string> = {
  Live: "bg-emerald-500 text-white",
  Upcoming: "bg-amber-500 text-black",
  Completed: "bg-zinc-600 text-white",
};


export default function EventsPage({ initialEvents, games = [], gameCovers = {} }: { initialEvents: any[]; games?: string[]; gameCovers?: Record<string, string> }) {
  const { isAdmin } = useRole();
  const [events, setEvents] = useState<Event[]>(() => (initialEvents ?? []).map(toUiEvent));
  const [streamEditor, setStreamEditor] = useState<Event | null>(null);

  // Game filter options come from the `games` catalog table (data-driven)
  const gamesList = ["All", ...games];

  const searchParams = useSearchParams();

  const [q, setQ] = useState("");
  const [game, setGame] = useState(() => {
    // Deep-link support: /events?game=Valorant preselects the game filter.
    const g = searchParams.get("game");
    if (!g) return "All";
    return gamesList.find((x) => x.toLowerCase() === g.toLowerCase()) ?? "All";
  });
  const [region, setRegion] = useState("All");
  const [status, setStatus] = useState<typeof statusList[number]>(() => {
    const s = searchParams.get("status");
    return s === "Live" || s === "Upcoming" || s === "Completed" ? s : "All";
  });
  const [format, setFormat] = useState("All");
  const [entry, setEntry] = useState("All");
  const [prize, setPrize] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => events.filter((e) => {
    if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (game !== "All" && e.game !== game) return false;
    if (region !== "All" && e.region !== region) return false;
    if (status !== "All" && e.status !== status) return false;
    if (format !== "All" && e.format !== format) return false;
    if (entry === "Free" && e.entry !== "Free") return false;
    if (entry === "Paid" && e.entry === "Free") return false;
    const prizeNum = parseInt(e.prize.replace(/[^0-9]/g, ""), 10);
    if (prizeNum < prize) return false;
    return true;
  }), [events, q, game, region, status, format, entry, prize]);

  // Lock body scroll while the mobile filter drawer is open
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [filtersOpen]);

  const reset = () => { setGame("All"); setRegion("All"); setFormat("All"); setEntry("All"); setPrize(0); };

  const filterControls = (
    <>
      <FilterGroup label="Game" options={gamesList} value={game} onChange={setGame} />
      <FilterGroup label="Region" options={regionsList} value={region} onChange={setRegion} />
      <FilterGroup label="Format" options={formatList} value={format} onChange={setFormat} />
      <FilterGroup label="Entry" options={entryList} value={entry} onChange={setEntry} />

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Min Prize Pool</div>
        <input type="range" min={0} max={100000} step={1000} value={prize} onChange={(e) => setPrize(+e.target.value)} className="w-full accent-[#8B5CF6]" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>$0</span><span className="text-gradient-brand font-bold">${prize.toLocaleString()}+</span><span>$100K</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Tournaments</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search tournaments..."
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
            />
          </div>
          {isAdmin && (
            <Link
              href="/events/create"
              className="inline-flex items-center justify-center gap-2 shrink-0 bg-gradient-brand text-white font-semibold px-5 py-2.5 rounded-lg shadow-glow hover:scale-[1.02] transition"
            >
              <Plus className="size-4" /> Create Event
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusList.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={[
              "px-4 py-2 rounded-full text-sm font-semibold border transition",
              status === s ? "bg-gradient-brand text-white border-transparent shadow-glow" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-brand",
            ].join(" ")}>
            {s === "Live" && <span className="inline-block size-1.5 rounded-full bg-white mr-1.5 align-middle animate-pulse" />}
            {s}
          </button>
        ))}
      </div>

      {/* Mobile filter trigger */}
      <button
        onClick={() => setFiltersOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 mb-4 px-4 py-2.5 rounded-lg bg-card border border-border text-sm font-semibold hover:border-brand transition"
      >
        <SlidersHorizontal className="size-4 text-primary" /> Filters
      </button>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block rounded-2xl border border-border bg-card/60 p-5 h-fit lg:sticky lg:top-20 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <SlidersHorizontal className="size-4 text-primary" />
            <h3 className="font-bold">Filters</h3>
            <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-primary">Reset</button>
          </div>
          {filterControls}
        </aside>

        {/* Mobile filter drawer + backdrop */}
        <div className="lg:hidden">
          <div
            onClick={() => setFiltersOpen(false)}
            style={{ opacity: filtersOpen ? 1 : 0, transition: "opacity 300ms ease" }}
            className={["fixed inset-0 z-40 bg-background/70 backdrop-blur-sm", filtersOpen ? "" : "pointer-events-none"].join(" ")}
          />
          <aside
            style={{ transform: filtersOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 300ms ease" }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col bg-card border-r border-border shadow-card-soft"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <SlidersHorizontal className="size-4 text-primary" />
              <h3 className="font-bold">Filters</h3>
              <button onClick={reset} className="ml-auto mr-1 text-xs text-muted-foreground hover:text-primary">Reset</button>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid place-items-center size-8 rounded-lg border border-border text-muted-foreground hover:text-foreground transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">{filterControls}</div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setFiltersOpen(false)} className="w-full py-2.5 rounded-lg bg-gradient-brand text-white font-semibold shadow-glow hover:scale-[1.02] transition">
                Show {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </button>
            </div>
          </aside>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {filtered.map((e) => (
            <Link href={`/events/${e.id}`} key={e.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card-soft">
              {/* Cover */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={e.cover}
                  alt={e.title}
                  loading="lazy"
                  decoding="async"
                  onError={(ev) => { if (ev.currentTarget.src !== FALLBACK_COVER) ev.currentTarget.src = FALLBACK_COVER; }}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                {/* Status pill */}
                <span className={["absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold", STATUS_STYLE[e.status]].join(" ")}>
                  {e.status === "Live" && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                  {e.status.toUpperCase()}
                </span>

                {/* Live "watching" pill */}
                {e.status === "Live" && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {(e.participants * 12).toLocaleString()} watching
                  </span>
                )}

                {/* Play button — live events only */}
                {e.status === "Live" && (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid size-14 place-items-center rounded-full bg-white/15 ring-2 ring-white/70 backdrop-blur-sm transition group-hover:scale-105">
                      <Play className="size-5 translate-x-0.5 fill-white text-white" />
                    </span>
                  </div>
                )}

                {/* Game thumbnail */}
                {gameCovers[e.game] && (
                  <div className="absolute bottom-3 right-3 size-11 overflow-hidden rounded-lg ring-1 ring-white/25 shadow-lg">
                    <img
                      src={gameCovers[e.game]}
                      alt={e.game}
                      loading="lazy"
                      decoding="async"
                      onError={(ev) => { ev.currentTarget.parentElement!.style.display = "none"; }}
                      className="size-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <div className="text-[11px] text-muted-foreground">{formatWhen(e.startsAt, e.eventTime)}</div>

                <div className="mt-1.5 flex items-center gap-2">
                  <Gamepad2 className="size-4 shrink-0 text-primary" />
                  <div className="truncate font-bold">{e.title}</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Trophy className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Prize Pool</div>
                      <div className="truncate text-sm font-bold">{e.prize}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Game Mode</div>
                      <div className="truncate text-sm font-bold">{e.format || "—"}</div>
                    </div>
                    {isAdmin && (e.status === "Upcoming" || e.status === "Live") && (
                  <button
                    type="button"
                    aria-label="Add stream URL"
                    title={e.streamUrl ? "Edit stream URL" : "Add stream URL"}
                    onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setStreamEditor(e); }}
                    className="absolute top-3 right-3 z-10 grid place-items-center size-8 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                )}
              </div>
                </div>

                {/* Participants */}
                <div className="mt-auto pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{e.participants}/{e.capacity || "∞"} signed for the battle</span>
                    <span>{e.capacity ? Math.round((e.participants / e.capacity) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-gradient-brand" style={{ width: `${e.capacity ? Math.min(100, (e.participants / e.capacity) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Trophy className="size-12 mx-auto mb-3 opacity-30" />
              No tournaments match your filters.
            </div>
          )}
        </div>
      </div>

      {streamEditor && (
        <StreamUrlModal
          event={streamEditor}
          onClose={() => setStreamEditor(null)}
          onSaved={(url) => setEvents((prev) => prev.map((x) => (x.id === streamEditor.id ? { ...x, streamUrl: url } : x)))}
        />
      )}
    </div>
  );
}

function StreamUrlModal({ event, onClose, onSaved }: { event: Event; onClose: () => void; onSaved: (url: string) => void }) {
  const [url, setUrl] = useState(event.streamUrl ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await updateEventStream(Number(event.id), url);
    setSaving(false);
    if (res?.error) { toast.error(res.error); return; }
    toast.success("Stream URL saved");
    onSaved(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card-soft space-y-4">
        <div className="flex items-center gap-2">
          <Tv className="size-5 text-primary" />
          <h3 className="font-bold text-lg">{event.streamUrl ? "Edit" : "Add"} stream URL</h3>
        </div>
        <p className="text-sm text-muted-foreground truncate">{event.title}</p>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://twitch.tv/... or youtube.com/..."
          autoFocus
          className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand placeholder:text-muted-foreground"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary/40 transition">Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-semibold shadow-glow hover:scale-[1.02] transition disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: any) => void }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={[
            "px-2.5 py-1 rounded-md text-xs font-medium border transition",
            value === o ? "bg-gradient-brand text-white border-transparent" : "bg-secondary border-border text-muted-foreground hover:text-foreground",
          ].join(" ")}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function fmtTime(time: string) {
  const [hRaw, m] = time.slice(0, 5).split(":");
  let h = parseInt(hRaw, 10);
  if (Number.isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m ?? "00"} ${ampm}`;
}

function formatWhen(startsAt: string, time: string) {
  const date = new Date(startsAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const t = time ? fmtTime(time) : "";
  return t ? `${date} · starting at ${t}` : date;
}