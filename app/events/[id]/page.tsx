import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvent, getEventParticipants } from "@/actions/event";
import EventDetailClient, { type EventVM, type RosterEntry } from "@/components/EventDetail";
import { createClient } from "@/utils/supabase/server";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80";

const STATUS_MAP: Record<string, EventVM["status"]> = {
  upcoming: "Upcoming",
  ongoing: "Live",
  completed: "Completed",
};

function toUiEvent(row: any): EventVM {
  return {
    id: String(row.id),
    title: row.event_name ?? "Untitled",
    game: row.game_name ?? "",
    region: row.event_region ?? "",
    format: row.event_format ?? "",
    prize: row.prize_pool ? `$${Number(row.prize_pool).toLocaleString()}` : "None",
    entry: row.is_paid ? `$${row.event_fee ?? 0}` : "Free",
    startsAt: row.event_date ?? new Date().toISOString(),
    eventTime: row.event_time ?? "",
    status: STATUS_MAP[row.event_status] ?? "Upcoming",
    participants: row.no_of_player ?? 0,
    capacity: row.total_player ?? 0,
    organizer: row.organizer ?? "—",
    cover: row.cover_image || FALLBACK_COVER,
    location: row.event_location ?? "",
    description: row.event_description ?? "",
    rules: row.event_rule ?? "",
    bracketUrl: row.bracket_url ?? "",
    streamUrl: row.stream_url ?? "",
    // completed-only
    impressions: row.impressions ?? null,
    engagement: row.engagement ?? null,
    watchHours: row.watch_hours ?? null,
    avgCcv: row.average_ccv ?? null,
    vodLinks: (row.vod_links ?? []) as string[],
    leaderboard: (row.leaderboard ?? []) as EventVM["leaderboard"],
  };
}

function toRoster(rows: any[]): RosterEntry[] {
  return (rows ?? []).map((r) => ({
    id: String(r.id),
    name: r.Users?.player_name ?? "Unknown",
    org: r.Users?.org_name ?? "",
    team: r.team ?? null,
    avatar:
      r.Users?.player_image,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const res = await getEvent(Number(id));
  if (!res.data) return { title: "Event not found" };
  const ev = toUiEvent(res.data);
  return {
    title: ev.title,
    description: `${ev.title} · ${ev.game} tournament — ${ev.prize} prize pool. ${ev.format} in ${ev.region}.`,
    openGraph: { title: ev.title, images: [ev.cover] },
  };
}

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [eventRes, participantsRes] = await Promise.all([
    getEvent(Number(id)),
    getEventParticipants(Number(id)),
  ]);
  if (!eventRes.data) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let canFinalize = false;
  if (user?.email) {
    const { data: me } = await supabase
      .from("Users").select("role").eq("player_email", user.email).single();
    canFinalize = me?.role === "admin";
  }

  const event = toUiEvent(eventRes.data);
  const roster = toRoster(participantsRes.data ?? []);

  return <EventDetailClient event={event} roster={roster} canFinalize={canFinalize} />;
}