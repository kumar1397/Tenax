import { ArrowRight } from "lucide-react";

// TODO: replace with your real Discord invite link
const DISCORD_INVITE = "https://discord.gg/your-invite";

const DISCORD_PATH =
  "M20.317 4.369A19.79 19.79 0 0016.558 3a14.7 14.7 0 00-.677 1.382 18.27 18.27 0 00-5.487 0A14.6 14.6 0 009.717 3a19.74 19.74 0 00-3.76 1.369C2.018 10.09 1.04 15.66 1.53 21.144A19.94 19.94 0 007.6 23.5a14.66 14.66 0 001.275-2.06 12.97 12.97 0 01-2.008-.96c.168-.124.333-.253.493-.386a14.13 14.13 0 0012.28 0c.16.133.325.262.493.386-.64.38-1.314.703-2.01.96A14.5 14.5 0 0019.4 23.5a19.92 19.92 0 006.07-2.356c.574-6.353-.98-11.872-4.153-16.775zM8.02 17.6c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.955 2.42-2.157 2.42zm7.96 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.42 2.157-2.42 1.21 0 2.176 1.094 2.157 2.42 0 1.335-.946 2.42-2.157 2.42z";

export function JoinDiscord() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand shadow-card-soft">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_15%_10%,#C084FC_0%,#A855F7_32%,#7C3AED_60%,#4C1D95_100%)]" />
        <div className="pointer-events-none absolute right-[6%] top-1/2 aspect-square w-[420px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.35),transparent_70%)] blur-2xl" />

        <div className="relative flex flex-col items-center gap-8 p-8 text-center md:flex-row md:justify-between md:p-14 md:text-left">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
            <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
            50,000+ members online
          </div>
          <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">Join Our Discord</h2>
          <p className="mt-3 max-w-lg text-base text-white/80 md:text-lg">
            Chat with players, find teammates, get instant tournament alerts, and hang out with the Tenax community — all in one place.
          </p>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-white py-3 pl-7 pr-4 text-base font-bold text-[#5865F2] shadow-glow transition hover:scale-[1.02] md:text-lg"
          >
            Join the Community
            <span className="grid size-9 place-items-center rounded-full bg-[#5865F2] text-white">
              <ArrowRight className="size-4" />
            </span>
          </a>
        </div>

        {/* Discord glyph */}
        <div className="shrink-0">
          <div className="grid size-40 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm md:size-48">
            <svg viewBox="0 0 24 24" className="size-24 text-white md:size-28" fill="currentColor" aria-hidden="true">
              <path d={DISCORD_PATH} />
            </svg>
          </div>
        </div>
        </div>
      </section>
  );
}
