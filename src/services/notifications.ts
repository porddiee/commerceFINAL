import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationType } from '@/types'

const supabase = createClient()

export interface CreateNotificationData {
  user_id: string
  type: NotificationType
  title: string
  content: string
  link?: string | null
  is_read?: boolean
}

export interface UpdateNotificationData {
  is_read?: boolean
  title?: string
  content?: string
  link?: string | null
}

export const notificationsService = {
  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get all notifications for a user
   */
  async getNotificationsByUser(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Get notifications by type for a user
   */
  async getNotificationsByType(userId: string, type: NotificationType, limit = 20): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        ...data,
        is_read: false,
      })
      .select('*')
      .single()
    
    if (error) throw error
    return notification
  },

  /**
   * Update a notification
   */
  async updateNotification(id: string, data: UpdateNotificationData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return notification
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, { is_read: true })
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
    return count || 0
  },

  /**
   * Create a message notification
   */
  async createMessageNotification(userId: string, senderName: string, listingTitle: string, link: string): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'message',
      title: 'New Message',
      content: `${senderName} sent you a message about "${listingTitle}".`,
      link,
    })
  },

  /**
   * Create a review notification
   */
  async createReviewNotification(userId: string, rating: number, listingTitle: string, link: string): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'review',
      title: 'New Review Received',
      content: `You received a ${rating}-star review for "${listingTitle}".`,
      link,
    })
  },

  /**
   * Create a listing update notification
   */
  async createListingUpdateNotification(userId: string, updateType: string, listingTitle: string, link: string): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'listing_update',
      title: 'Listing Update',
      content: `Your listing "${listingTitle}" has been ${updateType}.`,
      link,
    })
  },

  /**
   * Create a system notification
   */
  async createSystemNotification(userId: string, title: string, content: string, link?: string): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'system',
      title,
      content,
      link,
    })
  },
}
