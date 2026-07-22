"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { main, useActiveUrl } from "@/components/Sidebar";

// True only after the client has mounted — lets us defer the portal until
// `document.body` exists, without a setState-in-effect or a hydration mismatch.
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const activeUrl = useActiveUrl();

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid place-items-center size-9 rounded-lg border border-border bg-card text-foreground hover:border-brand transition"
      >
        <Menu className="size-5" />
      </button>

      {/*
        The TopBar uses backdrop-blur, which makes it the containing block for
        position:fixed children. Portal the overlay + drawer to <body> so they
        size against the viewport instead of the ~60px header.
      */}
      {mounted &&
        createPortal(
          <>
            {/* Overlay */}
            <div
              onClick={() => setOpen(false)}
              aria-hidden={!open}
              style={{ opacity: open ? 1 : 0, transition: "opacity 300ms ease" }}
              className={[
                "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden",
                open ? "" : "pointer-events-none",
              ].join(" ")}
            />

            {/* Drawer */}
            <aside
              style={{
                transform: open ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 300ms ease",
              }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col border-r border-sidebar-border bg-sidebar shadow-card-soft md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid place-items-center size-9 rounded-lg border border-sidebar-border text-muted-foreground hover:text-foreground transition"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5">
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menu</div>
                <div className="space-y-1">
                  {main.map((item) => {
                    const Icon = item.icon;
                    const active = item.url === activeUrl;
                    return (
                      <Link
                        key={item.title}
                        href={item.url}
                        onClick={() => setOpen(false)}
                        className={[
                          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                          active
                            ? "bg-gradient-brand text-white shadow-glow"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                        ].join(" ")}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                        {active && <span className="ml-auto size-1.5 rounded-full bg-white/90" />}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </aside>
          </>,
          document.body
        )}
    </div>
  );
}
