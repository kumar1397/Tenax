"use client";

import { Search, LogIn } from "lucide-react";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            placeholder="Search tournaments, players, games..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
          />
        </div>
        <div>
          {/* <button className="relative p-2 mr-4 rounded-lg hover:bg-card border border-transparent hover:border-border">
            <MessageSquare className="size-4" />
          </button>
          <button className="relative p-2 mr-4 rounded-lg hover:bg-card border border-transparent hover:border-border">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          </button> */}

          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-gradient-brand text-white font-semibold px-4 py-2 rounded-lg shadow-glow hover:scale-[1.02] transition text-sm"
          >
            <LogIn className="size-4" /> Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
