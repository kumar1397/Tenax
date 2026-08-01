import { SkeletonBlock, SkeletonGrid } from "@/components/Skeleton";

// Root fallback: shown instantly on any navigation that doesn't have its own
// loading.tsx, so a click paints a skeleton immediately instead of freezing
// the previous page while the server fetches.
export default function Loading() {
  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <SkeletonBlock className="h-9 w-56" />
      <SkeletonGrid />
    </div>
  );
}
