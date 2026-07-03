import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/types'

const supabase = createClient()

export interface CreateMessageData {
  listing_id?: string | null
  sender_id: string
  receiver_id: string
  content: string
}

export interface UpdateMessageData {
  content?: string
  is_read?: boolean
  edited_at?: string
  deleted_by_sender?: boolean
}

export const messagesService = {
  /**
   * Get message by ID
   */
  async getMessageById(id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get messages between two users for a specific listing
   */
  async getConversation(listingId: string, userId: string, otherUserId: string): Promise<Message[]> {
    if (!listingId || !userId || !otherUserId) {
      return []
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get messages between two users (without listing_id filter)
   */
  async getMessagesBetweenUsers(userId: string, otherUserId: string): Promise<Message[]> {
    if (!userId || !otherUserId) {
      return []
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Filter out deleted messages for current user
    const filteredMessages = data?.filter((msg: any) => {
      // If current user is sender, check deleted_by_sender
      if (msg.sender_id === userId) {
        return !msg.deleted_by_sender
      }
      // If current user is receiver, check deleted_by_receiver
      return !msg.deleted_by_receiver
    }) || []
    
    return filteredMessages
  },

  /**
   * Get unread messages for a user
   */
  async getUnreadMessagesForUser(userId: string): Promise<Message[]> {
    if (!userId) {
      return []
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', userId)
      .is('is_read', false)
    
    if (error) throw error
    
    // Filter out deleted messages
    const filteredMessages = data?.filter((msg: any) => !msg.deleted_by_receiver && !msg.deleted_by_sender) || []
    
    return filteredMessages
  },

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    console.log('getConversations called for userId:', userId)
    
    // Get all messages where user is sender or receiver, excluding deleted messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .is('deleted_by_sender', null)
      .order('created_at', { ascending: false })
    
    console.log('Messages fetched:', messages)
    console.log('Messages count:', messages?.length || 0)
    
    if (error) {
      console.error('Error fetching messages for conversations:', error)
      throw error
    }

    // Group by other_user only (not listing_id) to prevent duplicate conversations with same user
    const conversationMap = new Map<string, Conversation>()
    
    for (const message of messages || []) {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
      
      console.log('Processing message:', { listing_id: message.listing_id, otherUserId })
      
      // Use only other_user for grouping to prevent duplicate conversations
      const key = otherUserId
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          listing_id: message.listing_id || null,
          other_user_id: otherUserId,
          other_user: {} as any,
          listing: {} as any,
          last_message: message,
          unread_count: 0,
        })
      } else {
        // Only update last_message if this message is more recent
        const conv = conversationMap.get(key)!
        if (new Date(message.created_at) > new Date(conv.last_message.created_at)) {
          conv.last_message = message
          // Update listing_id to the most recent message's listing
          conv.listing_id = message.listing_id || null
        }
      }
      
      const conv = conversationMap.get(key)!
      if (message.receiver_id === userId && !message.is_read) {
        conv.unread_count++
      }
    }

    console.log('Conversation map created with entries:', conversationMap.size)

    // Fetch profile data for all conversation partners
    const convList = Array.from(conversationMap.values())
    const convListWithProfiles = await Promise.all(
      convList.map(async (conv) => {
        const otherUserId = conv.last_message.sender_id === userId ? conv.last_message.receiver_id : conv.last_message.sender_id
        
        console.log('Fetching profile and listing for conversation:', { listing_id: conv.listing_id, otherUserId })
        
        try {
          console.log('Fetching profile for otherUserId:', otherUserId)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()
          
          let listing = null
          if (conv.listing_id) {
            const { data: listingData, error: listingError } = await supabase
              .from('listings')
              .select('*')
              .eq('id', conv.listing_id)
              .single()
            
            if (listingError) {
              console.error('Error fetching listing:', listingError)
            }
            listing = listingData
          }
          
          if (profileError) {
            console.error('Error fetching profile:', profileError)
          }
          
          console.log('Profile fetched:', profile)
          console.log('Listing fetched:', listing)
          
          return {
            ...conv,
            other_user: profile,
            listing: listing,
          }
        } catch (error) {
          console.error('Error fetching conversation data:', error)
          return {
            ...conv,
            other_user: null,
            listing: null,
          }
        }
      })
    )
    
    console.log('Final conversations list:', convListWithProfiles)
    return convListWithProfiles
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
    return count || 0
  },

  /**
   * Create a new message
   */
  async createMessage(data: CreateMessageData): Promise<Message> {
    console.log('createMessage called with data:', data)
    
    if (!data.sender_id || !data.receiver_id || !data.content) {
      console.error('Missing required fields for message:', data)
      throw new Error('Missing required fields for message')
    }
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ...data,
        is_read: false,
      })
      .select('*')
      .single()
    
    if (error) {
      console.error('Error inserting message:', error)
      throw error
    }
    
    console.log('Message created successfully:', message)
    return message
  },

  /**
   * Update a message
   */
  async updateMessage(id: string, data: UpdateMessageData): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return message
  },

  /**
   * Mark message as read
   */
  async markAsRead(id: string): Promise<Message> {
    return this.updateMessage(id, { is_read: true })
  },

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(listingId: string, userId: string, otherUserId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('listing_id', listingId)
      .eq('receiver_id', userId)
      .eq('sender_id', otherUserId)
    
    if (error) throw error
  },

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Get messages for a listing (all conversations about this listing)
   */
  async getMessagesByListing(listingId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  /**
   * Get messages sent by a user
   */
  async getSentMessages(userId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get messages received by a user
   */
  async getReceivedMessages(userId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
}
