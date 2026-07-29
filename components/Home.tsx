"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { JoinDiscord } from "@/components/JoinDiscord";

type Event = {
  id: string;
  title: string;
  game: string;
  region: string;
  format: string;
  prize: string;
  status: "Live" | "Upcoming" | "Completed";
  participants: number;
  organizer: string;
  cover: string;
  startsAt: string;
};

const STATUS_MAP: Record<string, Event["status"]> = {
  upcoming: "Upcoming",
  ongoing: "Live",
  completed: "Completed",
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80";

const HERO_CHARACTERS = ["/hero-2.png"];
const HERO_ROTATE_MS = 4000;

function toUiEvent(row: any): Event {
  return {
    id: String(row.id),
    title: row.event_name ?? "Untitled",
    game: row.game_name ?? "",
    region: row.event_region ?? "",
    format: row.event_format ?? "",
    prize: row.prize_pool ? `$${Number(row.prize_pool).toLocaleString()}` : "Free",
    status: STATUS_MAP[row.event_status] ?? "Upcoming",
    participants: row.no_of_player ?? 0,
    organizer: row.organizer ?? "—",
    cover: row.cover_image || FALLBACK_COVER,
    startsAt: row.event_date ?? new Date().toISOString(),
  };
}

export default function Home({ initialEvents, gameCovers = {}, topPlayers = [] }: { initialEvents: any[]; gameCovers?: Record<string, string>; topPlayers?: { name: string; handle: string; image: string; mmr: number }[] }) {
  const [events] = useState<Event[]>(() => (initialEvents ?? []).map(toUiEvent));

  const liveAll = events.filter((e) => e.status === "Live");
  const upcomingAll = events.filter((e) => e.status !== "Completed");

  // Top games ranked by total participants across their events (no extra query —
  // aggregated from the events we already have).
  const topGames = (() => {
    const coverOf = (c: string) => (typeof c === "string" && /^https?:\/\//.test(c) ? c : FALLBACK_COVER);
    const map = new Map<string, { game: string; participants: number; events: number; cover: string; _top: number }>();
    for (const e of events) {
      if (!e.game) continue;
      const cur = map.get(e.game) ?? { game: e.game, participants: 0, events: 0, cover: coverOf(e.cover), _top: -1 };
      cur.participants += e.participants;
      cur.events += 1;
      if (e.participants > cur._top) { cur._top = e.participants; cur.cover = coverOf(e.cover); }
      map.set(e.game, cur);
    }
    return [...map.values()]
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 5)
      // Prefer the game's own cover from the DB; fall back to the top event's cover
      .map(({ game, participants, events, cover }) => ({ game, participants, events, cover: gameCovers[game] || cover }));
  })();

  return (
    <div className="p-6 space-y-2 max-w-[1600px] mx-auto">
      {/* Hero */}
      <section className="relative z-10 mt-2 rounded-3xl border border-brand shadow-card-soft min-h-[460px] md:mt-12 md:min-h-[600px]">
        {/* Backdrop — clipped to the rounded card so the character can still spill out the top */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_72%_25%,#C084FC_0%,#A855F7_30%,#7C3AED_58%,#5B21B6_100%)]" />
          <CircuitBoard />
          <div className="absolute right-[16%] top-1/2 aspect-square w-[55%] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(228,200,255,0.7),transparent_72%)] blur-3xl" />
        </div>


        <div className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
          Live
          <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
        </div>

        <HeroCharacter />

        {/* Content */}
        <div className="relative z-10 flex min-h-[440px] items-center p-8 md:min-h-[600px] md:p-12 md:pl-16">
          <div className="max-w-xl">
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70 md:text-base">
              Esports Hub
            </div>
            <h1 className="mt-3 text-6xl font-bold leading-none text-white md:text-8xl">
              Tenax
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/80 md:text-lg">
              Join 50,000+ players battling across 40 titles. Track tournaments, climb the leaderboards, and earn glory.
            </p>
            <Link
              href="/events"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#3b1d78] py-3 pl-7 pr-3 text-base font-semibold text-white shadow-glow transition hover:bg-[#4c268f] hover:scale-[1.02] md:text-lg"
            >
              Explore Tournaments
              <span className="grid size-9 place-items-center rounded-full bg-white/20">
                <Play className="size-4 fill-white text-white" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    <div className="mt-20 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      <PopularGames games={topGames} />
      <CarouselSection
        title="Live Right Now"
        items={liveAll}
        empty="No live tournaments right now."
        itemClass="w-[85%] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)]"
        render={(e) => <LiveCard event={e} />}
      />
    </div>

      <div className="my-20 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <TopPlayers players={topPlayers} />
        <CarouselSection
          title="Upcoming Tournaments"
          items={upcomingAll}
          empty="No upcoming tournaments yet."
          itemClass="w-[85%] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)]"
          render={(e) => <EventCard event={e} />}
        />
      </div>

      <div className="mb-6">
        <JoinDiscord />
      </div>
    </div>
  );
}

function PopularGames({ games }: { games: { game: string; participants: number; events: number; cover: string }[] }) {
  if (games.length === 0) return null;
  return (
    <section className="mt-18 rounded-3xl border border-brand bg-gradient-to-b from-[#2e1b5e] to-[#191033] p-4 text-violet-50 shadow-card-soft">
      <h2 className="mb-3 px-1 text-xl font-bold sm:text-2xl">
        <span className="text-gradient-brand">Popular</span> Games
      </h2>
      <div className="space-y-1">
        {games.map((g, i) => (
          <Link
            key={g.game}
            href="/events"
            className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
          >
            <div className="relative shrink-0">
              <img
                src={g.cover}
                alt=""
                onError={(e) => { if (e.currentTarget.src !== FALLBACK_COVER) e.currentTarget.src = FALLBACK_COVER; }}
                className="size-12 rounded-lg object-cover ring-1 ring-white/10"
              />
              <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-[#2e1b5e] shadow">
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">{g.game}</div>
              <div className="text-[11px] text-violet-200/70">
                {g.participants.toLocaleString()} players · {g.events} {g.events === 1 ? "event" : "events"}
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-violet-200/60 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopPlayers({ players }: { players: { name: string; handle: string; image: string; mmr: number }[] }) {
  if (players.length === 0) return null;
  return (
    <section className="mt-18 rounded-3xl border border-brand bg-gradient-to-b from-[#2e1b5e] to-[#191033] p-4 text-violet-50 shadow-card-soft">
      <h2 className="mb-3 px-1 text-xl font-bold sm:text-2xl">
        <span className="text-gradient-brand">Top</span> Players
      </h2>
      <div className="space-y-1">
        {players.map((p, i) => (
          <Link
            key={`${p.name}-${i}`}
            href="/players"
            className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
          >
            <div className="relative size-12 shrink-0">
              {/* Initial as the base so a broken image still shows a fallback */}
              <div className="grid size-12 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-white ring-1 ring-white/10">
                {p.name.charAt(0).toUpperCase() || "?"}
              </div>
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className="absolute inset-0 size-12 rounded-full object-cover ring-1 ring-white/10"
                />
              )}
              <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-[#2e1b5e] shadow">
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">{p.name}</div>
              <div className="text-[11px] text-violet-200/70">
                {p.mmr.toLocaleString()} MMR{p.handle ? ` · @${p.handle}` : ""}
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-violet-200/60 opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function CircuitBoard() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-white/[0.14] [mask-image:radial-gradient(ellipse_at_center,black,transparent_88%)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="tenax-circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M0 24 H36 V60 H84 V24 H120" />
            <path d="M24 0 V36 H60 V84 H24 V120" />
            <path d="M60 84 H96 V120" />
            <path d="M84 24 V0" />
            <path d="M96 60 H120" />
          </g>
          <g fill="currentColor">
            <circle cx="36" cy="24" r="3.5" />
            <circle cx="84" cy="60" r="3.5" />
            <circle cx="24" cy="36" r="3.5" />
            <circle cx="60" cy="84" r="3.5" />
            <circle cx="96" cy="120" r="3.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tenax-circuit)" />
    </svg>
  );
}

function HeroCharacter() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (HERO_CHARACTERS.length < 2) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % HERO_CHARACTERS.length),
      HERO_ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-[15] hidden w-3/5 md:block">
      {HERO_CHARACTERS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className={[
            "absolute -bottom-6 right-[12%] h-[700px] w-auto max-w-none object-contain object-bottom drop-shadow-2xl transition-opacity duration-1000",
            i === active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function CarouselSection({
  title,
  items,
  empty,
  itemClass,
  render,
}: {
  title: string;
  items: Event[];
  empty: string;
  itemClass: string;
  render: (event: Event) => React.ReactNode;
}) {
  const [first, ...rest] = title.split(" ");
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Arrows only make sense when there are more cards than the 3 that fit.
  const showArrows = items.length > 3;

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    if (!showArrows) return;
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [showArrows, items.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="min-w-0">
      <div className="relative mb-4 flex items-center justify-between gap-3 sm:justify-center">
        <h2 className="text-2xl font-bold sm:text-center sm:text-4xl">
          <span className="text-gradient-brand">{first}</span>
          {rest.length > 0 ? ` ${rest.join(" ")}` : ""}
        </h2>
        {showArrows && (
          <div className="flex gap-2 sm:absolute sm:right-0">
            <CarouselArrow dir="left" active={!atStart} onClick={() => scrollByPage(-1)} />
            <CarouselArrow dir="right" active={!atEnd} onClick={() => scrollByPage(1)} />
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{empty}</p>
      ) : (
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((event) => (
            <div key={event.id} className={itemClass}>
              {render(event)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CarouselArrow({ dir, active, onClick }: { dir: "left" | "right"; active: boolean; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Previous" : "Next"}
      onClick={onClick}
      disabled={!active}
      className={[
        "grid size-10 place-items-center rounded-full transition",
        active
          ? "bg-primary text-white shadow-glow hover:scale-105 active:scale-95"
          : "cursor-not-allowed border border-border bg-card text-muted-foreground/40",
      ].join(" ")}
    >
      <Icon className="size-5" />
    </button>
  );
}

// Distinct colour per status so the badge reads at a glance
const STATUS_STYLE: Record<Event["status"], string> = {
  Live: "bg-emerald-500 text-white",
  Upcoming: "bg-amber-500 text-black",
  Completed: "bg-zinc-600 text-white",
};

function StatusBadge({ status }: { status: Event["status"] }) {
  return (
    <span className={["inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", STATUS_STYLE[status]].join(" ")}>
      {status === "Live" && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
      {status}
    </span>
  );
}

// Per-game accent so the game capsule is identifiable at a glance
const GAME_STYLE: Record<string, string> = {
  InvincibleVS: "bg-violet-500/85 text-white",
  "2XKO": "bg-sky-500/85 text-white",
  Valorant: "bg-rose-500/85 text-white",
  "Dead by Daylight": "bg-teal-500/85 text-white",
};
const gameStyle = (g: string) => GAME_STYLE[g] ?? "bg-black/60 text-white";

function LiveCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="relative overflow-hidden rounded-2xl border border-border shadow-card-soft">
      <div className="aspect-[16/10] relative">
        <img src={event.cover} alt={event.title} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-glow">
            <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <span className={["px-2.5 py-1 rounded-full text-[10px] font-semibold", gameStyle(event.game)].join(" ")}>{event.game}</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-gradient-brand text-white text-[11px] font-semibold">
          {(event.participants * 12).toLocaleString()} viewers
        </div>
      </div>
      <div className="p-4 bg-card">
        <div className="font-bold truncate">{event.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{event.organizer} · {event.region}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gradient-brand font-bold">{event.prize}</span>
          <span className="text-muted-foreground">{event.format}</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="relative overflow-hidden rounded-2xl border border-border shadow-card-soft">
      <div className="aspect-[16/10] relative">
        <img src={event.cover} alt={event.title} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusBadge status={event.status} />
          <span className={["px-2.5 py-1 rounded-full text-[10px] font-semibold", gameStyle(event.game)].join(" ")}>{event.game}</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-gradient-brand text-white text-[11px] font-semibold">
          {new Date(event.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      </div>
      <div className="p-4 bg-card">
        <div className="font-bold truncate">{event.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{event.region}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gradient-brand font-bold">{event.prize}</span>
          <span className="text-muted-foreground">{event.format}</span>
        </div>
      </div>
    </Link>
  );
}