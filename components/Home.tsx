"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { events, players } from "@/lib/mock";
import { HeroAnimation } from "@/components/HeroAnimation";
export default function Home() {
  const featured = events[0];
  const live = events.filter((e) => e.status === "Live").slice(0, 3);
  const upcoming = events.filter((e) => e.status !== "Ended").slice(0, 6);

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-brand shadow-card-soft bg-card">
        <img src={featured.cover} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
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

      {/* Live now */}
      <section>
        <SectionHeader title="Live Right Now" link="/events" />
        <div className="grid md:grid-cols-3 gap-4">
          {live.map((e) => <LiveCard key={e.id} event={e} />)}
        </div>
      </section>

      {/* Upcoming + Top players */}
      <section className="my-20">
        <SectionHeader title="Upcoming Tournaments" link="/events" />
        <div className="grid sm:grid-cols-2 gap-4">
          {upcoming.slice(0, 4).map((e) => <EventCard key={e.id} event={e} />)}
        </div>

      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-gradient-brand">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:border-brand transition flex flex-col items-center justify-center">
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-lg font-bold text-gradient-brand">{label}</div>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link: string }) {
  return (
    <div className="relative flex items-center justify-center mb-4">
      <h2 className="text-4xl font-bold text-center">{title}</h2>
      <Link href={link} className="absolute right-0 text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
        View all <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

function LiveCard({ event }: { event: typeof events[number] }) {
  return (
    <Link href={`/events/${event.id}`} className="group relative overflow-hidden rounded-2xl border border-border hover:border-brand transition shadow-card-soft">
      <div className="aspect-[16/10] relative">
        <img src={event.cover} alt={event.title} className="size-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-brand text-white text-[10px] font-bold shadow-glow">
            <span className="size-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-semibold">{event.game}</span>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[11px] font-mono">
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

function EventCard({ event }: { event: typeof events[number] }) {
  return (
    <Link href={`/events/${event.id}`} className="group rounded-2xl border border-border bg-card/60 backdrop-blur p-4 hover:border-brand transition shadow-card-soft">
      <div className="flex items-start gap-3">
        <img src={event.cover} alt="" className="size-16 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">{event.status}</span>
            <span className="text-[10px] text-muted-foreground">{event.game}</span>
          </div>
          <div className="mt-1 font-bold truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{new Date(event.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {event.region}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex -space-x-1.5">
          {[0, 1, 2, 3].map((i) => <div key={i} className="size-6 rounded-full border-2 border-card bg-gradient-brand" />)}
        </div>
        <span className="font-bold text-gradient-brand text-sm">{event.prize}</span>
      </div>
    </Link>
  );
}