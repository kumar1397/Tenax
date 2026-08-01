import { SkeletonBlock } from "@/components/Skeleton";

// The event detail page is fully dynamic (auth + role lookup + two DB reads),
// so it's the slowest to navigate to. This paints its shape immediately.
export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      <SkeletonBlock className="h-56 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-40 w-full" />
        </div>
        <div className="space-y-3">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
