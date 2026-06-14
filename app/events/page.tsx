import type { Metadata } from "next";
import EventsPage from "@/components/Events";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse and filter live, upcoming, and registration-open esports tournaments.",
};

export default function Page() {
  return <EventsPage />;
}