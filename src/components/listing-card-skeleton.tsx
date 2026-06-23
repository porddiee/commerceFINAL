export default function ListingCardSkeleton() {
  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden h-full flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className="p-2 pb-1">
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden mb-1 relative shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded mb-1 w-3/4 animate-pulse" />
        <div className="h-5 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded w-1/2 animate-pulse" />
      </div>
      <div className="p-2 pt-0 flex-1">
        <div className="flex items-center gap-0.5 mb-0.5">
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full w-1/4 animate-pulse" />
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full w-1/4 animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-1/4 animate-pulse" />
        </div>
      </div>
      <div className="p-2 pt-0">
        <div className="flex items-center gap-0.5">
          <div className="h-4 w-4 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-full animate-pulse" />
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-1/3 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
