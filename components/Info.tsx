import { Sparkles } from "lucide-react";

export function WhoWeAre() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur p-8 md:p-12">
      {/* soft crimson glow accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-gradient-brand-soft blur-3xl opacity-60" />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Who We Are
        </div>

        <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
          Turning competition into <span className="text-gradient-brand">opportunity</span>
        </h2>

        <p className="mt-4 text-muted-foreground leading-relaxed">
          Founded in 2022, Tenax — Latin for “tenacious” — is a full-service online tournament
          provider running high-quality, sustainable events across multiple esports titles. We use
          tournaments to open doors for underrepresented and underprivileged communities, giving
          players and creators a real path to grow — from first match to pro.
        </p>
      </div>
    </section>
  );
}