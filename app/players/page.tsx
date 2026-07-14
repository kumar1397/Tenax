// app/players/page.tsx  (join orgs so player rows carry org info)
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
    .select("*, orgs(id, name, tricode, logo, link)")
    .order("mmr", { ascending: false });

  return <UsersPage initialPlayers={data ?? []} />;
}