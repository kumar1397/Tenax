"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { saveContactEmail } from "@/actions/profile";

export default function ContactEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMsg("Error: Enter a valid email.");
      return;
    }
    setMsg("");
    start(async () => {
      const res = await saveContactEmail(email);
      if (res?.error) { setMsg("Error: " + res.error); return; }
      router.replace("/");
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-16">
      <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-card-soft">
        <div className="size-12 mx-auto rounded-xl bg-gradient-brand-soft border border-brand grid place-items-center mb-4">
          <Mail className="size-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Add your email</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Steam doesn&apos;t share your email. Please add one to finish setting up your account.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-secondary/60 border border-border focus:border-brand focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:scale-[1.01] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save email
          </button>
        </form>

        {msg && <p className={`mt-3 text-sm text-center ${msg.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{msg}</p>}
      </div>
    </div>
  );
}