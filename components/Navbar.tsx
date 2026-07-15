"use client";

import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { MobileNav } from "@/components/MobileNav";

export function TopBar() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = loading
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initial, setInitial] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const load = (user: any) => {
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      setAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      setInitial((user.email?.[0] ?? "?").toUpperCase());
    };

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => load(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <MobileNav />

        <div className="ml-auto">
          {loggedIn === null ? (
            <div className="size-9" />
          ) : loggedIn ? (
            <Link href="/profile" title="Your profile" className="block">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="size-9 rounded-full border-2 border-brand object-cover hover:scale-105 transition"
                />
              ) : (
                <div className="size-9 rounded-full bg-gradient-brand grid place-items-center text-white font-bold text-sm border-2 border-brand hover:scale-105 transition">
                  {initial}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold px-4 py-2 rounded-lg shadow-glow hover:scale-[1.02] transition text-sm"
            >
              <LogIn className="size-4" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}