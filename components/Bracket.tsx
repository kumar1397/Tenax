"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Network, Crown, Loader2, Shuffle, RotateCcw, Trash2 } from "lucide-react";
import { generateBracket, setBracketWinner, clearBracket } from "@/actions/bracket";
import { effectiveWinner, roundName, type Bracket, type BracketMatch, type BracketSeed } from "@/lib/bracket";

export default function BracketView({
  eventId, bracket, isAdmin, status, participantCount,
}: { eventId: number; bracket: Bracket | null; isAdmin: boolean; status: string; participantCount: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [seededBy, setSeededBy] = useState<"mmr" | "random">("mmr");
  const [busy, setBusy] = useState<string | null>(null);

  // Set up before the event goes live, play it out while live, locked once completed.
  const canGenerate = isAdmin && status !== "Completed";       // create/set up the bracket
  const canRegen = isAdmin && status === "Upcoming";           // reshuffle/clear only before live
  const canAdvance = isAdmin && status === "Live";             // click winners only while live

  const run = (label: string, fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) => {
    setBusy(label);
    start(async () => {
      const res = await fn();
      setBusy(null);
      if (res.error) { toast.error(res.error); return; }
      toast.success(ok);
      router.refresh();
    });
  };

  // ---- No bracket yet ----
  if (!bracket?.rounds?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <Network className="mx-auto mb-3 size-8 text-muted-foreground opacity-60" />
        {canGenerate ? (
          <>
            <p className="text-sm text-muted-foreground">
              No bracket yet. Generate one from the {participantCount} registered player{participantCount === 1 ? "" : "s"}.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <select value={seededBy} onChange={(e) => setSeededBy(e.target.value as "mmr" | "random")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-brand focus:outline-none">
                <option value="mmr">Seed by MMR</option>
                <option value="random">Seed randomly</option>
              </select>
              <button
                onClick={() => run("gen", () => generateBracket(eventId, seededBy), "Bracket generated")}
                disabled={pending || participantCount < 2}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] disabled:opacity-50"
              >
                {busy === "gen" ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />} Generate bracket
              </button>
            </div>
            {participantCount < 2 && <p className="mt-2 text-[11px] text-muted-foreground">Need at least 2 registered players.</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">The bracket hasn&apos;t been published yet.</p>
        )}
      </div>
    );
  }

  const rounds = bracket.rounds;
  const champion = effectiveWinner(rounds[rounds.length - 1]?.[0]);

  const pick = (round: number, matchIndex: number, side: 0 | 1) => {
    setBusy(`w${round}-${matchIndex}`);
    start(async () => {
      const res = await setBracketWinner(eventId, round, matchIndex, side);
      setBusy(null);
      if (res.error) { toast.error(res.error); return; }
      // Clicking the final winner sends the admin to review & award points.
      if (round === rounds.length - 1) {
        toast.success("Champion set — review & award points");
        router.push(`/events/${eventId}/results`);
        return;
      }
      toast.success("Winner recorded");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {canRegen && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Seeded by <b className="text-foreground">{bracket.seededBy === "mmr" ? "MMR" : "Random"}</b> · {bracket.size}-slot bracket</span>
          <div className="ml-auto flex items-center gap-2">
            <select value={seededBy} onChange={(e) => setSeededBy(e.target.value as "mmr" | "random")}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs focus:border-brand focus:outline-none">
              <option value="mmr">MMR</option>
              <option value="random">Random</option>
            </select>
            <button onClick={() => run("regen", () => generateBracket(eventId, seededBy), "Bracket regenerated")} disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-brand transition disabled:opacity-50">
              {busy === "regen" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Regenerate
            </button>
            <button onClick={() => run("clear", () => clearBracket(eventId), "Bracket cleared")} disabled={pending}
              className="inline-grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:border-red-400/50 hover:text-red-400 transition disabled:opacity-50" aria-label="Clear bracket">
              {busy === "clear" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {champion && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand bg-gradient-brand-soft p-4">
          <Crown className="size-6 text-primary" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Champion</div>
            <div className="text-lg font-bold">{champion.name}</div>
          </div>
        </div>
      )}

      {/* Rounds as columns; horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-6" style={{ minWidth: `${rounds.length * 220}px` }}>
          {rounds.map((matches, r) => (
            <div key={r} className="flex min-w-[200px] flex-1 flex-col">
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{roundName(r, rounds.length)}</div>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {matches.map((m, i) => (
                  <MatchCard key={i} match={m} roundIndex={r} canPick={canAdvance} disabled={pending}
                    onPick={(side) => pick(r, i, side)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match, roundIndex, canPick, disabled, onPick,
}: { match: BracketMatch; roundIndex: number; canPick: boolean; disabled: boolean; onPick: (side: 0 | 1) => void }) {
  const bothPresent = !!match.a && !!match.b;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <SlotRow seed={match.a} roundIndex={roundIndex} isWinner={match.winner === 0}
        clickable={canPick && bothPresent} disabled={disabled} onClick={() => onPick(0)} />
      <div className="h-px bg-border" />
      <SlotRow seed={match.b} roundIndex={roundIndex} isWinner={match.winner === 1}
        clickable={canPick && bothPresent} disabled={disabled} onClick={() => onPick(1)} />
    </div>
  );
}

function SlotRow({
  seed, roundIndex, isWinner, clickable, disabled, onClick,
}: { seed: BracketSeed | null; roundIndex: number; isWinner: boolean; clickable: boolean; disabled: boolean; onClick: () => void }) {
  const label = seed ? seed.name : roundIndex === 0 ? "Bye" : "TBD";
  const content = (
    <div className={["flex w-full items-center gap-2 px-3 py-2 text-sm", isWinner ? "bg-gradient-brand-soft font-semibold" : "", !seed ? "text-muted-foreground italic" : ""].join(" ")}>
      {seed && <span className="grid size-5 shrink-0 place-items-center rounded bg-secondary text-[10px] font-bold text-muted-foreground">{seed.seed}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {isWinner && <Crown className="size-3.5 shrink-0 text-primary" />}
    </div>
  );
  if (clickable) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} title="Mark as winner"
        className="w-full text-left transition hover:bg-secondary/50 disabled:opacity-50">
        {content}
      </button>
    );
  }
  return content;
}
