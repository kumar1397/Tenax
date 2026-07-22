"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Trophy, Medal, Award, X, Save } from "lucide-react";
import { submitEventResults } from "@/actions/event";

type Roster = { id: string; name: string; org: string; avatar: string };
type Slot = { player: Roster | null; points: number };

const PODIUM = [
  { rank: 1, label: "1st Place", icon: Trophy, defaultPoints: 1000, border: "border-yellow-500/50", text: "text-yellow-400", color: "from-yellow-500/20 to-yellow-500/5" },
  { rank: 2, label: "2nd Place", icon: Medal,  defaultPoints: 600,  border: "border-slate-300/50", text: "text-slate-200", color: "from-slate-300/20 to-slate-300/5" },
  { rank: 3, label: "3rd Place", icon: Award,  defaultPoints: 300,  border: "border-amber-700/50", text: "text-amber-500", color: "from-amber-700/20 to-amber-700/5" },
];

export default function AssignPoints({
  eventId, title, cover, roster,
}: { eventId: number; title: string; cover: string; roster: Roster[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const [slots, setSlots] = useState<Slot[]>(PODIUM.map((p) => ({ player: null, points: p.defaultPoints })));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const assigned = new Set(slots.map((s) => s.player?.id).filter(Boolean));
    return roster.filter((p) => !assigned.has(p.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  }, [roster, slots, q]);

  const assign = (player: Roster) => {
    if (activeSlot === null) return;
    setSlots((prev) => prev.map((s, i) => (i === activeSlot ? { ...s, player } : s)));
    setActiveSlot(null); setQ("");
  };
  const remove = (i: number) => setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, player: null } : s)));
  const setPoints = (i: number, points: number) => setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, points } : s)));

  const submit = () => {
    if (slots.some((s) => !s.player)) { setMsg("Error: Assign a player to all 3 positions."); return; }
    const podium = slots.map((s, i) => ({ rank: i + 1, team: s.player!.name, points: s.points }));
    setMsg("");
    startTransition(async () => {
      const res = await submitEventResults(eventId, podium);
      if (res.error) { setMsg("Error: " + res.error); return; }
      router.push(`/events/${eventId}`);
      router.refresh();
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10">
      <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="size-4" /> Back to event
      </Link>

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden mb-6">
        <div className="relative h-32">
          {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-card/30" />
          <div className="relative p-5 h-full flex items-end">
            <div>
              <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider">Finalizing</span>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">{title} · Results</h1>
              <p className="text-xs text-muted-foreground">Assign points to the top three finishers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Podium */}
        <div className="space-y-4">
          {PODIUM.map((p, i) => {
            const slot = slots[i]; const Icon = p.icon;
            return (
              <div key={p.rank} className={`rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Icon className={`size-5 ${p.text}`} /><div className="font-bold">{p.label}</div></div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Points</label>
                    <input type="number" value={slot.points} onChange={(e) => setPoints(i, Number(e.target.value) || 0)}
                      className="w-24 bg-background border border-border rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/60" />
                  </div>
                </div>

                {slot.player ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border">
                    <img src={slot.player.avatar} alt="" className="size-12 rounded-lg bg-secondary" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{slot.player.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{slot.player.org || "—"}</div>
                    </div>
                    <button onClick={() => remove(i)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition" aria-label="Remove">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setActiveSlot(i)}
                    className={["w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition",
                      activeSlot === i ? "border-brand bg-gradient-brand-soft text-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-foreground"].join(" ")}>
                    {activeSlot === i ? "Pick a player from the list →" : "+ Assign player"}
                  </button>
                )}
              </div>
            );
          })}

          <button onClick={submit} disabled={pending}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-brand text-white font-bold py-3.5 rounded-xl shadow-glow hover:scale-[1.01] transition disabled:opacity-50">
            <Save className="size-4" /> {pending ? "Submitting..." : "Submit Results & Complete Event"}
          </button>
          {msg && <p className={`text-sm text-center ${msg.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{msg}</p>}
        </div>

        {/* Player search */}
        <aside className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-bold mb-1">Registered Players</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {activeSlot === null ? "Tap a podium slot to start assigning." : `Assigning to ${PODIUM[activeSlot].label}`}
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
          </div>
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => assign(p)} disabled={activeSlot === null}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/40 hover:border-brand hover:bg-secondary transition text-left disabled:opacity-50 disabled:cursor-not-allowed">
                <img src={p.avatar} alt="" className="size-9 rounded-lg bg-secondary" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.org || "—"}</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">No players found.</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}