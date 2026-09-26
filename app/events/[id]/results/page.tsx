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
        .from("Users").select("role").eq("auth_id", user.id).single();
    if (me?.role !== "admin") redirect(`/events/${eventId}`);

    const [eventRes, participantsRes] = await Promise.all([
        getEvent(eventId),
        getEventParticipants(eventId),
    ]);
    if (!eventRes.data) notFound();

    const ev = eventRes.data;
    const roster = (participantsRes.data ?? []).map((r: any) => ({
        id: String(r.id),
        userId: r.Users?.id ?? null,
        name: r.Users?.player_name ?? "Unknown",
        org: r.Users?.orgs?.tricode ?? r.Users?.orgs?.name ?? "",
        avatar: r.Users?.player_image ?? "",
    }));

    const c = (ev.mmr_config ?? {}) as any;
    const mmrConfig = {
        first: Number(c.first) || 0,
        second: Number(c.second) || 0,
        third: Number(c.third) || 0,
        restAmount: Number(c.restAmount) || 0,
        restCount: Number(c.restCount) || 0,
    };

    // No bracket-driven pre-fill anymore — the admin assigns placements here.
    // (When Challonge result import lands, this is where those placements will
    // seed initialPositions instead.)
    const initialPositions: Record<string, number> = {};

    return (
        <AssignPoints
            eventId={eventId}
            title={ev.event_name ?? "Event"}
            cover={ev.cover_image ?? ""}
            roster={roster}
            mmrConfig={mmrConfig}
            initialPositions={initialPositions}
        />
    );
}