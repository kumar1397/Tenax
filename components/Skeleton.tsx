// Lightweight skeleton primitives shared by route-level loading.tsx files.
// A pulsing block on the card surface; used to paint instant feedback on
// navigation so clicks never leave the user staring at the old page.
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-card/70 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-card-soft">
      <SkeletonBlock className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
