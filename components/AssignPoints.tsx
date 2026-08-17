"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Save, Trophy } from "lucide-react";
import { submitEventResults } from "@/actions/event";

type Roster = { id: string; userId: number | null; name: string; org: string; avatar: string };
type MmrConfig = { first: number; second: number; third: number; restAmount: number; restCount: number };

const MAX_POS = 8;
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const ordinal = (n: number) => ORDINALS[n - 1] ?? `${n}th`;

export default function AssignPoints({
  eventId, title, cover, roster, mmrConfig, initialPositions = {},
}: { eventId: number; title: string; cover: string; roster: Roster[]; mmrConfig: MmrConfig; initialPositions?: Record<string, number> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  // MMR per position tier — 1st / 2nd / 3rd explicit, 4th–8th share one amount.
  // Prefilled from the event's config; editable here.
  const [mmr, setMmr] = useState({
    first: mmrConfig.first, second: mmrConfig.second, third: mmrConfig.third, rest: mmrConfig.restAmount,
  });
  const mmrFor = (pos: number) => (pos === 1 ? mmr.first : pos === 2 ? mmr.second : pos === 3 ? mmr.third : mmr.rest);

  // position (1–8) per roster id; absent = unassigned
  const [positions, setPositions] = useState<Record<string, number>>(initialPositions);
  const setPos = (id: string, pos: number) =>
    setPositions((prev) => {
      const next = { ...prev };
      if (!pos) delete next[id];
      else next[id] = pos;
      return next;
    });

  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const list = roster.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
    // Assigned players float up, ordered by position, then name.
    return list.sort((a, b) => {
      const pa = positions[a.id] ?? 99, pb = positions[b.id] ?? 99;
      return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
    });
  }, [roster, q, positions]);

  const assignedCount = Object.keys(positions).length;

  const submit = () => {
    const awards = roster
      .filter((p) => positions[p.id])
      .map((p) => ({ userId: p.userId ?? 0, rank: positions[p.id], mmr: mmrFor(positions[p.id]), name: p.name }))
      .filter((a) => a.userId);
    if (awards.length === 0) { setMsg("Error: Assign at least one player to a position."); return; }
    setMsg("");
    startTransition(async () => {
      const res = await submitEventResults(eventId, awards);
      if (res.error) { setMsg("Error: " + res.error); return; }
      router.push(`/events/${eventId}`);
      router.refresh();
    });
  };

  const tiers: { label: string; value: number; set: (v: number) => void }[] = [
    { label: "1st", value: mmr.first, set: (v) => setMmr((m) => ({ ...m, first: v })) },
    { label: "2nd", value: mmr.second, set: (v) => setMmr((m) => ({ ...m, second: v })) },
    { label: "3rd", value: mmr.third, set: (v) => setMmr((m) => ({ ...m, third: v })) },
    { label: "4th–8th", value: mmr.rest, set: (v) => setMmr((m) => ({ ...m, rest: v })) },
  ];

  return (
    <div className="max-w-[1000px] mx-auto p-6 md:p-10">
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
              <p className="text-xs text-muted-foreground">Place each player (1st–8th). Ties allowed — MMR is awarded on submit.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Position MMR (editable, prefilled from the event) */}
      <div className="mb-6 rounded-2xl border border-border bg-card/60 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <h3 className="font-bold">MMR per position</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiers.map((t) => (
            <label key={t.label} className="block">
              <span className="text-xs font-semibold text-muted-foreground">{t.label} place</span>
              <input type="number" value={t.value} onChange={(e) => t.set(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
            </label>
          ))}
        </div>
      </div>

      {/* Players + position selectors */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Registered Players <span className="text-sm font-normal text-muted-foreground">· {assignedCount} placed</span></h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/60" />
          </div>
        </div>

        <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
          {shown.map((p) => {
            const pos = positions[p.id];
            return (
              <div key={p.id} className={["flex items-center gap-3 rounded-lg border p-2.5 transition", pos ? "border-brand/60 bg-gradient-brand-soft" : "border-border bg-secondary/40"].join(" ")}>
                {pos && <div className="grid size-7 shrink-0 place-items-center rounded-md bg-gradient-brand text-[11px] font-bold text-white">{ordinal(pos)}</div>}
                <img src={p.avatar} alt="" loading="lazy" decoding="async" className="size-9 shrink-0 rounded-lg bg-secondary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{p.org || "—"}</div>
                </div>
                {pos ? <span className="shrink-0 text-xs font-bold text-gradient-brand">+{mmrFor(pos).toLocaleString()} MMR</span> : null}
                <select
                  value={pos ?? 0}
                  onChange={(e) => setPos(p.id, Number(e.target.value))}
                  className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:border-brand"
                >
                  <option value={0}>—</option>
                  {Array.from({ length: MAX_POS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{ordinal(n)}</option>
                  ))}
                </select>
              </div>
            );
          })}
          {shown.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No players found.</div>}
        </div>
      </div>

      <button onClick={submit} disabled={pending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 font-bold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-50">
        <Save className="size-4" /> {pending ? "Submitting..." : "Submit Results & Award MMR"}
      </button>
      {msg && <p className={`mt-3 text-center text-sm ${msg.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{msg}</p>}
    </div>
  );
}
