'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { ShoppingBag, Heart, MessageSquare, Bell, TrendingUp, Eye } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      const [
        { count: listingsCount },
        { data: listings },
      ] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id),
        supabase
          .from('listings')
          .select('views')
          .eq('seller_id', user.id),
      ])

      const totalViews = listings?.reduce((sum, listing) => sum + (listing.views || 0), 0) || 0

      setStats({
        totalListings: listingsCount || 0,
        totalViews,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account</p>
      </div>

      {!profile?.is_verified_seller && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-400">Verify Your Account</CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              To start selling on SuriMart, you need to verify your identity with a valid ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/user/settings">Request Seller Verification</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Views across all products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/user/listings/create">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Create New Product
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/user/saved">
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Cart Items
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
