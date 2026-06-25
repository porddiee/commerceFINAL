import { Card, CardContent } from '@/components/ui/card'

export function ReviewSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded-lg w-1/3" />
            <div className="h-3 bg-muted rounded-lg w-20" />
          </div>
          <div className="h-3 bg-muted rounded-lg w-1/2" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3.5 w-3.5 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2 pl-14">
        <div className="h-3 bg-muted rounded-lg w-full" />
        <div className="h-3 bg-muted rounded-lg w-4/5" />
        <div className="h-3 bg-muted rounded-lg w-3/5" />
      </div>
    </div>
  )
}

export function ReviewsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <ReviewSkeleton key={i} />
      ))}
    </div>
  )
}
