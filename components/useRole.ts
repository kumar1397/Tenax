"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user?.email) { setRole(null); setLoading(false); return; }
      const { data: row } = await supabase
        .from("Users")
        .select("role")
        .eq("player_email", data.user.email)
        .single();
      setRole(row?.role ?? null);
      setLoading(false);
    });
  }, []);

  return { role, loading, isAdmin: role === "admin" };
}