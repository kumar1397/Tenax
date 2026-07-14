import type { Metadata } from "next";
import CreateEventPage from "@/components/createEvent"

export const metadata: Metadata = {
  title: "Create Event",
  description: "Host your own esports tournament on TENAX.",
};

export default function Page() {
  return <CreateEventPage />;
}