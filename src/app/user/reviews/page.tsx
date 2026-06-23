'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Star, MessageSquare } from 'lucide-react'
import { ReviewsListSkeleton } from '@/components/skeletons/review-skeleton'

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const supabase = createClient()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (user) {
      fetchReviews()
    }
  }, [user])

  const handleReply = async (reviewId: string) => {
    if (!user || !replyText.trim()) return
    try {
      const { error } = await supabase
        .rpc('add_review_reply', {
          review_id: reviewId,
          reply_text: replyText.trim()
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
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

      // Fetch reviewer profiles and listings separately
      const reviewsWithDetails = await Promise.all(
        (data || []).map(async (review) => {
          const [{ data: reviewer }, { data: listing }] = await Promise.all([
            supabase.from('profiles').select('id, full_name').eq('id', review.reviewer_id).single(),
            supabase.from('listings').select('title').eq('id', review.listing_id).single()
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">Your reviews and reviews about you</p>
      </div>

      {loading ? (
        <ReviewsListSkeleton />
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{review.reviewer?.full_name || 'Anonymous'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.listing?.title || 'Listing'}
                    </p>
                    <p className="text-sm mt-2">{review.comment}</p>
                    {review.reply && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Seller's Reply:</p>
                        <p className="text-sm">{review.reply}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.replied_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {user && review.reviewee_id === user.id && !review.reply && (
                      <div className="mt-3">
                        {replyingTo === review.id ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Write your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReply(review.id)}>
                                Submit Reply
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setReplyingTo(review.id)}>
                            Reply
                          </Button>
                        )}
                      </div>
                    )}
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
