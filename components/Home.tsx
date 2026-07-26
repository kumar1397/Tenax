"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { HeroAnimation } from "@/components/HeroAnimation";

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

// Hero character cutouts, rotated as a crossfading carousel. Drop transparent
// PNGs at these paths in /public to have a game character bleed off the right
// edge of the hero (see the design mockup).
// Add more paths here to rotate them as a crossfading carousel.
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

export default function Home({ initialEvents }: { initialEvents: any[] }) {
  // Data arrives from the server — map once, no fetch, no loading state
  const [events] = useState<Event[]>(() => (initialEvents ?? []).map(toUiEvent));

  const liveAll = events.filter((e) => e.status === "Live");
  const upcomingAll = events.filter((e) => e.status !== "Completed");

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-brand shadow-card-soft min-h-[460px] md:min-h-[600px]">
        {/* Clipped backdrop: gradient + particles + spotlight (rounded so the
            character can bleed past the card edges without square corners). */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_72%_25%,#C084FC_0%,#A855F7_30%,#7C3AED_58%,#5B21B6_100%)]" />
          <HeroAnimation />
          {/* Spotlight behind the character to balance the empty middle */}
          <div className="absolute right-[16%] top-1/2 aspect-square w-[55%] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(228,200,255,0.7),transparent_72%)] blur-3xl" />
        </div>

        {/* Live pill — top-right */}
        <div className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
          Live
          <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
        </div>

        {/* Character carousel — spans the full card height. */}
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

      <CarouselSection
        title="Live Right Now"
        items={liveAll}
        empty="No live tournaments right now."
        itemClass="w-[85%] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)]"
        render={(e) => <LiveCard event={e} />}
      />

      <div className="my-20">
        <CarouselSection
          title="Upcoming Tournaments"
          items={upcomingAll}
          empty="No upcoming tournaments yet."
          itemClass="w-[85%] shrink-0 snap-start sm:w-[calc((100%_-_2rem)/3)]"
          render={(e) => <EventCard event={e} />}
        />
      </div>
    </div>
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
            "animate-float absolute bottom-0 right-[12%] h-[560px] w-auto max-w-none object-contain object-bottom drop-shadow-2xl transition-opacity duration-1000",
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
    <section>
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