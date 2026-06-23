'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { ShoppingBag, Plus, Trash2, Edit, CheckSquare2, RefreshCw, ArrowUp } from 'lucide-react'
import Link from 'next/link'

export default function ManageListingsPage() {
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase.from('listings').delete().eq('id', id)
      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(l => l.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedProducts(newSelected)
  }

  const handleBulkAction = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product')
      return
    }

    if (bulkAction === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) return
      try {
        const { error } = await supabase
          .from('listings')
          .delete()
          .in('id', Array.from(selectedProducts))
        if (error) throw error
        setSelectedProducts(new Set())
        fetchProducts()
      } catch (error: any) {
        console.error('Error bulk deleting products:', error?.message || error)
        alert(`Failed to delete products: ${error?.message || 'Unknown error'}`)
      }
    } else if (bulkAction === 'activate') {
      try {
        const { error } = await supabase
          .from('listings')
          .update({ status: 'active' })
          .in('id', Array.from(selectedProducts))
        if (error) throw error
        setSelectedProducts(new Set())
        fetchProducts()
      } catch (error) {
        console.error('Error bulk activating products:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
    } else if (bulkAction === 'deactivate') {
      try {
        const { error } = await supabase
          .from('listings')
          .update({ status: 'draft' })
          .in('id', Array.from(selectedProducts))
        if (error) throw error
        setSelectedProducts(new Set())
        fetchProducts()
      } catch (error) {
        console.error('Error bulk deactivating products:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
    } else if (bulkAction === 'bump') {
      try {
        const { error } = await supabase
          .from('listings')
          .update({ 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', Array.from(selectedProducts))
        if (error) throw error
        setSelectedProducts(new Set())
        fetchProducts()
      } catch (error) {
        console.error('Error bumping products:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
    }
    setBulkAction('')
  }

  const handleRelist = async (id: string) => {
    if (!confirm('Are you sure you want to re-list this item? This will make it active again.')) return
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error re-listing listing:', error)
    }
  }

  const handleBump = async (id: string) => {
    if (!confirm('Are you sure you want to bump this listing? This will move it to the top of search results.')) return
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error bumping listing:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                  <SelectItem value="bump">Bump to Top</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkAction} disabled={!bulkAction}>
                Apply ({selectedProducts.size})
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/user/listings/create">
              <Plus className="mr-2 h-4 w-4" />
              Sell Product
            </Link>
          </Button>
        </div>
      </div>

      {!profile?.is_verified_seller && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <p className="text-yellow-800 dark:text-yellow-400">
              You need to verify your account to create products.{' '}
              <Link href="/user/settings" className="underline">
                Verify now
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Button asChild>
              <Link href="/user/listings/create">Create Your First Product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Selection Bar */}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Checkbox
                checked={selectedProducts.size === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedProducts.size > 0 
                  ? `${selectedProducts.size} of ${products.length} selected` 
                  : 'Select all'}
              </span>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={`manage-${product.id}`} className={selectedProducts.has(product.id) ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2 flex-1">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{product.title}</CardTitle>
                        <CardDescription>₱{product.price.toLocaleString()}</CardDescription>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-square w-full bg-muted rounded-md overflow-hidden mb-2">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{product.location}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.views} views • {new Date(product.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" asChild>
                        <Link href={`/user/listings/${product.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      {product.status !== 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRelist(product.id)}
                          title="Re-list this item"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleBump(product.id)}
                        title="Bump to top"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
