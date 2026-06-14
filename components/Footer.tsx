import Link from "next/link";
import { Swords } from "lucide-react";

const socials = [
  { label: "Discord", href: "#", path: "M20.317 4.369A19.79 19.79 0 0016.558 3a14.7 14.7 0 00-.677 1.382 18.27 18.27 0 00-5.487 0A14.6 14.6 0 009.717 3a19.74 19.74 0 00-3.76 1.369C2.018 10.09 1.04 15.66 1.53 21.144A19.94 19.94 0 007.6 23.5a14.66 14.66 0 001.275-2.06 12.97 12.97 0 01-2.008-.96c.168-.124.333-.253.493-.386a14.13 14.13 0 0012.28 0c.16.133.325.262.493.386-.64.38-1.314.703-2.01.96A14.5 14.5 0 0019.4 23.5a19.92 19.92 0 006.07-2.356c.574-6.353-.98-11.872-4.153-16.775zM8.02 17.6c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.955 2.42-2.157 2.42zm7.96 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42z" },
  { label: "X", href: "#", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "Twitch", href: "#", path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.429h-3.429l-3 3v-3H6.857V1.714h13.714z" },
  { label: "YouTube", href: "#", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" },
];

const columns = [
  { heading: "Compete", links: [{ label: "Events", href: "/events" }, { label: "Players", href: "/users" }, { label: "Leaderboard", href: "/users" }, { label: "Live", href: "/events" }, { label: "Games", href: "/events" }] },
  { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }, { label: "Contact", href: "#" }] },
  { heading: "Support", links: [{ label: "Help Center", href: "#" }, { label: "Tournament Rules", href: "#" }, { label: "FAQ", href: "#" }, { label: "Status", href: "#" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 backdrop-blur mt-12">
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="size-9 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
                <Swords className="size-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">Tenax</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Full-service esports tournaments built to turn competition into opportunity — for every player and creator.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="size-9 rounded-lg bg-secondary/60 border border-border grid place-items-center text-muted-foreground hover:text-white hover:border-brand hover:bg-gradient-brand transition">
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">{col.heading}</div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary transition">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Tenax. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-primary transition">Terms</Link>
            <Link href="#" className="hover:text-primary transition">Privacy</Link>
            <Link href="#" className="hover:text-primary transition">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}