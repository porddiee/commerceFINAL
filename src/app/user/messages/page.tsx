'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { MessageSquare, User, Send, ArrowLeft, MoreVertical, Trash2, Edit2, CheckCheck } from 'lucide-react'
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
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sellerId = searchParams.get('seller')
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [newMessage, setNewMessage] = useState({
    receiver_id: sellerId || '',
    content: '',
    listing_id: '',
  })
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [messageInput, setMessageInput] = useState('')
  const [editingMessage, setEditingMessage] = useState<any>(null)
  const [editContent, setEditContent] = useState('')
  const conversationsEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchConversations()
      if (sellerId) {
        fetchSellerProfile(sellerId)
        setShowNewMessage(true)
        setNewMessage(prev => ({ ...prev, receiver_id: sellerId }))
      }
    }
  }, [user, sellerId])

  // Auto-select the most recent conversation after fetching
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && !sellerId) {
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
          filter: `or=sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new
          const isRelated = newMessage.sender_id === selectedConversation.other_user_id || newMessage.receiver_id === selectedConversation.other_user_id
          if (isRelated) {
            setMessages((prev) => [...prev, newMessage])
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    setSellerProfile(data)
  }

  const fetchConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter out deleted messages for current user
      const filteredMessages = data?.filter((msg: any) => {
        // If current user is sender, check deleted_by_sender
        if (msg.sender_id === user.id) {
          return !msg.deleted_by_sender
        }
        // If current user is receiver, check deleted_by_receiver
        return !msg.deleted_by_receiver
      }) || []
      
      // Group messages by conversation (unique sender/receiver pairs)
      const groupedConversations = filteredMessages.reduce((acc: any[], msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const existing = acc.find((c: any) => c.other_user_id === otherUserId)
        if (existing) {
          existing.messages.push(msg)
          // Count unread messages (messages sent by other user that are not read)
          if (msg.sender_id !== user.id && !msg.is_read) {
            existing.unread_count = (existing.unread_count || 0) + 1
          }
        } else {
          acc.push({
            other_user_id: otherUserId,
            messages: [msg],
            last_message: msg,
            unread_count: msg.sender_id !== user.id && !msg.is_read ? 1 : 0
          })
        }
        return acc
      }, [])

      // Fetch profiles for all other users
      const conversationsWithProfiles = await Promise.all(
        groupedConversations.map(async (conv: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', conv.other_user_id)
            .single()
          return { ...conv, profile }
        })
      )

      setConversations(conversationsWithProfiles)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark messages as read
      const unreadMessageIds = data?.filter((msg: any) => msg.receiver_id === user.id && !msg.is_read).map((msg: any) => msg.id) || []
      if (unreadMessageIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds)
        fetchConversations() // Refresh to update unread counts
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedConversation || !messageInput.trim()) return

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation.other_user_id,
        content: messageInput,
        listing_id: null,
      })

      if (error) throw error

      setMessageInput('')
      fetchMessages(selectedConversation.other_user_id)
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    try {
      const updateData: any = {}
      if (message.sender_id === user.id) {
        updateData.deleted_by_sender = new Date().toISOString()
      } else {
        updateData.deleted_by_receiver = new Date().toISOString()
      }

      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId)

      if (error) throw error
      fetchMessages(selectedConversation.other_user_id)
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleEditMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingMessage || !editContent.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', editingMessage.id)

      if (error) throw error
      setEditingMessage(null)
      setEditContent('')
      fetchMessages(selectedConversation.other_user_id)
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message')
    }
  }

  const startEditing = (message: any) => {
    setEditingMessage(message)
    setEditContent(message.content)
  }

  const handleDeleteConversation = async () => {
    if (!user || !selectedConversation) return

    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      // Soft delete all messages in this conversation for the current user
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_by_sender: user.id === selectedConversation.other_user_id ? new Date().toISOString() : null,
          deleted_by_receiver: user.id !== selectedConversation.other_user_id ? new Date().toISOString() : null
        })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.other_user_id}),and(sender_id.eq.${selectedConversation.other_user_id},receiver_id.eq.${user.id})`)

      if (error) throw error
      setSelectedConversation(null)
      setMessages([])
      fetchConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Failed to delete conversation')
    }
  }

  const handleNewMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.receiver_id || !newMessage.content.trim()) return

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: newMessage.receiver_id,
        content: newMessage.content,
        listing_id: newMessage.listing_id || null,
      })

      if (error) throw error

      setNewMessage({ receiver_id: '', content: '', listing_id: '' })
      setShowNewMessage(false)
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Messages</h1>
            <p className="text-muted-foreground text-sm">Your conversations</p>
          </div>
          {!showNewMessage && (
            <Button onClick={() => setShowNewMessage(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
              <Send className="mr-2 h-4 w-4" />
              New Message
            </Button>
          )}
        </div>
      </div>

      {showNewMessage ? (
        <div className="flex-1 p-6 flex items-center justify-center">
          <Card className="w-full max-w-2xl backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-transparent hover:border-primary/20 transition-all duration-200 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Send New Message</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowNewMessage(false)} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 active:scale-[0.95]">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewMessageSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiver">To</Label>
                  {sellerProfile ? (
                    <div className="flex items-center gap-2 p-3 border-2 border-purple-200 dark:border-purple-800 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                      <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-blue-500 to-purple-500">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">{sellerProfile.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{sellerProfile.full_name}</span>
                    </div>
                  ) : (
                    <Input
                      id="receiver"
                      value={newMessage.receiver_id}
                      onChange={(e) => setNewMessage({ ...newMessage, receiver_id: e.target.value })}
                      placeholder="User ID"
                      required
                      className="border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message</Label>
                  <textarea
                    id="content"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    placeholder="Write your message..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 border-t-2 border-blue-500"></div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-transparent hover:border-primary/20 transition-all duration-200 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 px-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <MessageSquare className="h-20 w-20 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 relative" />
              </div>
              <p className="text-muted-foreground text-lg mb-6">No messages yet</p>
              <Button onClick={() => setShowNewMessage(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
                <Send className="mr-2 h-4 w-4" />
                Start a conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Conversations list */}
          <div className="w-80 border-r bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2 pointer-events-auto">
                {loading ? (
                  <ConversationSkeleton />
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.other_user_id}
                      onClick={() => {
                        setSelectedConversation(conv)
                        // Clear unread count immediately
                        setConversations(prev => prev.map(c =>
                          c.other_user_id === conv.other_user_id
                            ? { ...c, unread_count: 0 }
                            : c
                        ))
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] pointer-events-auto ${
                        selectedConversation?.other_user_id === conv.other_user_id
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-300 dark:border-blue-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-blue-500 to-purple-500">
                          <AvatarImage src={conv.profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {conv.profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm truncate">{conv.profile?.full_name || 'Unknown'}</h3>
                            {conv.unread_count > 0 && (
                              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg shadow-red-500/30 flex-shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Conversation view */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {selectedConversation ? (
              <>
                {/* Conversation header */}
                <div className="p-4 border-b flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                  <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-blue-500 to-purple-500">
                    <AvatarImage src={selectedConversation.profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {selectedConversation.profile?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                      {selectedConversation.profile?.full_name || 'Unknown'}
                    </h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 active:scale-[0.95]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/profile/${selectedConversation.other_user_id}`)}>
                        <User className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages area */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className="flex items-end gap-2 max-w-[70%]">
                          <div
                            className={`p-3 rounded-2xl ${
                              msg.sender_id === user.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {editingMessage?.id === msg.id ? (
                              <form onSubmit={handleEditMessage} className="space-y-2">
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600">
                                    Save
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <p className="text-sm">{msg.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className={`text-xs ${
                                    msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {msg.sender_id === user.id && msg.is_read && (
                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                  )}
                                  {msg.edited_at && (
                                    <span className="text-xs opacity-70">(edited)</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {msg.sender_id === user.id && editingMessage?.id !== msg.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-200 hover:text-white">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditing(msg)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={conversationsEndRef} />
                  </div>
                </ScrollArea>

                {/* Message input */}
                <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200"
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
