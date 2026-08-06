import type { Metadata } from "next";
import AdminDashboard from "@/components/AdminDashboard";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata: Metadata = { title: "Admin Control" };
// Admin data must always be fresh (reflects deletes/edits immediately)
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { upcoming: "Upcoming", ongoing: "Live", completed: "Completed" };

export default async function AdminPage() {
  const supabase = createPublicClient();
  const [{ data: players }, { data: events }, { data: games }] = await Promise.all([
    supabase
      .from("Users")
      .select("id, player_name, handle, player_image, mmr, region, role, orgs(name, tricode)")
      .order("mmr", { ascending: false, nullsFirst: false }),
    supabase.from("Events").select("*").order("event_date", { ascending: true }),
    supabase.from("games").select("name, cover_image"),
  ]);

  const gameCovers: Record<string, string> = {};
  for (const g of games ?? []) if (g?.name && g?.cover_image) gameCovers[g.name] = g.cover_image;

  const playerRows = (players ?? []).map((p: any) => ({
    id: p.id,
    name: p.player_name || p.handle || "Player",
    handle: p.handle ?? "",
    image: p.player_image ?? "",
    mmr: p.mmr ?? 0,
    region: p.region ?? "",
    role: p.role ?? "user",
    org: p.orgs?.tricode || p.orgs?.name || "",
  }));

  const eventRows = (events ?? []).map((e: any) => ({
    id: String(e.id),
    title: e.event_name ?? "Untitled",
    game: e.game_name ?? "",
    region: e.event_region ?? "",
    format: e.event_format ?? "",
    status: STATUS_LABEL[e.event_status] ?? "Upcoming",
    date: e.event_date ?? "",
    time: e.event_time ?? "",
    cover: typeof e.cover_image === "string" && /^https?:\/\//.test(e.cover_image) ? e.cover_image : "",
    prize: e.prize_pool ? `$${Number(e.prize_pool).toLocaleString()}` : "Free",
    prizeNum: e.prize_pool ? Number(e.prize_pool) : 0,
    paid: !!e.is_paid,
    participants: e.no_of_player ?? 0,
    capacity: e.total_player ?? 0,
  }));

  const gameNames = (games ?? []).map((g: any) => g.name).filter(Boolean);

  return <AdminDashboard players={playerRows} events={eventRows} gameCovers={gameCovers} games={gameNames} />;
}
