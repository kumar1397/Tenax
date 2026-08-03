// app/page.tsx  (Server Component — fetches events, passes them down)
import type { Metadata } from "next";
import Home from "@/components/Home";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata: Metadata = {
  title: "Home",
  description: "Your esports command center: live tournaments, trending players, and competitive matches.",
};

export const revalidate = 60;

export default async function Page() {
  const supabase = createPublicClient();

  const [{ data: events }, { data: games }] = await Promise.all([
    supabase.from("Events").select("*").order("created_at", { ascending: false }),
    // `games` is a small catalog table (name + cover_image). If it doesn't exist
    // yet, this resolves to null and covers gracefully fall back to event covers.
    supabase.from("games").select("name, cover_image"),
  ]);

  const gameCovers: Record<string, string> = {};
  for (const g of games ?? []) {
    if (g?.name && g?.cover_image) gameCovers[g.name] = g.cover_image;
  }

  return <Home initialEvents={events ?? []} gameCovers={gameCovers} />;
}