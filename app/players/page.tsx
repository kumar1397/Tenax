import type { Metadata } from "next";
import UsersPage from "@/components/Users";

export const metadata: Metadata = {
  title: "Players",
  description: "Browse top esports players, view rankings, win rates, and stats across all games.",
};

export default function Page() {
  return <UsersPage />;
}