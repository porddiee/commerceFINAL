'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth'
import { profilesService, reviewsService } from '@/services'
import { Star, MessageSquare, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function UserReviewsPage() {
  const { user } = useAuthStore()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewer, setReviewer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [touchStart, setTouchStart] = useState(0)

  useEffect(() => {
    if (userId) {
      fetchReviews()
      fetchReviewer()
    }
  }, [userId])

  // Swipe-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY
    const diff = touchEnd - touchStart
    if (diff > 100 && !isRefreshing && window.scrollY === 0) {
      setIsRefreshing(true)
      fetchReviews().finally(() => setIsRefreshing(false))
    }
  }

  const fetchReviewer = async () => {
    try {
      const data = await profilesService.getProfileById(userId)
      setReviewer(data)
    } catch (error) {
      console.error('Error fetching reviewer:', error)
    }
  }

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const data = await reviewsService.getReviewsByReviewerWithDetails(userId)
      setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* Page Header */}
      {loading ? (
        <div className="relative overflow-hidden p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-40 sm:w-56 h-40 sm:h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 border border-white/30 flex-shrink-0 backdrop-blur-sm animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-40 sm:w-56 h-40 sm:h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Reviews</p>
                <h1 className="text-sm sm:text-lg md:text-2xl font-extrabold text-white tracking-tight leading-tight">Reviews by {reviewer?.full_name || 'User'}</h1>
                <p className="text-[10px] sm:text-xs font-semibold text-indigo-200/80 mt-0.5">Reviews written by this user</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsRefreshing(true)
                fetchReviews().finally(() => setIsRefreshing(false))
              }}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-10 w-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg animate-pulse mb-2" />
      ) : (
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/user/reviews">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Link>
        </Button>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 w-4 bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-800 dark:to-yellow-900 rounded animate-pulse" />
                    ))}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-48 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
