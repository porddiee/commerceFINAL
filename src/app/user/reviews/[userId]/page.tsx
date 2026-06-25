'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Star, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UserReviewsPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const userId = params.userId as string

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewer, setReviewer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchReviews()
      fetchReviewer()
    }
  }, [userId])

  const fetchReviewer = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single()
      setReviewer(data)
    } catch (error) {
      console.error('Error fetching reviewer:', error)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch reviewee profiles and products separately
      const reviewsWithDetails = await Promise.all(
        (data || []).map(async (review) => {
          const [{ data: reviewee }, { data: listing }] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', review.reviewee_id).single(),
            supabase.from('listings').select('title').eq('id', review.listing_id).single()
          ])
          return { ...review, reviewee, listing }
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
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/user/reviews">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Reviews by {reviewer?.full_name || 'User'}</h1>
        <p className="text-muted-foreground">Reviews written by this user</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
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
                      <h3 className="font-semibold">{review.reviewee?.full_name || 'Seller'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.listing?.title || 'Listing'}
                    </p>
                    <p className="text-sm mt-2">{review.comment}</p>
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
