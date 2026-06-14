import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Auth — CrimsonGG",
  description: "Sign in or create your Tenax account to join tournaments.",
};

export default function Page() {
  return <AuthPage />;
}