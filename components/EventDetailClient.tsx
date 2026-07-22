"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, Users2, Trophy, Clock, ChevronLeft, Shield, Zap,
  Eye, Activity, Tv, PlayCircle, Award, Info, Network, ExternalLink,
} from "lucide-react";

export type EventVM = {
  id: string;
  title: string;
  game: string;
  region: string;
  format: string;
  prize: string;
  entry: string;
  startsAt: string;
  eventTime: string;
  status: "Live" | "Upcoming" | "Completed";
  participants: number;
  capacity: number;
  organizer: string;
  cover: string;
  location: string;
  description: string;
  rules: string;
  bracketUrl: string;
  streamUrl: string;
  impressions: number | null;
  engagement: number | null;
  watchHours: number | null;
  avgCcv: number | null;
  vodLinks: string[];
  leaderboard: Array<{ rank: number; team: string; record?: string }>;
};

export type RosterEntry = {
  id: string;
  name: string;
  org: string;
  team: string | null;
  avatar: string;
};

type TabKey = "overview" | "participants" | "bracket" | "stream" | "rules";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: Info },
  { key: "participants", label: "Participants", icon: Users2 },
  { key: "bracket", label: "Bracket", icon: Network },
  { key: "stream", label: "Stream", icon: Tv },
  { key: "rules", label: "Info & Rules", icon: Shield },
];

function fmt(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function EventDetailClient({ event, roster }: { event: EventVM; roster: RosterEntry[] }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const isCompleted = event.status === "Completed";
  const tags = [event.format, event.region, event.entry === "Free" ? "Free Entry" : "Paid"].filter(Boolean);

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Hero */}
      <div className="relative h-[320px] md:h-[400px]">
        <img src={event.cover} alt={event.title} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="absolute inset-0 bg-gradient-brand-soft" />
        <div className="relative h-full p-6 md:p-10 flex flex-col justify-between">
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
            <h1 className="text-3xl md:text-5xl font-bold max-w-3xl">{event.title}</h1>
            <div className="mt-2 text-muted-foreground">Hosted by <span className="text-foreground font-semibold">{event.organizer}</span></div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 md:px-10 mt-6">
        <div className="flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  "inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition",
                  active
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body: tab content + sidebar */}
      <div className="p-6 md:p-10 grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="min-w-0 space-y-8">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Pill icon={Trophy} label="Prize Pool" value={event.prize} />
                <Pill icon={Users2} label="Players" value={`${event.participants}/${event.capacity}`} />
                <Pill icon={MapPin} label="Region" value={event.region} />
                <Pill icon={Calendar} label={isCompleted ? "Held" : "Starts"} value={new Date(event.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
              </div>

              <Section title="About this tournament">
                <p className="text-muted-foreground leading-relaxed">
                  {event.description ||
                    `The ${event.title} is a premier ${event.game} competition featuring ${event.format.toLowerCase()} brackets across the ${event.region} region.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((t) => <span key={t} className="px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold">{t}</span>)}
                </div>
              </Section>

              {isCompleted && (
                <>
                  <Section title="Broadcast Stats">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Pill icon={Eye} label="Impressions" value={fmt(event.impressions)} />
                      <Pill icon={Activity} label="Engagement" value={fmt(event.engagement)} />
                      <Pill icon={Clock} label="Watch Hours" value={fmt(event.watchHours)} />
                      <Pill icon={Tv} label="Avg CCV" value={fmt(event.avgCcv)} />
                    </div>
                  </Section>

                  <Section title="Final Leaderboard" icon={Award}>
                    {event.leaderboard.length === 0 ? (
                      <Empty text="No leaderboard available." />
                    ) : (
                      <div className="space-y-2">
                        {event.leaderboard.map((row) => (
                          <div key={row.rank} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                            <div className={[
                              "size-8 rounded-lg grid place-items-center font-bold text-sm",
                              row.rank === 1 ? "bg-gradient-brand text-white" : "bg-secondary text-muted-foreground",
                            ].join(" ")}>{row.rank}</div>
                            <div className="font-semibold flex-1 truncate">{row.team}</div>
                            {row.record && <div className="text-xs text-muted-foreground">{row.record}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="VODs" icon={PlayCircle}>
                    {event.vodLinks.length === 0 ? (
                      <Empty text="No VODs available." />
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {event.vodLinks.map((url, i) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border hover:border-brand transition">
                            <PlayCircle className="size-5 text-primary shrink-0" />
                            <span className="text-sm font-semibold truncate">Watch VOD {i + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </Section>
                </>
              )}
            </>
          )}

          {tab === "participants" && (
            <Section title={`Participants (${roster.length})`}>
              {roster.length === 0 ? (
                <Empty text="No players registered yet." />
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {roster.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border hover:border-brand transition">
                      <img src={p.avatar} alt="" className="size-10 rounded-lg bg-secondary" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{p.org || p.team || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === "bracket" && (
            <Section title="Bracket" icon={Network}>
              <UrlPanel
                url={event.bracketUrl}
                emptyText="No bracket linked yet."
                ctaText="Open bracket"
                future="Full bracket management will live here in a future update."
              />
            </Section>
          )}

          {tab === "stream" && (
            <Section title="Stream" icon={Tv}>
              <UrlPanel
                url={event.streamUrl}
                emptyText="No stream linked yet."
                ctaText="Open stream"
                future="Embedded streaming will be managed here in a future update."
              />
            </Section>
          )}

          {tab === "rules" && (
            <Section title="Rules" icon={Shield}>
              {event.rules ? (
                <ul className="text-sm text-muted-foreground space-y-2">
                  {event.rules.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i} className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> {line}</li>
                  ))}
                </ul>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> Must be 16+ to compete</li>
                  <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> No smurf accounts allowed</li>
                  <li className="flex gap-2"><Zap className="size-3.5 text-primary shrink-0 mt-0.5" /> Check-in 30 min before start</li>
                </ul>
              )}
            </Section>
          )}
        </div>

        {/* Sidebar — always visible */}
        <aside className="space-y-5">
          {!isCompleted && (
            <div className="rounded-2xl border border-brand bg-gradient-brand-soft p-6 shadow-card-soft">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Registration {event.entry === "Free" ? "is" : "fee"}</div>
              <div className="text-3xl font-bold text-gradient-brand mt-1">{event.entry}</div>
              <button className="mt-4 w-full bg-gradient-brand text-white font-bold py-3 rounded-xl shadow-glow hover:scale-[1.02] transition">
                Register Now
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="size-4 text-primary" /> Schedule</h3>
            <div className="space-y-3 text-sm">
              <Row label="Start" value={`${new Date(event.startsAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${event.eventTime ? ` · ${event.eventTime.slice(0, 5)}` : ""}`} />
              <Row label="Game" value={event.game} />
              <Row label="Format" value={event.format} />
              <Row label="Region" value={event.region} />
              <Row label="Location" value={event.location || "—"} />
              <Row label="Max Players" value={String(event.capacity)} />
              <Row label="Registered" value={String(event.participants)} />
              <Row label="Entry Fee" value={event.entry} />
              <Row label="Prize" value={event.prize} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        {Icon && <Icon className="size-5 text-primary" />} {title}
      </h2>
      {children}
    </section>
  );
}

function UrlPanel({ url, emptyText, ctaText, future }: { url: string; emptyText: string; ctaText: string; future: string }) {
  return (
    <div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/40 border border-border hover:border-brand transition">
          <span className="text-sm font-semibold truncate">{url}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary shrink-0">{ctaText} <ExternalLink className="size-4" /></span>
        </a>
      ) : (
        <Empty text={emptyText} />
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{future}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b last:border-0 border-border pb-3 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}