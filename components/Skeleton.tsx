export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-slate-200 relative" />

      {/* Content Skeleton */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Source tag & discount pill */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-5 w-20 bg-slate-200 rounded-md" />
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
          </div>

          {/* Title lines */}
          <div className="h-4 bg-slate-200 rounded w-full mb-2" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </div>

        <div>
          {/* Price line */}
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-slate-200 rounded-xl" />
            <div className="h-10 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
