"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Trophy, Medal, Award, X, Save, Users2 } from "lucide-react";
import { submitEventResults } from "@/actions/event";

type Roster = { id: string; userId: number | null; name: string; org: string; avatar: string };
type MmrConfig = { first: number; second: number; third: number; restAmount: number; restCount: number };
type Slot = { player: Roster | null; mmr: number };

const PODIUM = [
  { rank: 1, label: "1st Place", icon: Trophy, border: "border-yellow-500/50", text: "text-yellow-400", color: "from-yellow-500/20 to-yellow-500/5" },
  { rank: 2, label: "2nd Place", icon: Medal, border: "border-slate-300/50", text: "text-slate-200", color: "from-slate-300/20 to-slate-300/5" },
  { rank: 3, label: "3rd Place", icon: Award, border: "border-amber-700/50", text: "text-amber-500", color: "from-amber-700/20 to-amber-700/5" },
];

export default function AssignPoints({
  eventId, title, cover, roster, mmrConfig,
}: { eventId: number; title: string; cover: string; roster: Roster[]; mmrConfig: MmrConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  // Podium slots pre-filled with the MMR the admin set on the event (editable)
  const [slots, setSlots] = useState<Slot[]>([
    { player: null, mmr: mmrConfig.first },
    { player: null, mmr: mmrConfig.second },
    { player: null, mmr: mmrConfig.third },
  ]);
  const [participants, setParticipants] = useState<Roster[]>([]);
  const [restAmount, setRestAmount] = useState(mmrConfig.restAmount);
  const restCount = mmrConfig.restCount;

  // Where the next picked player goes: a podium index, "rest", or nothing
  const [target, setTarget] = useState<number | "rest" | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const used = new Set<string>();
    slots.forEach((s) => s.player && used.add(s.player.id));
    participants.forEach((p) => used.add(p.id));
    return roster.filter((p) => !used.has(p.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  }, [roster, slots, participants, q]);

  const pick = (player: Roster) => {
    if (target === null) return;
    if (target === "rest") {
      if (participants.length >= restCount) { setMsg(`Error: Only ${restCount} participation slots.`); return; }
      setParticipants((prev) => [...prev, player]);
    } else {
      setSlots((prev) => prev.map((s, i) => (i === target ? { ...s, player } : s)));
      setTarget(null);
    }
    setMsg(""); setQ("");
  };
  const removeSlot = (i: number) => setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, player: null } : s)));
  const setSlotMmr = (i: number, mmr: number) => setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, mmr } : s)));
  const removeParticipant = (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id));

  const submit = () => {
    if (slots.some((s) => !s.player)) { setMsg("Error: Assign a player to all 3 positions."); return; }
    const awards = [
      ...slots.map((s, i) => ({ userId: s.player!.userId ?? 0, rank: i + 1, mmr: s.mmr, name: s.player!.name })),
      ...participants.map((p) => ({ userId: p.userId ?? 0, rank: 0, mmr: restAmount, name: p.name })),
    ].filter((a) => a.userId);
    setMsg("");
    startTransition(async () => {
      const res = await submitEventResults(eventId, awards);
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

      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden mb-6">
        <div className="relative h-32">
          {cover && <img src={cover} alt="" decoding="async" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-card/30" />
          <div className="relative p-5 h-full flex items-end">
            <div>
              <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider">Finalizing</span>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">{title} · Results</h1>
              <p className="text-xs text-muted-foreground">Assign finishers — MMR is awarded automatically on submit.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          {/* Podium */}
          {PODIUM.map((p, i) => {
            const slot = slots[i]; const Icon = p.icon;
            return (
              <div key={p.rank} className={`rounded-2xl border ${p.border} bg-gradient-to-br ${p.color} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Icon className={`size-5 ${p.text}`} /><div className="font-bold">{p.label}</div></div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">MMR</label>
                    <input type="number" value={slot.mmr} onChange={(e) => setSlotMmr(i, Number(e.target.value) || 0)}
                      className="w-24 bg-background border border-border rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/60" />
                  </div>
                </div>
                {slot.player ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border">
                    <img src={slot.player.avatar} alt="" loading="lazy" decoding="async" className="size-12 rounded-lg bg-secondary" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{slot.player.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{slot.player.org || "—"}</div>
                    </div>
                    <button onClick={() => removeSlot(i)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition" aria-label="Remove"><X className="size-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setTarget(i)}
                    className={["w-full py-4 rounded-xl border-2 border-dashed text-sm font-semibold transition",
                      target === i ? "border-brand bg-gradient-brand-soft text-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-foreground"].join(" ")}>
                    {target === i ? "Pick a player from the list →" : "+ Assign player"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Participation — the next N finishers each get a fixed amount */}
          {restCount > 0 && (
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users2 className="size-5 text-primary" />
                  <div className="font-bold">Participation <span className="text-sm font-normal text-muted-foreground">· next {restCount}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">MMR each</label>
                  <input type="number" value={restAmount} onChange={(e) => setRestAmount(Number(e.target.value) || 0)}
                    className="w-24 bg-background border border-border rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/60" />
                </div>
              </div>
              <div className="space-y-1.5">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-border">
                    <img src={p.avatar} alt="" className="size-9 rounded-lg bg-secondary" />
                    <div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{p.name}</div></div>
                    <button onClick={() => removeParticipant(p.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground" aria-label="Remove"><X className="size-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setTarget("rest")} disabled={participants.length >= restCount}
                className={["mt-2 w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed",
                  target === "rest" ? "border-brand bg-gradient-brand-soft text-foreground" : "border-border text-muted-foreground hover:border-brand hover:text-foreground"].join(" ")}>
                {participants.length >= restCount ? `All ${restCount} added` : target === "rest" ? "Pick players from the list →" : `+ Add participant (${participants.length}/${restCount})`}
              </button>
            </div>
          )}

          <button onClick={submit} disabled={pending}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-brand text-white font-bold py-3.5 rounded-xl shadow-glow hover:scale-[1.01] transition disabled:opacity-50">
            <Save className="size-4" /> {pending ? "Submitting..." : "Submit Results & Award MMR"}
          </button>
          {msg && <p className={`text-sm text-center ${msg.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{msg}</p>}
        </div>

        {/* Player search */}
        <aside className="rounded-2xl border border-border bg-card/60 p-5 h-fit lg:sticky lg:top-20">
          <h3 className="font-bold mb-1">Registered Players</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {target === null ? "Tap a slot to start assigning." : target === "rest" ? "Adding participation players" : `Assigning to ${PODIUM[target].label}`}
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
          </div>
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => pick(p)} disabled={target === null}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border bg-secondary/40 hover:border-brand hover:bg-secondary transition text-left disabled:opacity-50 disabled:cursor-not-allowed">
                <img src={p.avatar} alt="" loading="lazy" decoding="async" className="size-9 rounded-lg bg-secondary" />
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
