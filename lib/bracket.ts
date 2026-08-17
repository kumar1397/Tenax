// Pure single-elimination bracket helpers — shared by the server action that
// generates/updates a bracket and the client component that renders it.
// No React, no DB, no 'use server'/'use client' — just data transforms.

export type BracketSeed = { playerId: number; name: string; avatar: string; seed: number };
export type BracketMatch = { a: BracketSeed | null; b: BracketSeed | null; winner: 0 | 1 | null };
export type Bracket = { seededBy: "mmr" | "random"; size: number; rounds: BracketMatch[][] };

// Input to generation
export type BracketPlayer = { playerId: number; name: string; avatar: string; mmr: number };

const nextPow2 = (p: number) => {
  let n = 1;
  while (n < p) n *= 2;
  return Math.max(2, n);
};

// Standard tournament seeding slot order for a power-of-two bracket.
// e.g. 4 → [1,4,2,3], 8 → [1,8,4,5,2,7,3,6] — so top seeds are spread apart.
export function seedSlots(n: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < n) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

// The player advancing out of a match: the explicit winner, or — if it's a bye
// (only one side filled) — that side automatically.
export function effectiveWinner(m: BracketMatch | null | undefined): BracketSeed | null {
  if (!m) return null;
  if (m.winner === 0) return m.a;
  if (m.winner === 1) return m.b;
  // Note: an empty side in a later round means "opponent not decided yet" (TBD),
  // NOT a bye — so we do NOT auto-advance here. Byes are resolved at generation
  // (round 1) by setting an explicit winner below.
  return null;
}

// Recompute every round after the first from the previous round's winners.
// Byes auto-advance; a stored winner that no longer points to a present player
// is reset (handles an admin changing an earlier pick).
export function rebuildRounds(rounds: BracketMatch[][]): BracketMatch[][] {
  for (let r = 1; r < rounds.length; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      const match = rounds[r][m];
      match.a = effectiveWinner(rounds[r - 1][2 * m]);
      match.b = effectiveWinner(rounds[r - 1][2 * m + 1]);
      if (match.winner === 0 && !match.a) match.winner = null;
      if (match.winner === 1 && !match.b) match.winner = null;
    }
  }
  return rounds;
}

export function generateSingleElim(players: BracketPlayer[], seededBy: "mmr" | "random"): Bracket {
  const ordered = [...players];
  if (seededBy === "mmr") {
    // Highest MMR first; equal MMR broken randomly (handles everyone-at-0).
    ordered.sort((a, b) => b.mmr - a.mmr || Math.random() - 0.5);
  } else {
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
  }

  const P = ordered.length;
  const size = nextPow2(P);
  const seeded: BracketSeed[] = ordered.map((p, i) => ({
    playerId: p.playerId, name: p.name, avatar: p.avatar, seed: i + 1,
  }));
  const bySeed = (seedNum: number): BracketSeed | null => (seedNum <= P ? seeded[seedNum - 1] : null);

  const slots = seedSlots(size); // values 1..size, one per bracket slot
  const round1: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    const a = bySeed(slots[i]);
    const b = bySeed(slots[i + 1]);
    // A round-1 bye (exactly one side filled) auto-advances that player, set as
    // an explicit winner so it cascades correctly.
    const winner: 0 | 1 | null = a && !b ? 0 : b && !a ? 1 : null;
    round1.push({ a, b, winner });
  }

  const rounds: BracketMatch[][] = [round1];
  let count = round1.length;
  while (count > 1) {
    count = Math.floor(count / 2);
    rounds.push(Array.from({ length: count }, () => ({ a: null, b: null, winner: null } as BracketMatch)));
  }

  rebuildRounds(rounds); // auto-advance any byes
  return { seededBy, size, rounds };
}

// Standard single-elim placement derived from the bracket results:
// champion = 1, final loser = 2, semifinal losers = 3 (tie), quarterfinal
// losers = 5 (tie), etc. Returns playerId -> position.
export function derivePlacements(bracket: Bracket): Record<number, number> {
  const { rounds, size } = bracket;
  const R = rounds.length;
  const out: Record<number, number> = {};
  for (let r = 0; r < R; r++) {
    for (const m of rounds[r]) {
      if (m.winner === null) continue;
      const loser = m.winner === 0 ? m.b : m.a;
      if (loser) out[loser.playerId] = Math.floor(size / 2 ** (r + 1)) + 1;
    }
  }
  const champ = effectiveWinner(rounds[R - 1]?.[0]);
  if (champ) out[champ.playerId] = 1;
  return out;
}

export const roundName = (roundIndex: number, totalRounds: number) => {
  const fromEnd = totalRounds - 1 - roundIndex;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${roundIndex + 1}`;
};
