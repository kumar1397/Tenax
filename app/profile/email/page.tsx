import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ContactEmailForm from "@/components/ContactEmailForm";

export default async function ProfileEmailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Already has a real email (not the Steam placeholder)? Skip this page.
  const { data: row } = await supabase
    .from("Users")
    .select("player_email")
    .eq("auth_id", user.id)
    .single();

  if (row?.player_email && !row.player_email.endsWith("@steam.local")) redirect("/");

  return <ContactEmailForm />;
}