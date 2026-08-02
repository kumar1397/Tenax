"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, Volume2, VolumeX, Settings, Maximize, Heart, UserPlus, Check, Users, Radio,
} from "lucide-react";
import type { EventVM } from "@/components/EventDetail";

function hhmmss(total: number) {
  const s = Math.max(0, Math.floor(total));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

const fmtCount = (n: number) => n.toLocaleString();

export function StreamPlayer({ event, avatar }: { event: EventVM; avatar?: string }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [following, setFollowing] = useState(false);

  const viewers = Math.max(1, event.participants * 12);
  const hasSource = Boolean(event.streamUrl);
  const progress = duration ? (current / duration) * 100 : 0;

  // Count how long this session has been watching (only while playing).
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setUptime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !hasSource) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) { setMuted((m) => !m); return; }
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (v && duration) { v.currentTime = (Number(e.target.value) / 100) * duration; setCurrent(v.currentTime); }
  };

  const toggleFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div className="space-y-5">
      {/* Player shell */}
      <div ref={shellRef} className="group relative overflow-hidden rounded-2xl border border-border bg-black shadow-card-soft">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            poster={event.cover}
            src={hasSource ? event.streamUrl : undefined}
            muted={muted}
            playsInline
            className="size-full object-cover"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          {/* Online badge */}
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-glow">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> {fmtCount(viewers)} online
          </div>

          {/* Center play button (hidden while playing) */}
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play stream"
              className="absolute inset-0 grid place-items-center"
            >
              <span className="grid size-16 place-items-center rounded-full bg-primary/90 text-white shadow-glow ring-4 ring-white/20 backdrop-blur-sm transition hover:scale-110">
                <Play className="size-7 translate-x-0.5 fill-white" />
              </span>
            </button>
          )}

          {/* Controls bar */}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 py-3 text-white">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="shrink-0 transition hover:text-primary">
              {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-white" />}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="shrink-0 transition hover:text-primary">
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <span className="shrink-0 text-xs font-medium tabular-nums text-white/90">{hhmmss(current)}</span>
            <input
              type="range" min={0} max={100} value={progress} onChange={onSeek} aria-label="Seek"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
              style={{ background: `linear-gradient(to right, #A855F7 ${progress}%, rgba(255,255,255,0.25) ${progress}%)` }}
            />
            <span className="shrink-0 text-xs font-medium tabular-nums text-white/90">{duration ? hhmmss(duration) : "LIVE"}</span>
            <button type="button" aria-label="Settings" className="shrink-0 transition hover:text-primary"><Settings className="size-5" /></button>
            <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="shrink-0 transition hover:text-primary"><Maximize className="size-5" /></button>
          </div>
        </div>
      </div>

      {/* Streamer row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="size-12 rounded-full object-cover ring-2 ring-brand" />
          ) : (
            <div className="grid size-12 place-items-center rounded-full bg-gradient-brand font-bold text-white ring-2 ring-brand">
              {(event.organizer[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold leading-tight">
              {event.organizer} <span className="text-sm text-emerald-400">Live</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Playing in <span className="text-gradient-brand font-semibold">{event.game}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFavorite((f) => !f)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
              favorite ? "border-brand bg-gradient-brand-soft text-foreground" : "border-border bg-secondary/60 text-foreground hover:border-brand",
            ].join(" ")}
          >
            <Heart className={["size-4", favorite ? "fill-primary text-primary" : ""].join(" ")} />
            {favorite ? "Favorited" : "Add To Favorite"}
          </button>
          <button
            type="button"
            onClick={() => setFollowing((f) => !f)}
            className={[
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02]",
              following ? "bg-secondary" : "bg-gradient-brand",
            ].join(" ")}
          >
            {following ? <Check className="size-4" /> : <UserPlus className="size-4" />}
            {following ? "Following" : "Follow Streamer"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-primary" /> {fmtCount(viewers)} watching</span>
        <span className="inline-flex items-center gap-1.5"><Radio className="size-4 text-primary" /> {hhmmss(uptime)} watched</span>
      </div>

      {/* Description */}
      {event.description && (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{event.description}</p>
      )}
    </div>
  );
}
