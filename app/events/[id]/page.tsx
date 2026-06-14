import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { events, players } from "@/lib/mock";
import { Calendar, MapPin, Users2, Trophy, Clock, Share2, Heart, ChevronLeft, Swords, Shield, Zap } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ev = events.find((e) => e.id === id);
  if (!ev) return { title: "Event not found" };
  return {
    title: ev.title, // template makes it "<title> — CrimsonGG"
    description: `${ev.title} · ${ev.game} tournament — ${ev.prize} prize pool. ${ev.format} in ${ev.region}.`,
    openGraph: { title: ev.title, images: [ev.cover] },
  };
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find((e) => e.id === id);
  if (!event) notFound();

  const roster = players.slice(0, 8);

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Hero */}
      <div className="relative h-[360px] md:h-[420px]">
        <img src={event.cover} alt={event.title} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="absolute inset-0 bg-gradient-brand-soft" />
        <div className="relative h-full p-6 md:p-10 flex flex-col justify-between max-w-[1600px] mx-auto">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary w-fit">
            <ChevronLeft className="size-4" /> Back to events
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-brand text-white text-xs font-bold shadow-glow">
                {event.status === "Live" && <span className="size-1.5 rounded-full bg-white animate-pulse" />}
                {event.status.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-semibold">{event.game}</span>
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-semibold">{event.format}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold max-w-3xl">{event.title}</h1>
            <div className="mt-3 text-muted-foreground">Hosted by <span className="text-foreground font-semibold">{event.organizer}</span></div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Main */}
        <div className="space-y-8 min-w-0">
          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Pill icon={Trophy} label="Prize Pool" value={event.prize} />
            <Pill icon={Users2} label="Players" value={`${event.participants}/${event.capacity}`} />
            <Pill icon={MapPin} label="Region" value={event.region} />
            <Pill icon={Calendar} label="Starts" value={new Date(event.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
          </div>

          {/* About */}
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <h2 className="text-xl font-bold mb-3">About this tournament</h2>
            <p className="text-muted-foreground leading-relaxed">
              The {event.title} is a premier {event.game} competition featuring {event.format.toLowerCase()} brackets across the {event.region} region.
              Players battle through intense qualifiers to claim a share of the {event.prize} prize pool. Bring your A-game — only the sharpest squads earn the crown.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((t: string) => <span key={t} className="px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold">{t}</span>)}
            </div>
          </section>

          {/* Bracket / schedule preview */}
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Featured Matches</h2>
              <span className="text-xs text-muted-foreground">Round of 16</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[0,1,2,3].map((i) => {
                const a = players[i*2]; const b = players[i*2+1];
                return (
                  <div key={i} className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Match #{i+1} · {i === 0 ? "Live" : "Upcoming"}</div>
                    <div className="flex items-center justify-between">
                      <Team player={a} />
                      <div className="px-3 py-1 rounded-md bg-gradient-brand text-white text-sm font-bold">{i === 0 ? "2 : 1" : "VS"}</div>
                      <Team player={b} reverse />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Roster */}
          <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
            <h2 className="text-xl font-bold mb-4">Registered Players</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {roster.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border hover:border-brand transition">
                  <img src={p.avatar} alt="" className="size-10 rounded-lg bg-secondary" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.rank} · {p.rp} RP</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-2xl border border-brand bg-gradient-brand-soft p-6 shadow-card-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Registration {event.entry === "Free" ? "is" : "fee"}</div>
            <div className="text-3xl font-bold text-gradient-brand mt-1">{event.entry}</div>
            <button className="mt-4 w-full bg-gradient-brand text-white font-bold py-3 rounded-xl shadow-glow hover:scale-[1.02] transition">
              Register Now
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="py-2 rounded-lg bg-card border border-border text-sm font-semibold hover:border-brand transition inline-flex items-center justify-center gap-1.5"><Heart className="size-4" /> Save</button>
              <button className="py-2 rounded-lg bg-card border border-border text-sm font-semibold hover:border-brand transition inline-flex items-center justify-center gap-1.5"><Share2 className="size-4" /> Share</button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="size-4 text-primary" /> Schedule</h3>
            <div className="space-y-3 text-sm">
              {["Registration closes", "Qualifiers", "Quarterfinals", "Semifinals", "Grand Final"].map((s, i) => (
                <div key={s} className="flex items-center justify-between pb-3 last:pb-0 border-b last:border-0 border-border">
                  <div>
                    <div className="font-semibold">{s}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(Date.now() + i * 86400000).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric" })}</div>
                  </div>
                  <div className={`size-2 rounded-full ${i === 0 ? "bg-primary" : "bg-muted"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Shield className="size-4 text-primary" /> Rules</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> Must be 16+ to compete</li>
              <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> No smurf accounts allowed</li>
              <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> Check-in 30 min before start</li>
              <li className="flex gap-2"><Swords className="size-3.5 text-primary shrink-0 mt-0.5" /> Best of 3 until finals (Bo5)</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 flex items-center gap-3">
      <div className="size-10 rounded-lg bg-gradient-brand-soft border border-brand grid place-items-center">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

function Team({ player, reverse }: { player: any; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 flex-1 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <img src={player.avatar} alt="" className="size-9 rounded-lg bg-secondary" />
      <div className="min-w-0">
        <div className="font-semibold truncate text-sm">{player.name}</div>
        <div className="text-[10px] text-muted-foreground">{player.rank}</div>
      </div>
    </div>
  );
}