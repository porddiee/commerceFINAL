import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function MessageSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded w-2/3 animate-pulse" />
      </div>
    </div>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  )
}
