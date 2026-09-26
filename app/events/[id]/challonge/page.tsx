import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEvent } from "@/actions/event";
import { getChallongeMatchData } from "@/actions/challonge";
import ChallongeImport from "@/components/ChallongeImport";

export default async function ChallongeImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);

  // Admin guard (server-side)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth");
  const { data: me } = await supabase.from("Users").select("role").eq("auth_id", user.id).single();
  if (me?.role !== "admin") redirect(`/events/${eventId}`);

  const evRes = await getEvent(eventId);
  if (!evRes.data) notFound();

  const data = await getChallongeMatchData(eventId);

  return <ChallongeImport eventId={eventId} title={evRes.data.event_name ?? "Event"} data={data} />;
}
