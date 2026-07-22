"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, Lock, Loader2, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { signIn, signUp } from "@/actions/auth";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = mode === "signup" ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    if (mode === "signup") {
      toast.success("Account created! Check your email to confirm (if required).");
      setMode("signin");
    } else {
      toast.success("Welcome back, summoner.");
      router.push("/");
      router.refresh();
    }
  }

  async function handleOAuth(provider: "google" | "discord") {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
    // On success the browser is redirected to the provider automatically.
  }

  function notSupported(name: string) {
    toast(`${name} sign-in coming soon`);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-brand-soft" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(215,21,92,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(215,21,92,0.15),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="size-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
            <Trophy className="size-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient-brand">CrimsonGG</span>
        </Link>

        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-card-soft">
          <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "signin" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${mode === "signup" ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground"}`}
            >
              Sign up
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {mode === "signin" ? "Welcome back" : "Join the arena"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signin" ? "Sign in to track tournaments and climb the ranks." : "Create your account in seconds."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@arena.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-secondary/60 border border-border focus:border-brand focus:outline-none text-sm"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-secondary/60 border border-border focus:border-brand focus:outline-none text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:scale-[1.01] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SocialButton label="Google" onClick={() => handleOAuth("google")} disabled={loading}>
              <svg viewBox="0 0 24 24" className="size-5"><path fill="#fff" d="M21.35 11.1h-9.17v2.97h5.27c-.23 1.45-1.69 4.24-5.27 4.24-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.92 4.06 14.78 3 12.18 3 6.96 3 2.76 7.2 2.76 12.45s4.2 9.45 9.42 9.45c5.44 0 9.04-3.82 9.04-9.2 0-.62-.07-1.09-.17-1.6z" /></svg>
            </SocialButton>
            <SocialButton label="Discord" onClick={() => handleOAuth("discord")} disabled={loading}>
              <svg viewBox="0 0 24 24" className="size-5" fill="#5865F2"><path d="M20.317 4.369A19.79 19.79 0 0016.558 3a14.7 14.7 0 00-.677 1.382 18.27 18.27 0 00-5.487 0A14.6 14.6 0 009.717 3a19.74 19.74 0 00-3.76 1.369C2.018 10.09 1.04 15.66 1.53 21.144A19.94 19.94 0 007.6 23.5a14.66 14.66 0 001.275-2.06 12.97 12.97 0 01-2.008-.96c.168-.124.333-.253.493-.386a14.13 14.13 0 0012.28 0c.16.133.325.262.493.386-.64.38-1.314.703-2.01.96A14.5 14.5 0 0019.4 23.5a19.92 19.92 0 006.07-2.356c.574-6.353-.98-11.872-4.153-16.775zM8.02 17.6c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.955 2.42-2.157 2.42zm7.96 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42z" /></svg>
            </SocialButton>
            <SocialButton label="Steam" onClick={() => notSupported("Steam")}>
              <svg viewBox="0 0 24 24" className="size-5" fill="#fff"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.96.4 1.418 1.501 1.022 2.461-.397.96-1.501 1.42-2.46 1.022z" /></svg>
            </SocialButton>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-secondary/60 border border-border hover:border-brand hover:bg-secondary transition disabled:opacity-60"
    >
      {children}
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}