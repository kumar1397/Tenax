import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Atmospheric hero background:
 * - Breathing 45deg crimson→wine→black gradient
 * - Sparse drifting ember particles (canvas, soft glow)
 * - Slow radial heartbeat glow behind headline
 * Respects prefers-reduced-motion and scales density on mobile.
 */
export function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Ember = {
      x: number; y: number;
      vy: number; swayAmp: number; swayFreq: number; swayPhase: number;
      r: number; life: number; maxLife: number;
      color: string;
    };
    let embers: Ember[] = [];

    const colors = ["#D7155C", "#F06090"];

    function spawn(initialY?: number): Ember {
      const maxLife = 6 + Math.random() * 8; // seconds
      return {
        x: Math.random() * w,
        y: initialY ?? h + Math.random() * 40,
        vy: 8 + Math.random() * 18, // px/sec upward
        swayAmp: 6 + Math.random() * 14,
        swayFreq: 0.2 + Math.random() * 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        r: 2 + Math.random() * 3,
        life: Math.random() * maxLife,
        maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isMobile = w < 640;
      const count = isMobile ? 10 : 18;
      embers = Array.from({ length: count }, () => spawn(Math.random() * h));
    }

    let last = performance.now();
    function draw(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx!.clearRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "lighter";

      for (const e of embers) {
        e.life += dt;
        if (e.life >= e.maxLife || e.y < -20) {
          Object.assign(e, spawn());
          continue;
        }
        e.y -= e.vy * dt;
        const sway = Math.sin(e.life * e.swayFreq * Math.PI * 2 + e.swayPhase) * e.swayAmp;
        const drawX = e.x + sway;

        // Fade in then out
        const t = e.life / e.maxLife;
        const fade = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const alpha = fade * (0.4 + Math.random() * 0.05);

        const grad = ctx!.createRadialGradient(drawX, e.y, 0, drawX, e.y, e.r * 4);
        grad.addColorStop(0, hexA(e.color, alpha));
        grad.addColorStop(0.4, hexA(e.color, alpha * 0.5));
        grad.addColorStop(1, hexA(e.color, 0));
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(drawX, e.y, e.r * 4, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = hexA(e.color, Math.min(1, alpha * 1.8));
        ctx!.beginPath();
        ctx!.arc(drawX, e.y, e.r * 0.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    }

    resize();
    raf = requestAnimationFrame(draw);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={reduced ? "hero-gradient-static" : "hero-gradient-breathe"} />
      {!reduced && <div className="hero-heartbeat" />}
      {!reduced && (
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      )}
    </div>
  );
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
