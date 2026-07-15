"use client";

export function AdminMetricsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 rounded-lg bg-primary/10" />
        <div className="h-24 rounded-lg bg-primary/10" />
        <div className="h-24 rounded-lg bg-primary/10" />
      </div>
      <div className="h-10 w-48 rounded bg-primary/10" />
    </div>
  );
}
