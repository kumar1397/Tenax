
"use client";
export default function Error({ error }: { error: Error }) {
  return <div className="p-10 text-center text-muted-foreground">{error.message}</div>;
}