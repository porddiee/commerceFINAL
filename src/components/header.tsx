/*  */'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useCartStore } from '@/lib/store/auth'
import { createClient } from '@/lib/supabase/client'
import { notificationsService, savedListingsService } from '@/services'
import { Search, User, LogOut, Settings, Bell, Check, ShoppingCart, X, MessageSquare } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function Header() {
  const router = useRouter()
  const { user, profile, signOut } = useAuthStore()
  const { cartCount, setCartCount } = useCartStore()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = async () => {
    if (!user) return
    try {
      const data = await notificationsService.getNotificationsByUser(user.id)
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchCartCount = async () => {
    if (!user) return
    try {
      const data = await savedListingsService.getSavedListingsByUser(user.id)
      setCartCount(data.length)
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await notificationsService.updateNotification(notification.id, { is_read: true })
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link)
      setShowNotifications(false)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      await notificationsService.markAllAsRead(user.id)
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchCartCount()
    } else {
      setCartCount(0)
    }
  }, [user])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`header-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Real-time subscription for new messages → show toast popup
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`header-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          // Fetch sender profile for name
          let senderName = 'Someone'
          try {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single()
            if (senderProfile?.full_name) {
              senderName = senderProfile.full_name
            }
          } catch (e) {
            // fallback to "Someone"
          }

          const msgPreview = newMsg.content?.length > 60
            ? newMsg.content.substring(0, 60) + '…'
            : newMsg.content || 'Sent you a message'

          toast({
            title: `💬 New message from ${senderName}`,
            description: msgPreview,
            variant: 'default',
            duration: 6000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Search suggestions
  useEffect(() => {
    const fetchSearchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price')
          .ilike('title', `%${searchQuery.trim()}%`)
          .eq('status', 'active')
          .limit(5)

        if (error) throw error
        setSearchSuggestions(data || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching search suggestions:', error)
        setSearchSuggestions([])
      }
    }

    const debounceTimer = setTimeout(fetchSearchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    router.push('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-55 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-sm transition-all duration-200">
      <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo + Site Name */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
          <img
            src="/ChatGPT%20Image%20Jul%2018%2C%202026%2C%2010_28_59%20AM.png"
            alt="SGShop Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-sm"
          />
          <span className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="text-indigo-950 dark:text-indigo-200">SG</span><span className="text-indigo-600 dark:text-indigo-400">SHOP</span>
          </span>
        </Link>
        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg ml-[0%] lg:ml-[3%] mr-auto items-center">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-9 pr-9 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-sm text-slate-800 dark:text-slate-100"
              />
              <Button
                type="submit"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-200 h-7 w-7 flex items-center justify-center p-0"
                aria-label="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                  {searchSuggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={`/products/${suggestion.id}`}
                      onClick={() => {
                        setSearchQuery(suggestion.title)
                        setShowSuggestions(false)
                      }}
                      className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="font-medium text-xs text-slate-900 dark:text-slate-100">{suggestion.title}</div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400">₱{suggestion.price?.toLocaleString()}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              {/* Shopping Cart button link */}
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="relative hover:bg-indigo-500/5 hover:scale-105 active:scale-95 transition-all duration-200 rounded-full h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-indigo-650"
              >
                <Link href="/user/saved">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Notifications Dropdown */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative hover:bg-indigo-500/5 hover:scale-105 active:scale-95 transition-all duration-200 rounded-full h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-indigo-650"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 sm:w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-2 shadow-xl z-50 mt-1" align="end" forceMount>
                  <div className="flex items-center justify-between px-2 py-1">
                    <DropdownMenuLabel className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 p-0">
                      <Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-500" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-1 text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {unreadCount} new
                        </span>
                      )}
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={markAllAsRead}
                        className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-full"
                      >
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-1 sm:my-1.5" />
                  <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto space-y-1 pr-1">
                    {notifications.length === 0 ? (
                      <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-muted-foreground font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg hover:bg-indigo-500/5 transition-colors group relative cursor-pointer ${
                            !notification.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="relative flex-shrink-0 mt-0.5">
                            <Check className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${!notification.is_read ? 'text-indigo-500' : 'text-slate-400'}`} />
                            {!notification.is_read && (
                              <span className="absolute -top-0.5 -right-0.5 h-1.5 sm:h-2 w-1.5 sm:w-2 bg-indigo-500 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] sm:text-xs font-bold truncate ${!notification.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                              {notification.title || 'Notification'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 leading-normal line-clamp-2">
                              {notification.message || notification.content}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">{new Date(notification.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 sm:h-5 sm:w-5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDismissNotification(notification.id)
                            }}
                          >
                            <X className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-1 sm:my-1.5" />
                  <DropdownMenuItem asChild className="rounded-lg justify-center p-1.5 sm:p-2">
                    <Link href="/user/notifications" className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Avatar Account Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 ring-2 ring-indigo-500/10 hover:ring-indigo-500/35 p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-xs uppercase">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-1.5 shadow-xl mt-1" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-2.5 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-100">{profile?.full_name || 'My Profile'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="rounded-lg hover:bg-indigo-500/5 px-2.5 py-2 cursor-pointer">
                    <Link href="/user/profile">
                      <User className="mr-2 h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-semibold">My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg hover:bg-indigo-500/5 px-2.5 py-2 cursor-pointer">
                    <Link href="/user/settings">
                      <Settings className="mr-2 h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-semibold">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg hover:bg-rose-500/10 px-2.5 py-2 text-rose-600 dark:text-rose-400 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hover:bg-indigo-500/5 hover:scale-102 active:scale-98 transition-all rounded-full px-4 h-9 font-semibold text-xs text-slate-600 dark:text-slate-400">
                <Link href="/about">About</Link>
              </Button>
              <Button variant="ghost" asChild className="hover:bg-indigo-500/5 hover:scale-102 active:scale-98 transition-all rounded-full px-4 h-9 font-semibold text-xs text-slate-600 dark:text-slate-400">
                <Link href="/contact">Contact</Link>
              </Button>
              <Button variant="ghost" asChild className="hover:bg-indigo-500/5 hover:scale-102 active:scale-98 transition-all rounded-full px-4 h-9 font-semibold text-xs text-slate-600 dark:text-slate-400">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all rounded-full px-4 h-9 font-bold text-xs">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
