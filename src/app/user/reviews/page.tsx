'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Star, MessageSquare, TrendingUp, Award, Send, X, ChevronDown, ChevronUp, FileText } from 'lucide-react'

type Review = {
  id: string
  rating: number
  comment: string
  reply?: string
  replied_at?: string
  created_at: string
  reviewer_id: string
  reviewee_id: string
  listing_id: string
  reviewer?: { id: string; full_name: string } | null
  listing?: { title: string } | null
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} transition-colors ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div
      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center flex-shrink-0 shadow-sm`}
    >
      <span className="text-white text-sm font-semibold">{initials}</span>
    </div>
  )
}

function RatingBar({ count, total, rating }: { count: number; total: number; rating: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-muted-foreground w-4 text-right">{rating}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-4">{count}</span>
    </div>
  )
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3.5 w-3.5 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'given'>('all')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) fetchReviews()
  }, [user])

  const handleReply = async (reviewId: string) => {
    if (!user || !replyText.trim()) return
    try {
      const { error } = await supabase.rpc('add_review_reply', {
        review_id: reviewId,
        reply_text: replyText.trim(),
      })
      if (error) throw error
      
      // Get review details to create notification
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('reviewer_id, listing_id, listings!inner(title)')
        .eq('id', reviewId)
        .single()
      
      if (reviewData) {
        // Create notification for the reviewer
        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: reviewData.reviewer_id,
          title: 'Seller Replied to Your Review',
          content: `The seller replied to your review for "${reviewData.listings.title}".`,
          link: '/user/reviews',
          is_read: false,
        })
        
        if (notificationError) {
          console.error('Notification error:', notificationError)
        }
      }
      
      setReplyText('')
      setReplyingTo(null)
      fetchReviews()
    } catch (error) {
      console.error('Error replying to review:', error)
      alert('Failed to reply to review')
    }
  }

  const fetchReviews = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      if (error) throw error

      const reviewsWithDetails = await Promise.all(
        (data || []).map(async (review) => {
          const [{ data: reviewer }, { data: listing }] = await Promise.all([
            supabase.from('profiles').select('id, full_name').eq('id', review.reviewer_id).single(),
            supabase.from('listings').select('title').eq('id', review.listing_id).single(),
          ])
          return { ...review, reviewer, listing }
        })
      )
      setReviews(reviewsWithDetails)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReplyExpand = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = reviews.filter((r) => {
    if (activeTab === 'received') return r.reviewee_id === user?.id
    if (activeTab === 'given') return r.reviewer_id === user?.id
    return true
  })

  const received = reviews.filter((r) => r.reviewee_id === user?.id)
  const avgRating =
    received.length > 0
      ? (received.reduce((s, r) => s + r.rating, 0) / received.length).toFixed(1)
      : '—'

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: received.filter((r) => r.rating === star).length,
  }))

  const tabs = [
    { id: 'all' as const, label: 'All Reviews', count: reviews.length },
    { id: 'received' as const, label: 'Received', count: received.length },
    { id: 'given' as const, label: 'Given', count: reviews.filter((r) => r.reviewer_id === user?.id).length },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden p-4 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-40 sm:w-56 h-40 sm:h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Reputation</p>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight">Reviews</h1>
            <p className="text-[10px] sm:text-xs font-semibold text-indigo-200/80 mt-0.5">Manage your reputation and respond to feedback</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          {/* Average Rating */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <Star className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 leading-none">{avgRating}</p>
              <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
            </div>
          </div>

          {/* Total Reviews */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">{received.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews Received</p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Breakdown</p>
            </div>
            {ratingCounts.map(({ star, count }) => (
              <RatingBar key={star} rating={star} count={count} total={received.length} />
            ))}
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-fit animate-fade-in">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-md font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-20 flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'received'
                ? 'No one has reviewed you yet'
                : activeTab === 'given'
                ? "You haven't reviewed anyone yet"
                : 'Reviews will appear here'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {filtered.map((review, index) => {
            const isOwn = review.reviewer_id === user?.id
            const canReply = user && review.reviewee_id === user.id && !review.reply
            const reviewerName = review.reviewer?.full_name || 'Anonymous'
            const isReplyExpanded = expandedReplies.has(review.id)

            return (
              <div
                key={review.id}
                className="group rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all duration-200 p-5 space-y-4"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Top: Avatar + Meta */}
                <div className="flex items-start gap-3">
                  <AvatarInitials name={reviewerName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm leading-tight">{reviewerName}</span>
                          {isOwn && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              <Award className="h-3 w-3" />
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                          {review.listing?.title || 'Listing'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-foreground/80 leading-relaxed pl-14">{review.comment}</p>

                {/* Seller Reply */}
                {review.reply && (
                  <div className="pl-14">
                    <button
                      onClick={() => toggleReplyExpand(review.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                      {isReplyExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Seller's Reply
                      <span className="text-muted-foreground/60">·</span>
                      <span>{new Date(review.replied_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </button>
                    {isReplyExpanded && (
                      <div className="rounded-xl bg-muted/60 border border-border/40 p-3.5 text-sm text-foreground/80 leading-relaxed">
                        {review.reply}
                      </div>
                    )}
                  </div>
                )}

                {/* Reply Form */}
                {canReply && (
                  <div className="pl-14">
                    {replyingTo === review.id ? (
                      <div className="space-y-2 animate-fade-in">
                        <textarea
                          placeholder="Write a thoughtful reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5 rounded-lg"
                            onClick={() => handleReply(review.id)}
                            disabled={!replyText.trim()}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Submit Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 rounded-lg text-muted-foreground"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg px-3 py-1.5 transition-all hover:bg-muted/50"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reply to review
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
