"use client";

function getTwitchChannel(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("twitch.tv")) return null;
    return u.pathname.split("/").filter(Boolean)[0] ?? null; 
  } catch {
    return null;
  }
}

export function TwitchEmbed({ url }: { url: string }) {
  const channel = getTwitchChannel(url);
  if (!channel) return null;

  // parent must match the domain the page is served from
  const parent =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  return (
    <div className="rounded-xl overflow-hidden border border-border aspect-video bg-black">
      <iframe
        src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}`}
        allowFullScreen
        className="size-full"
      />
    </div>
  );
}