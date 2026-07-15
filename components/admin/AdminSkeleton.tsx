"use client";

export function AdminSkeleton({ rows = true }: { rows?: boolean }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-48 rounded bg-primary/10" />
      {rows && <div className="h-64 rounded-lg bg-primary/10" />}
    </div>
  );
}
