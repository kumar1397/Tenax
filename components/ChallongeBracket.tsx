import { ExternalLink } from "lucide-react";
import { challongeEmbedSrc } from "@/lib/challonge";

// Embeds a Challonge tournament's live bracket. Whatever format the tournament
// uses on Challonge (single/double elim, round robin, Swiss) renders here as-is,
// so we don't have to rebuild those formats ourselves.
export default function ChallongeBracket({ url }: { url: string }) {
  const src = challongeEmbedSrc(url);
  if (!src) return null;

  return (
    <div className="space-y-3">
      {/* Challonge renders on a light background, so keep the frame white. */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <iframe
          src={src}
          title="Challonge bracket"
          className="block h-[640px] w-full border-0"
          loading="lazy"
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ExternalLink className="size-4" /> Open on Challonge
      </a>
    </div>
  );
}
