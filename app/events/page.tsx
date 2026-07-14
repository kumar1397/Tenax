// app/events/page.tsx  (Server Component — fetches, then passes data down)
import type { Metadata } from "next";
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
  const { data } = await supabase
    .from("Events")
    .select("*")
    .order("created_at", { ascending: false });

  return <EventsPage initialEvents={data ?? []} />;
}