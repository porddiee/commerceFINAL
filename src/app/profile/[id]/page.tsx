'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { MapPin, Calendar, User, Shield, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const params = useParams()
  const { user } = useAuthStore()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchListings()
  }, [params.id])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', params.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const handleMessageUser = () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    window.location.href = `/user/messages?seller=${params.id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button asChild>
            <Link href="/browse">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="text-3xl">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name || 'Unknown'}</h1>
                  {profile.is_verified_seller && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Verified Seller
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
                {!isOwnProfile && (
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleMessageUser}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Listings</CardDescription>
              <CardTitle className="text-3xl">{listings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Member Since</CardDescription>
              <CardTitle className="text-xl">
                {new Date(profile.created_at).getFullYear()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-xl">
                {profile.is_verified_seller ? 'Verified' : 'Standard'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Listings</CardTitle>
            <CardDescription>Items listed by this seller</CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active listings
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listings.map((listing) => (
                  <Link key={`profile-${listing.id}`} href={`/listings/${listing.id}`}>
                    <Card className="hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {listing.images && listing.images.length > 0 && (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{listing.title}</h3>
                            <p className="text-primary font-bold">₱{listing.price.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{listing.location}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
