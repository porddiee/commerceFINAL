'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Bell, Check, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your recent activity
            {unreadCount > 0 && (
              <span className="ml-2 text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="gap-2 text-xs sm:text-sm">
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                !notification.is_read
                  ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/10'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Bell className={`h-5 w-5 mt-1 ${!notification.is_read ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                    {!notification.is_read && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-950" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
