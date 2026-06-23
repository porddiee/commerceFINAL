import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function MessageSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gray-200 animate-pulse" />
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
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
