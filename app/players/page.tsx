// app/players/page.tsx  (Server Component — fetches, then passes data down)
import type { Metadata } from "next";
import UsersPage from "@/components/Users";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata: Metadata = {
  title: "Players",
  description: "Browse top esports players, view rankings, win rates, and stats across all games.",
};

export const revalidate = 60;

export default async function Page() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("Users")
    .select("*")
    .order("mmr", { ascending: false });

  return <UsersPage initialPlayers={data ?? []} />;
}