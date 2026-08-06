import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Server-side gate: only admins may access anything under /admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth");

  const { data: row } = await supabase.from("Users").select("role").eq("auth_id", user.id).single();
  if (row?.role !== "admin") redirect("/");

  return <>{children}</>;
}
