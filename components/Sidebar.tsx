"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, Plus, Info, Earth } from "lucide-react";
import { useRole } from "./useRole";

export const main = [
  { title: "Home", url: "/", icon: Home },
  { title: "Events", url: "/events", icon: Trophy },
  { title: "Players", url: "/players", icon: Users },
  { title: "Organisation", url: "/organisation", icon: Earth },
  { title: "Create Event", url: "/events/create", icon: Plus, adminOnly: true },
  { title: "About Us", url: "/about", icon: Info },
];

export function useActiveUrl() {
  const pathname = usePathname();
  const matches = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
  return main
    .map((i) => i.url)
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];
}

export function AppSidebar() {
  const { isAdmin } = useRole();                          
  const visibleItems = main.filter((i) => !i.adminOnly || isAdmin);
  const activeUrl = useActiveUrl();
  const isActive = (url: string) => url === activeUrl;

  return (
    <aside
      className="group hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen z-30
                 w-16 hover:w-60 transition-[width] duration-300 ease-in-out overflow-hidden"
    >
      {/* Logo row */}
      <div className="px-3 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/GC.png" alt="Tenax Logo" width={36} height={36} style={{ height: "auto" }} className="shrink-0" />
          {/* Text fades/reveals with expansion */}
          <div className="leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="font-display font-bold text-lg tracking-tight">
              TENAX<span className="text-gradient-brand">GG</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Esports Hub</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-6">
        <NavGroup label="Menu" isActive={isActive} items={visibleItems}/>
      </nav>
    </aside>
  );
}

function NavGroup({ label, items, isActive }: { label: string; items: typeof main; isActive: (u: string) => boolean }) {
  return (
    <div>
      {/* Group label only visible when expanded */}
      <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap h-3">
        {label}
      </div>
      <div className="space-y-1">
        {items.map((i) => <NavLink key={i.title} item={i} active={isActive(i.url)} />)}
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: { title: string; url: string; icon: any }; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      title={item.title}
      className={[
        "group/link relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-gradient-brand text-white shadow-glow"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="size-4 shrink-0" />
      {/* Label reveals on sidebar hover */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {item.title}
      </span>
      {active && (
        <span className="ml-auto size-1.5 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </Link>
  );
}