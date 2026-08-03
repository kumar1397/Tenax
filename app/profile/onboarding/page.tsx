import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { listOrgs } from "@/actions/event";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: row } = await supabase
    .from("Users")
    .select("handle, player_name, player_image, player_email")
    .eq("auth_id", user.id)
    .maybeSingle();

  // A handle is the "onboarded" marker — if it's already set, skip this page.
  if (row?.handle) redirect("/");

  const { data: orgs } = await listOrgs();

  // OAuth seeds player_name to the provider name or a literal "Player";
  // only prefill a real name, otherwise leave it blank for the user to fill.
  const defaultName = row?.player_name && row.player_name !== "Player" ? row.player_name : "";

  // Prefill email if the provider gave a real one (Steam uses a @steam.local
  // placeholder; some Discord accounts have none) — otherwise leave it blank.
  const isReal = (e?: string | null) => !!e && !e.endsWith("@steam.local");
  const defaultEmail = (isReal(user.email) ? user.email : isReal(row?.player_email) ? row!.player_email : "") ?? "";

  return (
    <OnboardingForm orgs={orgs ?? []} defaultName={defaultName} defaultImage={row?.player_image ?? ""} defaultEmail={defaultEmail} />
  );
}
