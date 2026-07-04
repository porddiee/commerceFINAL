'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import {
  MapPin, Calendar, Shield, MessageCircle, ArrowLeft,
  ShoppingBag, Package, BadgeCheck, Star, Loader2,
  Clock, Tag, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const CONDITION_LABELS: Record<string, { label: string; cls: string }> = {
  new:      { label: 'New',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  like_new: { label: 'Like New', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  good:     { label: 'Good',     cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  fair:     { label: 'Fair',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
}

function ListingCard({ listing }: { listing: { condition: string; images?: string[]; title: string; price: number; id: string; buy_type?: string; location?: string } }) {
  const cond = CONDITION_LABELS[listing.condition] ?? { label: listing.condition, cls: 'bg-muted text-muted-foreground' }
  const mainImage = listing.images?.[0]

  return (
    <Link href={`/products/${listing.id}`} className="group block">
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 hover:border-border transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Condition badge */}
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${cond.cls}`}>
            {cond.label}
          </span>
        </div>

        {/* Details */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              ₱{listing.price.toLocaleString()}
            </span>
            {listing.buy_type && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                listing.buy_type === 'reserve'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
              }`}>
                {listing.buy_type === 'reserve' ? 'Reserve' : 'Buy Now'}
              </span>
            )}
          </div>
          {listing.location && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {listing.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
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
        .limit(12)
      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const handleMessageUser = () => {
    if (!user) { router.push('/login'); return }
    router.push(`/user/messages?seller=${params.id}`)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading profile…</p>
        </div>
      </div>
    )
  }

  // ── Not Found ──
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="rounded-2xl border border-border bg-card p-10 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">This user doesn't exist or their account has been removed.</p>
          <Button onClick={() => router.back()} variant="outline" className="w-full rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id
  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const joinedYear = new Date(profile.created_at).getFullYear()
  const joinedDate = new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-slate-950/20 pb-16">
      {/* ── Back button (always goes to last page) ── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto max-w-4xl px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-muted-foreground hover:text-foreground font-semibold text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-xs text-muted-foreground font-medium truncate">
            {profile.full_name || 'User Profile'}
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-6 space-y-6">
        {/* ── Hero Card ── */}
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
          {/* Cover gradient */}
          <div className="h-36 bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-8 w-40 h-40 bg-indigo-400 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-2 right-8 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-pulse delay-700" />
            </div>
            {/* Verified ribbon */}
            {profile.is_verified_seller && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-indigo-200" />
                Verified Seller
              </div>
            )}
          </div>

          {/* Avatar + info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {profile.is_verified_seller && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 border-2 border-background flex items-center justify-center shadow-md">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Name row */}
              <div className="flex-1 sm:mb-1 space-y-1.5">
                <h1 className="text-2xl font-black text-foreground leading-tight">
                  {profile.full_name || 'Unknown User'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {profile.location && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    Joined {joinedDate}
                  </span>
                </div>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{profile.bio}</p>
                )}
              </div>

              {/* Action buttons */}
              {!isOwnProfile && (
                <div className="flex gap-2 flex-shrink-0 sm:mb-1">
                  <Button
                    onClick={handleMessageUser}
                    className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              )}
              {isOwnProfile && (
                <div className="flex-shrink-0 sm:mb-1">
                  <Link href="/user/profile">
                    <Button variant="outline" className="gap-2 rounded-xl font-semibold">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: ShoppingBag,
              value: listings.length.toString(),
              label: 'Active Listings',
              color: 'from-indigo-500 to-blue-600',
              bg: 'bg-indigo-50 dark:bg-indigo-950/30',
              text: 'text-indigo-600 dark:text-indigo-400',
            },
            {
              icon: Calendar,
              value: joinedYear.toString(),
              label: 'Member Since',
              color: 'from-violet-500 to-purple-600',
              bg: 'bg-violet-50 dark:bg-violet-950/30',
              text: 'text-violet-600 dark:text-violet-400',
            },
            {
              icon: Shield,
              value: profile.is_verified_seller ? 'Verified' : 'Standard',
              label: 'Seller Status',
              color: profile.is_verified_seller ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500',
              bg: profile.is_verified_seller ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted/40',
              text: profile.is_verified_seller ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            },
          ].map(({ icon: Icon, value, label, color, bg, text }) => (
            <div key={label} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Listings Grid ── */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          {/* Section header */}
          <div className="px-6 py-5 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5 text-indigo-500" />
                {isOwnProfile ? 'My Listings' : `${profile.full_name?.split(' ')[0]}&apos;s Listings`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {listings.length > 0 ? `${listings.length} active item${listings.length !== 1 ? 's' : ''}` : 'No active listings yet'}
              </p>
            </div>
            {listings.length > 0 && (
              <Link href={`/browse?seller=${params.id}`} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="p-6">
            {listings.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 flex items-center justify-center">
                  <Package className="h-8 w-8 text-indigo-400 dark:text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No listings yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isOwnProfile ? 'Start by creating your first listing.' : 'This seller hasn&apos;t posted anything yet.'}
                  </p>
                </div>
                {isOwnProfile && (
                  <Link href="/user/products/create">
                    <Button className="gap-2 rounded-xl">
                      <ShoppingBag className="h-4 w-4" />
                      Create Listing
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Safety notice (only for other users) ── */}
        {!isOwnProfile && (
          <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 px-5 py-4 flex items-start gap-3">
            <Shield className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              <strong>Stay safe.</strong> Always meet in public places, inspect items before paying, and never send money in advance. SuriMart does not process payments directly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
