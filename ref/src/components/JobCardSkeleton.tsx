export default function JobCardSkeleton() {
  return (
    <div className="absolute w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300" />

      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-8 bg-gray-200 rounded w-3/4" />

        {/* Company */}
        <div className="h-6 bg-gray-200 rounded w-1/2" />

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-36" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>

        {/* Match Score */}
        <div className="pt-4 border-t border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-24 mx-auto" />
        </div>
      </div>
    </div>
  )
}
