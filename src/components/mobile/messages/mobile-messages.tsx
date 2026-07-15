'use client'

import { MobileLayout } from '../navigation/mobile-layout'
import { MobileHeader } from '../navigation/mobile-header'
import { MobileBottomNav } from '../navigation/mobile-bottom-nav'

interface MobileMessagesProps {
  conversations?: any[]
}

/**
 * MobileMessages - Mobile messages page component
 * Placeholder for mobile-specific messages page implementation
 */
export function MobileMessages({ conversations = [] }: MobileMessagesProps) {
  return (
    <MobileLayout>
      <MobileHeader title="Messages" />
      
      <main className="pb-20">
        <div className="p-4">
          {conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{conversation.username}</h3>
                      <p className="text-slate-500 text-sm truncate">{conversation.lastMessage}</p>
                    </div>
                    <span className="text-slate-400 text-xs">{conversation.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>No messages yet</p>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </MobileLayout>
  )
}
