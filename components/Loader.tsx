
import { Loader2 } from "lucide-react";

export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}