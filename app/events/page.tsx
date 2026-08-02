  // app/events/page.tsx  (Server Component — fetches, then passes data down)
  import type { Metadata } from "next";
  import { Suspense } from "react";
  import EventsPage from "@/components/Events";
  import { createPublicClient } from "@/utils/supabase/public";

  export const metadata: Metadata = {
    title: "Events",
    description: "Browse and filter live, upcoming, and registration-open esports tournaments.",
  };

  // Cache the rendered page; re-fetch at most once every 60s
  export const revalidate = 60;

  export default async function Page() {
    const supabase = createPublicClient();
    const [{ data: events }, { data: games }] = await Promise.all([
      supabase.from("Events").select("*").order("created_at", { ascending: false }),
      supabase.from("games").select("name, cover_image").order("name"),
    ]);
    const gameNames = (games ?? []).map((g) => g.name).filter(Boolean);
    const gameCovers: Record<string, string> = {};
    for (const g of games ?? []) {
      if (g?.name && g?.cover_image) gameCovers[g.name] = g.cover_image;
    }

    return (
      <Suspense>
        <EventsPage initialEvents={events ?? []} games={gameNames} gameCovers={gameCovers} />
      </Suspense>
    );
  }