import type { Metadata } from "next";
import Home from "@/components/Home";

export const metadata: Metadata = {
  title: "Home",
  description: "Your esports command center: live tournaments, trending players, and competitive matches.",
};

export default function Page() {
  return <Home />;
}