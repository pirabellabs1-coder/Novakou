"use client";

interface LoadingStateProps {
  rows?: number;
  columns?: number;
  showCards?: boolean;
  showChart?: boolean;
  className?: string;
}

export function LoadingState({
  rows = 4,
  columns = 4,
  showCards = true,
  showChart = false,
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`space-y-6 animate-pulse ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-neutral-dark rounded-lg" />
          <div className="h-4 w-72 bg-neutral-dark rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 bg-neutral-dark rounded-lg" />
      </div>

      {/* Cards skeleton */}
      {showCards && (
        <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-4`}>
          {[...Array(columns)].map((_, i) => (
            <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-5 h-28" />
          ))}
        </div>
      )}

      {/* Chart skeleton */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-72" />
          <div className="bg-neutral-dark rounded-xl border border-border-dark h-72" />
        </div>
      )}

      {/* Table/list skeleton */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="h-12 border-b border-border-dark" />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-16 border-b border-border-dark/50 px-5">
            <div className="flex items-center gap-4 h-full">
              <div className="w-10 h-10 bg-border-dark rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-border-dark rounded" />
                <div className="h-3 w-24 bg-border-dark rounded" />
              </div>
              <div className="h-4 w-20 bg-border-dark rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
