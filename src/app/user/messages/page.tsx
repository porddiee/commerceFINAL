'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { messagesService, profilesService } from '@/services'
import { toast } from '@/hooks/use-toast'
import { MessageSquare, User, Send, ArrowLeft, MoreVertical, Trash2, Edit2, Check, CheckCheck, Search, Info, RefreshCw } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConversationSkeleton } from '@/components/skeletons/message-skeleton'

export default function MessagesPage() {
  console.log('MessagesPage component rendering')
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sellerId = searchParams.get('seller')
  const listingId = searchParams.get('listing')
  console.log('URL params:', { sellerId, listingId })
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newMessage, setNewMessage] = useState({
    receiver_id: sellerId || '',
    content: '',
    listing_id: listingId || '',
  })
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [messageInput, setMessageInput] = useState('')
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [editContent, setEditContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const conversationsEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const isMobileRef = useRef(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      if (sellerId) {
        fetchSellerProfile(sellerId)
        setShowNewMessage(true)
        setNewMessage(prev => ({ ...prev, receiver_id: sellerId, listing_id: listingId || '' }))
      }
    }
  }, [user, sellerId, listingId])

  useEffect(() => {
    console.log('showNewMessage changed:', showNewMessage)
    console.log('newMessage state:', newMessage)
  }, [showNewMessage, newMessage])

  // Swipe-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY
    const diff = touchEnd - touchStart
    if (diff > 100 && !isRefreshing && window.scrollY === 0) {
      setIsRefreshing(true)
      fetchConversations().finally(() => setIsRefreshing(false))
    }
  }

  // Auto-select the most recent conversation after fetching (on desktop only)
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && !sellerId && !isMobileRef.current) {
      setSelectedConversation(conversations[0])
    }
  }, [conversations, selectedConversation, sellerId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (conversationsEndRef.current) {
      conversationsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id)
    }
  }, [selectedConversation])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user || !selectedConversation) return

    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`,
        },
        (payload) => {
          const newMsg = payload.new
          const isRelated = newMsg.sender_id === selectedConversation.other_user_id || newMsg.receiver_id === selectedConversation.other_user_id
          if (isRelated) {
            setMessages((prev) => [...prev, newMsg])
          }
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedConversation])

  // Refetch conversations when page becomes visible (after navigating back from conversation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchConversations()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const fetchSellerProfile = async (id: string) => {
    const data = await profilesService.getProfileById(id)
    setSellerProfile(data)
  }

  const fetchConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('Fetching conversations for user:', user.id)
      const conversations = await messagesService.getConversations(user.id)
      console.log('Fetched conversations:', conversations)
      setConversations(conversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (otherId: string) => {
    if (!user || !selectedConversation || !otherId) return

    try {
      // Always fetch all messages between the two users, regardless of listing_id
      // This preserves the full conversation history across different products
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
        .is('deleted_by_sender', null)
        .order('created_at', { ascending: true })
      const messages = data || []
      setMessages(messages)

      // Mark all messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherId)
        .is('deleted_by_receiver', null)
      
      // Refetch conversations to update unread counts
      fetchConversations()
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedConversation || !messageInput.trim()) return

    const messageContent = messageInput.trim()
    setMessageInput('')

    try {
      // Allow sending messages without listing_id
      const listingId = selectedConversation.listing_id || null
      const messageData = {
        listing_id: listingId,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user_id,
        content: messageContent,
      }
      
      console.log('Sending message with data:', messageData)
      console.log('Selected conversation:', selectedConversation)
      
      await messagesService.createMessage(messageData)
      fetchMessages(selectedConversation.other_user_id)
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      setMessageInput(messageContent) // Restore message on error
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' })
    }
  }

  const handleNewMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Attempting to send new message:', newMessage)
    console.log('User:', user)
    console.log('Validation checks:', {
      hasUser: !!user,
      hasReceiverId: !!newMessage.receiver_id,
      hasListingId: !!newMessage.listing_id,
      hasContent: !!newMessage.content.trim()
    })

    if (!user || !newMessage.receiver_id || !newMessage.listing_id || !newMessage.content.trim()) {
      console.error('Validation failed - missing required fields')
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    try {
      console.log('Creating message with:', {
        listing_id: newMessage.listing_id,
        sender_id: user.id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content.trim()
      })

      const createdMessage = await messagesService.createMessage({
        listing_id: newMessage.listing_id,
        sender_id: user.id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content.trim(),
      })

      console.log('Message created successfully:', createdMessage)
      
      // Direct check if message exists in database
      const { data: checkMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('id', createdMessage.id)
        .single()
      
      console.log('Message check from database:', checkMessage)
      
      toast({ title: 'Success', description: 'Message sent! Refreshing conversations...' })
      setShowNewMessage(false)
      setNewMessage({ receiver_id: '', content: '', listing_id: '' })
      await fetchConversations()
      
      // Check conversations after refresh
      setTimeout(() => {
        console.log('Current conversations state:', conversations)
      }, 500)
    } catch (error) {
      console.error('Error sending new message:', error)
      toast({ title: 'Error', description: 'Failed to send message: ' + (error as any)?.message || 'Unknown error', variant: 'destructive' })
    }
  }

  const startEditing = (message: any) => {
    setEditingMessage(message)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const handleEditMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMessage || !editContent.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editContent.trim(), edited_at: new Date().toISOString() })
        .eq('id', editingMessage.id)

      if (error) throw error

      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: editContent.trim(), edited_at: new Date().toISOString() } : m))
      setEditingMessage(null)
      setEditContent('')
    } catch (error) {
      console.error('Error editing message:', error)
      toast({ title: 'Error', description: 'Failed to edit message', variant: 'destructive' })
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_by_sender: true })
        .eq('id', id)

      if (error) throw error

      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' })
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user) return
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return

    try {
      console.log('Deleting conversation:', {
        userId: user.id,
        otherUserId: selectedConversation.other_user_id,
        listingId: selectedConversation.listing_id
      })

      // Only mark messages where the current user is the sender as deleted
      const { error } = await supabase
        .from('messages')
        .update({ deleted_by_sender: new Date().toISOString() })
        .eq('sender_id', user.id)
        .eq('receiver_id', selectedConversation.other_user_id)
        .eq('listing_id', selectedConversation.listing_id)

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }

      setSelectedConversation(null)
      fetchConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({ title: 'Error', description: 'Failed to delete conversation: ' + (error as any)?.message || JSON.stringify(error), variant: 'destructive' })
    }
  }

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      className="flex flex-col h-[calc(100vh-110px)] max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* Page Header */}
      <div className="relative overflow-hidden p-2.5 sm:p-3 md:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-32 sm:w-40 md:w-56 h-32 sm:h-40 md:h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-7 h-7 sm:w-8 sm:h-10 md:w-10 md:h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Inbox</p>
              <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-extrabold text-white tracking-tight leading-tight">Your Discussions</h1>
              <p className="hidden sm:block text-[9px] sm:text-[10px] md:text-xs font-semibold text-indigo-200/80 mt-0.5">Connect and coordinate with local buyers and sellers</p>
            </div>
          </div>
          {!showNewMessage && (
            <Button
              onClick={() => setShowNewMessage(true)}
              variant="ghost"
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl h-8 sm:h-9 md:h-10 px-2.5 sm:px-4 md:px-5 text-[10px] sm:text-xs md:text-sm transition-all flex-shrink-0"
            >
              <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-lg min-h-0 w-full">
        {showNewMessage ? (
          <div className="flex-1 p-3 sm:p-4 flex items-center justify-center bg-slate-55/10 dark:bg-slate-900/5">
            <Card className="w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <CardTitle className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Start Conversation</CardTitle>
                    <CardDescription className="font-semibold text-slate-500 text-[10px] sm:text-xs">Initiate a direct chat thread</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewMessage(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 h-8 w-8">
                    <ArrowLeft className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <form onSubmit={(e) => {
                  console.log('Form submitted!')
                  handleNewMessageSubmit(e)
                }} className="space-y-2.5 sm:space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="receiver" className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recipient Profile ID</Label>
                    {sellerProfile ? (
                      <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg border border-indigo-150 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/40">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-indigo-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-[10px] sm:text-xs">{sellerProfile.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-slate-200">{sellerProfile.full_name}</span>
                      </div>
                    ) : (
                      <Input
                        id="receiver"
                        value={newMessage.receiver_id}
                        onChange={(e) => setNewMessage({ ...newMessage, receiver_id: e.target.value })}
                        placeholder="Paste recipient's Supabase User ID..."
                        required
                        className="h-8 sm:h-9 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-lg font-semibold text-[10px] sm:text-xs"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="listing" className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Listing ID</Label>
                    <Input
                      id="listing"
                      value={newMessage.listing_id}
                      onChange={(e) => setNewMessage({ ...newMessage, listing_id: e.target.value })}
                      placeholder="Listing ID (required)..."
                      required
                      className="h-8 sm:h-9 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-lg font-semibold text-[10px] sm:text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="content" className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Message Content</Label>
                    <textarea
                      id="content"
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="Type a polite introductory message..."
                      rows={3}
                      className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-semibold text-[10px] sm:text-xs"
                      required
                    />
                  </div>
                  <div className="pt-1">
                    <Button 
                      type="submit" 
                      onClick={() => console.log('Button clicked!')}
                      className="w-full h-9 sm:h-10 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold rounded-lg shadow-md transition-transform hover:-translate-y-0.5 text-[10px] sm:text-xs"
                    >
                      <Send className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Send Message
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Conversations Sidebar List */}
            <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/10 overflow-hidden flex flex-col shrink-0 overflow-x-hidden ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/85 space-y-2 sm:space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <Input
                    placeholder="Filter by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-9 h-9 sm:h-10 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 focus:border-indigo-500 focus:ring-indigo-500/5 rounded-xl text-[10px] sm:text-xs font-semibold"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5">
                  {loading && conversations.length === 0 ? (
                    <ConversationSkeleton />
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs font-bold text-slate-400">No chats found</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const isSelected = selectedConversation?.other_user_id === conv.other_user_id
                      const conversationKey = `${conv.listing_id}-${conv.other_user_id}`
                      return (
                        <div
                          key={conversationKey}
                          onClick={() => {
                            setSelectedConversation(conv)
                            setConversations(prev => prev.map(c =>
                              c.other_user_id === conv.other_user_id
                                ? { ...c, unread_count: 0 }
                                : c
                            ))
                          }}
                          className={`p-2 sm:p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-indigo-50/55 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                              : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/40 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-indigo-500/10">
                                {conv.other_user?.avatar_url && (
                                  <AvatarImage src={conv.other_user.avatar_url} />
                                )}
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-[10px] sm:text-xs">
                                  {conv.other_user?.full_name?.charAt(0) || <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              {conv.unread_count > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4 sm:w-4 items-center justify-center bg-red-500 text-[9px] font-extrabold text-white rounded-full ring-2 ring-white dark:ring-slate-950 animate-bounce">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h3 className="font-bold text-[10px] sm:text-xs text-slate-850 dark:text-slate-100 truncate">{conv.other_user?.full_name || 'Anonymous User'}</h3>
                                <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                                  {new Date(conv.last_message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                                {conv.last_message.sender_id === user?.id ? 'You: ' : ''}{conv.last_message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Conversation Window */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-x-hidden ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-2.5 sm:p-4 border-b border-slate-200 dark:border-slate-800/85 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/5 z-10">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
                      {/* Back button on mobile */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-850 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-indigo-500/10 flex-shrink-0">
                        {selectedConversation.other_user?.avatar_url && (
                          <AvatarImage src={selectedConversation.other_user.avatar_url} />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-xs sm:text-sm">
                          {selectedConversation.other_user?.full_name?.charAt(0) || <User className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                          {selectedConversation.other_user?.full_name || 'Anonymous User'}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate">Active Discussion</span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                          <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 dark:border-slate-800 shadow-xl">
                        <DropdownMenuItem className="font-semibold text-xs rounded-lg" onClick={() => router.push(`/profile/${selectedConversation.other_user_id}`)}>
                          <User className="mr-2 h-4 w-4 text-slate-400" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="font-semibold text-xs text-red-600 dark:text-red-450 rounded-lg" onClick={handleDeleteConversation}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Thread
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-3 sm:p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/5" ref={scrollAreaRef}>
                    <div className="space-y-3 sm:space-y-4">
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-2.5 max-w-[42%] sm:max-w-[75%] group">
                              {!isMe && (
                                <Avatar className="h-6 w-6 sm:h-7 sm:w-7 mt-0.5 flex-shrink-0">
                                  {selectedConversation.other_user?.avatar_url && (
                                    <AvatarImage src={selectedConversation.other_user.avatar_url} />
                                  )}
                                  <AvatarFallback className="text-[9px] sm:text-[10px] font-bold">{selectedConversation.other_user?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="space-y-1 min-w-0">
                                <div
                                  className={`p-2.5 sm:p-3 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm relative ${
                                    isMe
                                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-none'
                                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 text-slate-850 dark:text-slate-100 rounded-tl-none'
                                  }`}
                                >
                                  {editingMessage?.id === msg.id ? (
                                    <form onSubmit={handleEditMessage} className="space-y-2 min-w-[150px] sm:min-w-[200px]">
                                      <Input
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl text-[10px] sm:text-xs h-8 sm:h-9"
                                        autoFocus
                                      />
                                      <div className="flex gap-1 sm:gap-1.5 justify-end">
                                        <Button type="submit" size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-6 sm:h-7 font-bold rounded-lg text-[9px] sm:text-[10px] px-2 sm:px-2.5">
                                          Save
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" className="h-6 sm:h-7 font-bold rounded-lg text-[9px] sm:text-[10px] px-2 sm:px-2.5" onClick={cancelEditing}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-xs sm:text-sm break-words">{msg.content}</p>
                                      <div className="flex items-center justify-end gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 opacity-75">
                                        <span className="text-[8px] sm:text-[9px] font-bold">
                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                          msg.is_read ? (
                                            <CheckCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
                                          ) : (
                                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                                          )
                                        )}
                                        {msg.edited_at && (
                                          <span className="text-[8px] sm:text-[9px] font-bold italic">(edited)</span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {isMe && editingMessage?.id !== msg.id && (() => {
                                const messageAge = Date.now() - new Date(msg.created_at).getTime()
                                const fiveMinutesInMs = 5 * 60 * 1000
                                const canEditDelete = messageAge < fiveMinutesInMs
                                return canEditDelete ? (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
                                          <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-xl border-slate-200 dark:border-slate-800 shadow-lg">
                                        <DropdownMenuItem className="font-semibold text-xs rounded-lg" onClick={() => startEditing(msg)}>
                                          <Edit2 className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="font-semibold text-xs text-red-600 dark:text-red-450 rounded-lg" onClick={() => handleDeleteMessage(msg.id)}>
                                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                ) : null
                              })()}
                            </div>
                          </div>
                        )
                      })}
                      <div ref={conversationsEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  <div className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
                    <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-2.5 items-center">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Write your reply message..."
                        className="flex-1 h-9 sm:h-11 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold"
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="h-9 sm:h-11 px-3 sm:px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0"
                      >
                        <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/10 dark:bg-slate-900/5">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full blur-2xl opacity-15 animate-pulse" />
                    <MessageSquare className="h-12 w-12 text-indigo-400 relative" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">No conversation selected</h3>
                  <p className="text-xs font-semibold text-slate-400 text-center max-w-xs">Pick an active discussion from the left pane or start a new thread</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
