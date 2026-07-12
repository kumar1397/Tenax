"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import { registerForEvent } from "@/actions/event";

export function RegisterButton({ eventId }: { eventId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    const res = await registerForEvent(eventId);
    setLoading(false);

    if (res.success) {
      toast.success("Registered! See you in the bracket.");
      router.refresh();
      return;
    }

    // Not signed in
    if (res.error === "You must be signed in to register.") {
      toast.error("Please sign in first.");
      router.push("/auth");
      return;
    }

    // Profile incomplete → send them to complete it
    if (res.error === "INCOMPLETE_PROFILE") {
      toast.error(`Complete your profile first: ${res.missing?.join(", ")}`);
      router.push("/profile");
      return;
    }

    // Already registered / other errors
    toast.error(res.error ?? "Something went wrong.");
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="mt-4 w-full bg-gradient-brand text-white font-bold py-3 rounded-xl shadow-glow hover:scale-[1.02] transition"
    >
      {loading ? "Registering..." : "Register Now"}
    </button>
  );
}