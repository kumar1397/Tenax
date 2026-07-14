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
  const { data } = await supabase
    .from("Events")
    .select("*")
    .order("created_at", { ascending: false });

  return <Home initialEvents={data ?? []} />;
}