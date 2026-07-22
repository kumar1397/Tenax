import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function CreateEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) redirect("/auth");

  const { data: row } = await supabase
    .from("Users")
    .select("role")
    .eq("player_email", user.email)
    .single();

  if (row?.role !== "admin") redirect("/");

  return <>{children}</>;
}