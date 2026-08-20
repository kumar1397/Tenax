"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Hard cap: sign the user out 3 hours after they logged in, regardless of
// activity. The login time is stored in localStorage so it survives reloads,
// and it's only (re)set on a fresh sign-in — never on page loads/token
// refreshes — so the clock is absolute from login.
const MAX_SESSION_MS = 3 * 60 * 60 * 1000; // 3 hours
const KEY = "tenax_login_at";

export function SessionTimeout() {
  useEffect(() => {
    const supabase = createClient();

    const logout = async () => {
      localStorage.removeItem(KEY);
      await supabase.auth.signOut();
      window.location.href = "/auth";
    };

    const check = () => {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (at && Date.now() - at > MAX_SESSION_MS) logout();
    };

    // On load: if there's a session but no start time yet, start the clock now.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !localStorage.getItem(KEY)) localStorage.setItem(KEY, String(Date.now()));
      check();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(KEY);
      } else if (session && !localStorage.getItem(KEY)) {
        // Fresh sign-in (start time was cleared on the previous sign-out).
        localStorage.setItem(KEY, String(Date.now()));
      }
      check();
    });

    const timer = setInterval(check, 60_000); // re-check every minute
    return () => { clearInterval(timer); sub.subscription.unsubscribe(); };
  }, []);

  return null;
}
