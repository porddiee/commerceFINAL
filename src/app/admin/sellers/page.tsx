'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Search, Shield, ShoppingBag, CheckCircle } from 'lucide-react'

export default function AdminSellersPage() {
  const supabase = createClient()
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSellers()
  }, [])

  const fetchSellers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSellers(data || [])
    } catch (error) {
      console.error('Error fetching sellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (sellerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified_seller: !currentStatus })
        .eq('id', sellerId)

      if (error) throw error
      fetchSellers()
    } catch (error) {
      console.error('Error updating verification status:', error)
    }
  }

  const filteredSellers = sellers.filter((seller) =>
    seller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Sellers</h1>
        <p className="text-muted-foreground">View and manage platform sellers</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sellers</CardTitle>
              <CardDescription>Total: {filteredSellers.length} sellers</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sellers found</div>
          ) : (
            <div className="space-y-4">
              {filteredSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{seller.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{seller.location || 'No location'}</p>
                      {seller.is_verified_seller && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified Seller
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVerification(seller.id, seller.is_verified_seller)}
                  >
                    {seller.is_verified_seller ? 'Unverify' : 'Verify'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
