import type { Metadata } from "next";
import CreateEventPage from "@/components/createEvent"
import { createPublicClient } from "@/utils/supabase/public";

export const metadata: Metadata = {
  title: "Create Event",
  description: "Host your own esports tournament on TENAX.",
};

export default async function Page() {
  const supabase = createPublicClient();
  const { data: games } = await supabase.from("games").select("name").order("name");
  const gameNames = (games ?? []).map((g) => g.name).filter(Boolean);
  return <CreateEventPage games={gameNames} />;
}