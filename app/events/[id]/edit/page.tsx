import { notFound, redirect } from "next/navigation";
import CreateEventPage from "@/components/createEvent";
import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import type { EventForm } from "@/actions/event";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);

  // Admin guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/auth");
  const { data: me } = await supabase.from("Users").select("role").eq("auth_id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const pub = createPublicClient();
  const [{ data: ev }, { data: games }] = await Promise.all([
    pub.from("Events").select("*").eq("id", eventId).maybeSingle(),
    pub.from("games").select("name").order("name"),
  ]);
  if (!ev) notFound();

  const initial: EventForm = {
    title: ev.event_name ?? "",
    game: ev.game_name ?? "",
    region: ev.event_region ?? "",
    format: ev.event_format ?? "",
    prize: ev.prize_pool != null ? String(ev.prize_pool) : "",
    entry: ev.is_paid ? String(ev.event_fee ?? "") : "Free",
    startsAt: ev.event_date ? `${ev.event_date}T${(ev.event_time ?? "00:00").slice(0, 5)}` : "",
    capacity: ev.total_player != null ? String(ev.total_player) : "",
    description: ev.event_description ?? "",
    cover: ev.cover_image ?? "",
    rules: ev.event_rule ?? "",
    bracketUrl: ev.bracket_url ?? "",
    streamUrl: ev.stream_url ?? "",
    mmrFirst: String(ev.mmr_config?.first ?? 1000),
    mmrSecond: String(ev.mmr_config?.second ?? 600),
    mmrThird: String(ev.mmr_config?.third ?? 300),
    mmrRest: String(ev.mmr_config?.restAmount ?? 100),
    mmrRestCount: String(ev.mmr_config?.restCount ?? 10),
  };

  const gameNames = (games ?? []).map((g) => g.name).filter(Boolean);
  return <CreateEventPage games={gameNames} initial={initial} eventId={eventId} />;
}
