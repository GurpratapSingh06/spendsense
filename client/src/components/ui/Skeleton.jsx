export default function Skeleton({ width = '100%', height = 20, rounded = 'rounded-lg', className = '' }) {
  return (
    <div
      className={`bg-[#E5E7EB]/50 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton height={12} width="40%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={8} />
    </div>
  );
}
