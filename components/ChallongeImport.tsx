"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Link2, AlertTriangle, CheckCircle2, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { importChallongeResults, type ChallongeMatchData } from "@/actions/challonge";

export default function ChallongeImport({
  eventId, title, data,
}: { eventId: number; title: string; data: ChallongeMatchData }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const participants = data.participants ?? [];
  const accounts = data.accounts ?? [];

  // challongeId -> chosen site account id (0 = skip / no account)
  const [map, setMap] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const p of participants) init[p.challongeId] = p.suggestedUserId ?? 0;
    return init;
  });

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.name.localeCompare(b.name)),
    [accounts],
  );

  const matchedCount = Object.values(map).filter(Boolean).length;

  // Error state (bad key, no URL, tournament not found, etc.)
  if (data.error) {
    return (
      <Shell eventId={eventId} title={title}>
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <AlertTriangle className="size-5 shrink-0 text-red-400" />
          <div>
            <div className="font-semibold text-red-400">Couldn&apos;t load Challonge data</div>
            <p className="mt-1 text-sm text-muted-foreground">{data.error}</p>
          </div>
        </div>
      </Shell>
    );
  }

  const submit = () => {
    const matches = participants
      .map((p) => ({ userId: map[p.challongeId] || 0, finalRank: p.finalRank, name: p.name }))
      .filter((m) => m.userId);
    if (matches.length === 0) { toast.error("Match at least one player to an account."); return; }
    start(async () => {
      const res = await importChallongeResults(eventId, matches);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Results imported & MMR awarded");
      router.push(`/events/${eventId}`);
      router.refresh();
    });
  };

  return (
    <Shell eventId={eventId} title={title}>
      {!data.tournamentComplete && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          <p className="text-sm text-muted-foreground">
            This tournament doesn&apos;t look complete on Challonge yet, so final placements may be missing.
            You can still match players now, but MMR is only awarded for players who have a final placement.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-primary" />
        {matchedCount} of {participants.length} participant{participants.length === 1 ? "" : "s"} matched to an account
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <div className="space-y-1.5">
          {participants.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No participants found on this tournament.</p>
          )}
          {participants.map((p) => {
            const chosen = map[p.challongeId] || 0;
            const auto = p.suggestedUserId && chosen === p.suggestedUserId;
            return (
              <div key={p.challongeId} className={["flex flex-wrap items-center gap-3 rounded-lg border p-3 transition", chosen ? "border-brand/60 bg-gradient-brand-soft" : "border-border bg-secondary/40"].join(" ")}>
                {p.finalRank != null && (
                  <span title="Final placement" className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-brand text-xs font-bold text-white">
                    #{p.finalRank}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    {p.username ? (<><Link2 className="size-3" /> {p.username}</>) : <span className="italic">no linked Challonge account</span>}
                  </div>
                </div>
                {auto && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary">auto-matched</span>}
                <select
                  value={chosen}
                  onChange={(e) => setMap((m) => ({ ...m, [p.challongeId]: Number(e.target.value) }))}
                  className="w-full shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm focus:border-brand focus:outline-none sm:w-64"
                >
                  <option value={0}>— Skip / no account —</option>
                  {sortedAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.handle ? ` (@${a.handle})` : ""}{a.challongeUsername ? ` · ${a.challongeUsername}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={submit} disabled={pending || matchedCount === 0}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 font-bold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-50">
        <Save className="size-4" /> {pending ? "Importing..." : "Import results & award MMR"}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Matched players are added to this event and awarded MMR by their placement, then the event is finalized.
      </p>
    </Shell>
  );
}

function Shell({ eventId, title, children }: { eventId: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1000px] p-6 md:p-10">
      <Link href={`/events/${eventId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="size-4" /> Back to event
      </Link>
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">{title} · Import from Challonge</h1>
      </div>
      {children}
    </div>
  );
}
