"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Users, Plus, Info } from "lucide-react";

const main = [
  { title: "Home", url: "/", icon: Home },
  { title: "Events", url: "/events", icon: Trophy },
  { title: "Players", url: "/players", icon: Users },
  { title: "Create Event", url: "/events/create", icon: Plus },
  { title: "About Us", url: "/about", icon: Info },
];


export function AppSidebar() {
  const pathname = usePathname();
  const matches = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
  const activeUrl = main
    .map((i) => i.url)
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];

  const isActive = (url: string) => url === activeUrl;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen z-30">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/GC.png" alt="Tenax Logo" width={36} height={36}  />
          <div className="leading-tight">
            <div className="font-display font-bold text-lg tracking-tight">TENAX<span className="text-gradient-brand">GG</span></div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Esports Hub</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <NavGroup label="Menu" items={main} isActive={isActive} />
      </nav>
    </aside>
  );
}

function NavGroup({ label, items, isActive }: { label: string; items: typeof main; isActive: (u: string) => boolean }) {
  return (
    <div>
      <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
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
      className={[
        "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
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
}
