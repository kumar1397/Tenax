"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, PlayCircle } from "lucide-react";
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
  streamUrl: string;
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
    prize: row.prize_pool ? `$${Number(row.prize_pool).toLocaleString()}` : "Free",
    status: STATUS_MAP[row.event_status] ?? "Upcoming",
    participants: row.no_of_player ?? 0,
    organizer: row.organizer ?? "—",
    cover: row.cover_image || FALLBACK_COVER,
    startsAt: row.event_date ?? new Date().toISOString(),
    streamUrl: row.stream_url ?? "",   // 👈 add
  };
}

function getTwitchChannel(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("twitch.tv")) return null;
    return u.pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

export default function Home({ initialEvents }: { initialEvents: any[] }) {
  const [events] = useState<Event[]>(() => (initialEvents ?? []).map(toUiEvent));
  const featured = events[0];
  const liveAll = events.filter((e) => e.status === "Live");
  const upcomingAll = events.filter((e) => e.status !== "Completed");
  const live = liveAll.slice(0, 3);
  const upcoming = upcomingAll.slice(0, 4);
  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-brand shadow-card-soft bg-card">
        <img src={featured?.cover || FALLBACK_COVER} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <HeroAnimation />
        <div className="relative p-8 md:p-28 flex flex-col items-center text-center gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-brand text-white text-xs font-semibold shadow-glow">
              Where Esport Winners Get Paid
            </div>
            <h1 className="mt-4 text-4xl md:text-[169px] font-bold leading-[1.05]">
              <span className="">TENAX</span>
            </h1>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05]">
              Compete in the Esports Arena
            </h1>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Join 50,000+ players battling across 40 titles. Track tournaments, climb the leaderboards, and earn glory.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Live Right Now" link="/events?status=Live" showLink={liveAll.length > 3} />
        {live.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No live tournaments right now.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {live.map((e) => <LiveCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      <section className="my-20">
        <SectionHeader title="Upcoming Tournaments" link="/events?status=Upcoming" showLink={upcomingAll.length > 4} linkAtBottomMobile />
        {upcoming.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No upcoming tournaments yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
        {upcomingAll.length > 4 && (
          <Link
            href="/events?status=Upcoming"
            className="sm:hidden mt-4 flex items-center justify-center gap-1 w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-primary hover:border-brand transition"
          >
            View all <ChevronRight className="size-4" />
          </Link>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, link, showLink, linkAtBottomMobile }: { title: string; link: string; showLink: boolean; linkAtBottomMobile?: boolean }) {
  return (
    <div className="relative flex items-center justify-between gap-3 mb-4 sm:justify-center">
      <h2 className="text-2xl sm:text-4xl font-bold sm:text-center">{title}</h2>
      {showLink && (
        <Link href={link} className={[
          "shrink-0 text-sm text-muted-foreground hover:text-primary items-center gap-1 sm:absolute sm:right-0 sm:inline-flex",
          linkAtBottomMobile ? "hidden" : "inline-flex",
        ].join(" ")}>
          View all <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

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

const GAME_STYLE: Record<string, string> = {
  InvincibleVS: "bg-violet-500/85 text-white",
  "2XKO": "bg-sky-500/85 text-white",
  Valorant: "bg-rose-500/85 text-white",
  "Dead by Daylight": "bg-teal-500/85 text-white",
};
const gameStyle = (g: string) => GAME_STYLE[g] ?? "bg-black/60 text-white";

function LiveCard({ event }: { event: Event }) {
  const [playing, setPlaying] = useState(false);
  const channel = getTwitchChannel(event.streamUrl);
  const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-card-soft">
      {/* Media */}
      <div className="aspect-[16/10] relative bg-black">
        {playing && channel ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}`}
            allowFullScreen
            className="size-full"
          />
        ) : (
          <>
            {/* Cover — links to event page */}
            <Link href={`/events/${event.id}`}>
              <img src={event.cover} alt={event.title} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </Link>

            {/* Play overlay — only if there's a Twitch stream; loads the player */}
            {channel && (
              <button
                onClick={() => setPlaying(true)}
                aria-label="Play stream"
                className="absolute inset-0 grid place-items-center group"
              >
                <span className="size-14 rounded-full bg-black/60 backdrop-blur grid place-items-center group-hover:bg-gradient-brand group-hover:scale-110 transition shadow-glow">
                  <PlayCircle className="size-8 text-white" />
                </span>
              </button>
            )}
          </>
        )}

        {/* Badges — hidden once playing so they don't cover the player */}
        {!playing && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-glow">
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </span>
              <span className={["px-2.5 py-1 rounded-full text-[10px] font-semibold", gameStyle(event.game)].join(" ")}>{event.game}</span>
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-gradient-brand text-white text-[11px] font-semibold pointer-events-none">
              {(event.participants * 12).toLocaleString()} viewers
            </div>
          </>
        )}
      </div>

      {/* Clickable text section → event page */}
      <Link href={`/events/${event.id}`} className="block p-4 bg-card hover:bg-card/80 transition">
        <div className="font-bold truncate">{event.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{event.organizer} · {event.region}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gradient-brand font-bold">{event.prize}</span>
          <span className="text-muted-foreground">{event.format}</span>
        </div>
      </Link>
    </div>
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