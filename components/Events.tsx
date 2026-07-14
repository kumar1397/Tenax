"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Trophy, Users2, Calendar, MapPin, Plus } from "lucide-react";

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
};

const STATUS_MAP: Record<string, Event["status"]> = {
  upcoming: "Upcoming",
  ongoing: "Live",
  completed: "Completed",
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80";

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
    status: STATUS_MAP[row.event_status] ?? "Upcoming",
    participants: row.no_of_player ?? 0,
    capacity: row.total_player ?? 0,
    organizer: row.organizer ?? "—",
    cover: row.cover_image || FALLBACK_COVER,
  };
}

const gamesList = ["All", "InvincibleVS", "2XKO", "Valorant", "Dead by Daylight"];
const regionsList = ["All", "NA", "EU", "APAC", "LATAM", "Global"];
const statusList: Array<"All" | "Live" | "Upcoming" | "Completed"> = ["All", "Live", "Upcoming", "Completed"];
const formatList = ["All", "Single Elim", "Double Elim", "Round Robin", "Swiss"];
const entryList = ["All", "Free", "Paid"];

// Read ?status= once, synchronously, so the correct pill is active on first paint
function initialStatus(): typeof statusList[number] {
  if (typeof window === "undefined") return "All";
  const s = new URLSearchParams(window.location.search).get("status");
  return s === "Live" || s === "Upcoming" || s === "Completed" ? s : "All";
}

export default function EventsPage({ initialEvents }: { initialEvents: any[] }) {
  // Data arrives from the server — map once, no fetch, no loading state
  const [events] = useState<Event[]>(() => (initialEvents ?? []).map(toUiEvent));

  const [q, setQ] = useState("");
  const [game, setGame] = useState("All");
  const [region, setRegion] = useState("All");
  const [status, setStatus] = useState<typeof statusList[number]>(initialStatus);
  const [format, setFormat] = useState("All");
  const [entry, setEntry] = useState("All");
  const [prize, setPrize] = useState(0);

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

          <Link
            href="/events/create"
            className="inline-flex items-center justify-center gap-2 shrink-0 bg-gradient-brand text-white font-semibold px-5 py-2.5 rounded-lg shadow-glow hover:scale-[1.02] transition"
          >
            <Plus className="size-4" /> Create Event
          </Link>
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

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 h-fit lg:sticky lg:top-20 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <SlidersHorizontal className="size-4 text-primary" />
            <h3 className="font-bold">Filters</h3>
            <button onClick={() => { setGame("All"); setRegion("All"); setFormat("All"); setEntry("All"); setPrize(0); }} className="ml-auto text-xs text-muted-foreground hover:text-primary">Reset</button>
          </div>

          <FilterGroup label="Game" options={gamesList} value={game} onChange={setGame} />
          <FilterGroup label="Region" options={regionsList} value={region} onChange={setRegion} />
          <FilterGroup label="Format" options={formatList} value={format} onChange={setFormat} />
          <FilterGroup label="Entry" options={entryList} value={entry} onChange={setEntry} />

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Min Prize Pool</div>
            <input type="range" min={0} max={100000} step={1000} value={prize} onChange={(e) => setPrize(+e.target.value)} className="w-full accent-[#D7155C]" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$0</span><span className="text-gradient-brand font-bold">${prize.toLocaleString()}+</span><span>$100K</span>
            </div>
          </div>
        </aside>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((e) => (
            <Link href={`/events/${e.id}`} key={e.id} className="group rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden hover:border-brand transition shadow-card-soft">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img src={e.cover} alt={e.title} className="size-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={[
                    "px-2.5 py-1 rounded-full text-[10px] font-bold",
                    e.status === "Live" ? "bg-gradient-brand text-white shadow-glow" : "bg-black/60 backdrop-blur text-white",
                  ].join(" ")}>
                    {e.status === "Live" && <span className="inline-block size-1.5 rounded-full bg-white mr-1 align-middle animate-pulse" />}
                    {e.status.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-semibold">{e.game}</span>
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-gradient-brand text-white text-xs font-bold shadow-glow">{e.prize}</div>
              </div>
              <div className="p-4">
                <div className="font-bold truncate">{e.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{e.organizer}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <Meta icon={Calendar} text={new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                  <Meta icon={MapPin} text={e.region} />
                  <Meta icon={Users2} text={`${e.participants}/${e.capacity}`} />
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-brand" style={{ width: `${e.capacity ? (e.participants / e.capacity) * 100 : 0}%` }} />
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

function Meta({ icon: Icon, text }: any) {
  return <div className="flex items-center gap-1 text-muted-foreground"><Icon className="size-3" />{text}</div>;
}