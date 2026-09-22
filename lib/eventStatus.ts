// Combine a naive date + time into a string that `new Date()` parses in LOCAL
// time. A date-only string ("2026-08-23") is parsed as UTC midnight, which then
// shifts to the previous day for viewers behind UTC — appending a time forces
// local ("wall clock") parsing so the date shows as entered, everywhere.
export function localDateTime(date?: string | null, time?: string | null): string {
  if (!date) return "";
  const t = (time || "00:00").slice(0, 5);
  return `${String(date).slice(0, 10)}T${t}`;
}

export type EventStatus = "Live" | "Upcoming" | "Completed";

// Time-based status, with one committed state:
//   • "Completed" — set when an admin finalizes results (awards MMR). Always wins.
//   • otherwise, derived from the start time:
//       before start  → "Upcoming"
//       at/after start → "Live"  (in progress / awaiting results until finalized)
//
// Note: the start is parsed in the runtime's local timezone (matching how the
// app already displays event dates), so status reflects the viewer's local time.
export function deriveEventStatus(
  row: { event_status?: string | null; event_date?: string | null; event_time?: string | null },
  now: Date = new Date(),
): EventStatus {
  if (row.event_status === "completed") return "Completed";
  if (!row.event_date) return "Upcoming";

  const t = (row.event_time || "00:00").slice(0, 8);
  const time = t.length === 5 ? `${t}:00` : t;
  const start = new Date(`${row.event_date}T${time}`);
  if (Number.isNaN(start.getTime())) return "Upcoming";

  return now.getTime() >= start.getTime() ? "Live" : "Upcoming";
}
