'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { Star, ArrowLeft, Package, User } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (user && orderId) {
      fetchOrder()
    }
  }, [user, orderId])

  const fetchOrder = async () => {
    if (!user || !orderId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          listings (*),
          seller:profiles!orders_seller_id_fkey (full_name, avatar_url)
        `)
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .single()

      if (error) throw error
      setOrder(data)

      // Check if user has already reviewed this listing
      if (data) {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('listing_id', data.listing_id)
          .eq('reviewer_id', user.id)
          .single()
        
        setExistingReview(reviewData)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Failed to load order')
      router.push('/user/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !order) return

    if (rating === 0) {
      alert('Please provide a rating')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        listing_id: order.listing_id,
        reviewer_id: user.id,
        reviewee_id: order.seller_id,
        rating: rating,
        comment: comment || 'Product review',
      })

      if (error) {
        console.error('Review error:', error)
        throw error
      }

      alert('Review submitted successfully!')
      router.push('/user/orders')
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({ rating, setRating, label }: { rating: number; setRating: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button asChild>
            <Link href="/user/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (existingReview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <Star className="h-16 w-16 text-yellow-400 fill-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Already Reviewed</h2>
            <p className="text-muted-foreground mb-4">
              You have already reviewed this product on {new Date(existingReview.created_at).toLocaleDateString()}.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="font-semibold mb-2">Your Rating: {existingReview.rating}/5</p>
              <p className="text-sm">{existingReview.comment}</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/user/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/user/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Rate & Review</h1>
          <p className="text-muted-foreground">Share your experience with this order</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{order.listings?.title}</h3>
                <p className="text-2xl font-bold text-primary mt-1">
                  ₱{order.total_amount?.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <User className="h-4 w-4" />
                  <span>Seller: {order.seller?.full_name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StarRating
              rating={rating}
              setRating={setRating}
              label="Rate the Product"
            />
            <div className="space-y-2">
              <Label>Comment</Label>
              <textarea
                placeholder="Tell us about the product quality, description accuracy, etc."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/user/orders')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
