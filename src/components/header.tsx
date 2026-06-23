'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/lib/store/auth'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, Settings, Bell, Check, ShoppingCart, X } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { user, profile, signOut } = useAuthStore()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchCartCount = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', user.id)
      setCartCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchCartCount()
    }
  }, [user, showNotifications])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    router.push('/login')
  }

  return (
    <header className="border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
      <div className="container flex h-16 items-center justify-end px-4 lg:px-8">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" asChild className="relative hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] rounded-full">
                <Link href="/user/saved">
                  <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] rounded-full">
                    <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                  <DropdownMenuLabel className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-blue-400 dark:to-indigo-400 font-bold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300">
                        <div className="flex items-start gap-2 w-full">
                          <Check className="h-4 w-4 mt-0.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          <div className="flex-1 cursor-pointer" onClick={() => {
                            if (notification.link) {
                              router.push(notification.link)
                              setShowNotifications(false)
                            }
                          }}>
                            <p className="text-sm font-medium">{notification.title || 'Notification'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message || notification.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDismissNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/user/notifications" className="text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-[1.02] transition-all duration-200 ring-2 ring-transparent hover:ring-indigo-500/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-500 text-white font-bold">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300">
                    <Link href="/user/profile">
                      <User className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300">
                    <Link href="/user/settings">
                      <Settings className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                <Link href="/about">About</Link>
              </Button>
              <Button variant="ghost" asChild className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                <Link href="/contact">Contact</Link>
              </Button>
              <Button variant="ghost" asChild className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
