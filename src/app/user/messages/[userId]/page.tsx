'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Send, ArrowLeft, User, Trash2, Edit2, Check, CheckCheck, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const supabase = createClient()
  const otherUserId = params.userId as string
  const [messages, setMessages] = useState<any[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscription = useRef<any>(null)

  useEffect(() => {
    if (user && otherUserId) {
      fetchMessages()
      fetchOtherUser()
      setupRealtimeSubscription()
    }

    return () => {
      // Cleanup Realtime subscription on unmount
      if (subscription.current) {
        supabase.removeChannel(subscription.current)
      }
    }
  }, [user, otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const renderMessageContent = (content: string) => {
    // Detect URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  const fetchOtherUser = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single()
    setOtherUser(data)
  }

  const fetchMessages = async () => {
    if (!user || !otherUserId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

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
      setMessages(filteredMessages)

      // Mark messages as read
      await markMessagesAsRead()
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    if (!user || !otherUserId) return
    try {
      const { error, data } = await supabase.rpc('mark_messages_as_read', {
        conversation_user_id: otherUserId,
        current_user_id: user.id
      })
      
      if (error) {
        console.error('Error marking messages as read:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
    } catch (error) {
      console.error('Error marking messages as read (catch):', error)
      console.error('Error details (catch):', JSON.stringify(error, null, 2))
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user || !otherUserId) return

    // Clean up existing subscription if any
    if (subscription.current) {
      supabase.removeChannel(subscription.current)
    }

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}&receiver_id=eq.${otherUserId}`
        },
        (payload) => {
          fetchMessages()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUserId}&receiver_id=eq.${user.id}`
        },
        (payload) => {
          fetchMessages()
        }
      )
      .subscribe((status) => {
        // Subscription status change
      })

    subscription.current = channel
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !otherUserId || !newMessage.trim()) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
      // Don't fetchMessages here - Realtime will handle it
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const canEditOrDelete = (message: any) => {
    if (!user || message.sender_id !== user.id) return false
    const messageTime = new Date(message.created_at).getTime()
    const currentTime = new Date().getTime()
    const fiveMinutes = 5 * 60 * 1000
    return (currentTime - messageTime) < fiveMinutes
  }

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', editingMessage)

      if (error) throw error

      setEditingMessage(null)
      setEditContent('')
      // Don't fetchMessages here - Realtime will handle it
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_by_sender: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error
      // Don't fetchMessages here - Realtime will handle it
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const handleDeleteConversation = async () => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this conversation? This will only delete messages for you.')) return
    try {
      // Delete all messages between current user and other user
      const { error } = await supabase
        .from('messages')
        .update({ 
          deleted_by_sender: new Date().toISOString(),
          deleted_by_receiver: new Date().toISOString()
        })
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)

      if (error) throw error
      router.push('/user/messages')
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Failed to delete conversation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/messages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.full_name} />
              <AvatarFallback>
                {otherUser?.full_name?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold">{otherUser?.full_name || 'Unknown'}</h2>
              <p className="text-sm text-muted-foreground">
                {otherUser?.is_verified_seller ? '✓ Verified Seller' : 'User'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/profile/${otherUserId}`}>
                  View Profile
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConversation}>
                Delete Conversation
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = user && message.sender_id === user.id
                  const isEditing = editingMessage === message.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-background text-foreground border"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleEditMessage}>
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingMessage(null)
                                setEditContent('')
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="break-words">{renderMessageContent(message.content)}</p>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-xs ${
                                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}
                                >
                                  {new Date(message.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {message.edited_at && (
                                  <span className="text-xs text-muted-foreground">(edited)</span>
                                )}
                                {isOwn && message.read_at && (
                                  <CheckCheck className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                              {isOwn && canEditOrDelete(message) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => {
                                      setEditingMessage(message.id)
                                      setEditContent(message.content)
                                    }}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
