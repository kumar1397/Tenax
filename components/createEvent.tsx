"use client";

import { useState } from "react";
import {
  Trophy,
  Calendar,
  MapPin,
  Gamepad2,
  Users,
  DollarSign,
  Swords,
  Image as ImageIcon,
  AlignLeft,
  ChevronDown,
  Info,
} from "lucide-react";
import { createEvent } from "@/actions/event";

const games = ["InvincibleVS", "2XKO", "Valorant", "Dead by Daylight"];
const regions = ["NA", "EU", "APAC", "LATAM", "Global"];
const formats = ["Single Elimination", "Double Elimination", "Round Robin", "Swiss"];

export default function CreateEventPage() {
  const [form, setForm] = useState({
    title: "",
    game: games[0],
    region: regions[0],
    format: formats[0],
    prize: "",
    entry: "Free",
    startsAt: "",
    capacity: "128",
    description: "",
    cover: "",
    rules: "",          // NEW
    bracketUrl: "",     // NEW
    streamUrl: "",      // NEW
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePublish = async () => {
    setSaving(true);
    setMessage("");
    const res = await createEvent(form);
    setSaving(false);
    setMessage(res.error ? `Error: ${res.error}` : "Published! ✓");
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Create Tournament</h1>
        <p className="text-muted-foreground mt-1">Set up your event, define the rules, and invite competitors.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Main form */}
        <div className="space-y-6">
          {/* Basics */}
          <SectionCard title="Basics" icon={Trophy}>
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Tournament Title" hint="Make it catchy and unique">
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Crimson Clash Open 2026"
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Game">
                <div className="relative">
                  <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={form.game}
                    onChange={(e) => update("game", e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 appearance-none"
                  >
                    {games.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>

              <Field label="Region">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={form.region}
                    onChange={(e) => update("region", e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 appearance-none"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>

              <Field label="Format">
                <div className="relative">
                  <Swords className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <select
                    value={form.format}
                    onChange={(e) => update("format", e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 appearance-none"
                  >
                    {formats.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* Schedule & Prize */}
          <SectionCard title="Schedule & Prize" icon={DollarSign}>
            <div className="grid md:grid-cols-3 gap-5">
              <Field label="Start Date">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => update("startsAt", e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                </div>
              </Field>

              <Field label="Prize Pool">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={form.prize}
                    onChange={(e) => update("prize", e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
                  />
                </div>
              </Field>

              <Field label="Entry Fee">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={form.entry}
                    onChange={(e) => update("entry", e.target.value)}
                    placeholder="Free or amount"
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
                  />
                </div>
              </Field>

              <Field label="Max Participants">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => update("capacity", e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60"
                  />
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* Details */}
          <SectionCard title="Details" icon={AlignLeft}>
            <div className="space-y-5">
              <Field label="Description" hint="Rules, schedule, and anything competitors should know">
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  placeholder="Describe your tournament..."
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground resize-none"
                />
              </Field>

              <Field label="Cover Image URL" hint="A high-quality banner makes your event stand out">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={form.cover}
                    onChange={(e) => update("cover", e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
                  />
                </div>
              </Field>

              {form.cover && (
                <div className="rounded-xl border border-border overflow-hidden aspect-[21/9]">
                  <img src={form.cover} alt="Cover preview" className="size-full object-cover" />
                </div>
              )}
            </div>
          </SectionCard>

          <Field label="Rules" hint="One rule per line">
            <textarea
              value={form.rules}
              onChange={(e) => update("rules", e.target.value)}
              rows={4}
              placeholder={"Must be 16+\nNo smurf accounts\nCheck-in 30 min before start"}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground resize-none"
            />
          </Field>

          <Field label="Bracket URL" hint="Link to the bracket (Challonge, etc.)">
            <input
              value={form.bracketUrl}
              onChange={(e) => update("bracketUrl", e.target.value)}
              placeholder="https://challonge.com/..."
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Stream URL" hint="Twitch / YouTube link">
            <input
              value={form.streamUrl}
              onChange={(e) => update("streamUrl", e.target.value)}
              placeholder="https://twitch.tv/..."
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60 placeholder:text-muted-foreground"
            />
          </Field>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 h-fit lg:sticky lg:top-20">
          <SectionCard title="Preview" icon={Info}>
            <div className="rounded-xl border border-border bg-black/30 overflow-hidden">
              <div className="aspect-[16/9] relative bg-gradient-to-br from-[#D7155C]/30 to-black flex items-center justify-center">
                {form.cover ? (
                  <img src={form.cover} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="relative text-center px-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Upcoming</div>
                  <div className="text-lg font-bold leading-tight">
                    {form.title || "Your Tournament Name"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {form.game} · {form.region}
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prize Pool</span>
                  <span className="font-bold text-gradient-brand">
                    {form.prize ? `$${Number(form.prize).toLocaleString()}` : "$0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entry</span>
                  <span className="font-medium">{form.entry === "Free" || !form.entry ? "Free" : `$${form.entry}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{form.format}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{form.capacity}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium">
                    {form.startsAt
                      ? new Date(form.startsAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 space-y-4">
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Publishing..." : "Publish Tournament"}
            </button>
            <button className="w-full py-3 rounded-xl bg-card border border-border text-foreground font-semibold hover:border-brand transition">
              Save as Draft
            </button>
            {message && (
              <p
                className={`text-sm text-center ${message.startsWith("Error") ? "text-red-500" : "text-green-500"
                  }`}
              >
                {message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Publishing makes your event visible to all players. You can edit details later.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="size-8 rounded-lg bg-gradient-brand-soft border border-brand grid place-items-center">
          <Icon className="size-4 text-primary" />
        </div>
        <h3 className="font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}