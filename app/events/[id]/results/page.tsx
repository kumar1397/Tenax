import { notFound, redirect } from "next/navigation";
import { getEvent, getEventParticipants } from "@/actions/event";
import { createClient } from "@/utils/supabase/server";
import AssignPoints from "@/components/AssignPoints";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const eventId = Number(id);

    // Admin guard (server-side)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) redirect("/auth");
    const { data: me } = await supabase
        .from("Users").select("role").eq("player_email", user.email).single();
    if (me?.role !== "admin") redirect(`/events/${eventId}`);

    const [eventRes, participantsRes] = await Promise.all([
        getEvent(eventId),
        getEventParticipants(eventId),
    ]);
    if (!eventRes.data) notFound();

    const ev = eventRes.data;
    const roster = (participantsRes.data ?? []).map((r: any) => ({
        id: String(r.id),
        name: r.Users?.player_name ?? "Unknown",
        org: r.Users?.org_name ?? "",
        avatar: r.Users?.player_image ?? "",
    }));

    return (
        <AssignPoints eventId={eventId} title={ev.event_name ?? "Event"} cover={ev.cover_image ?? ""} roster={roster} />
    );
}