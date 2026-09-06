export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-parchment-100">
      <div className="skeleton h-32 w-full animate-shimmer" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-16 animate-shimmer rounded" />
        <div className="skeleton h-4 w-3/4 animate-shimmer rounded" />
        <div className="skeleton h-3 w-1/2 animate-shimmer rounded" />
      </div>
    </div>
  );
}
