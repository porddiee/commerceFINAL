'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  ArrowUp, 
  Eye, 
  Grid, 
  List, 
  Search, 
  MapPin, 
  Calendar,
  AlertTriangle,
  X,
  Tag,
  CheckCircle,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function ManageProductsPage() {
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // UX/UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold' | 'draft'>('all')

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
      setSelectedProducts(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = filterList(products)
      setSelectedProducts(new Set(filtered.map(l => l.id)))
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

  const runBulkAction = async (action: string) => {
    if (selectedProducts.size === 0) return

    if (action === 'delete') {
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
    } else if (action === 'activate') {
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
      }
    } else if (action === 'deactivate') {
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
      }
    } else if (action === 'bump') {
      try {
        const now = new Date().toISOString()
        const { error } = await supabase
          .from('listings')
          .update({ created_at: now })
          .in('id', Array.from(selectedProducts))
        if (error) throw error
        setSelectedProducts(new Set())
        fetchProducts()
      } catch (error) {
        console.error('Error bulk bumping products:', error)
      }
    }
  }

  const handleRelist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error re-listing product:', error)
    }
  }

  const handleBump = async (id: string) => {
    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('listings')
        .update({ created_at: now })
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error bumping product:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 font-bold" variant="outline">
            Active
          </Badge>
        )
      case 'sold':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 font-bold" variant="outline">
            Sold
          </Badge>
        )
      case 'draft':
      default:
        return (
          <Badge className="bg-slate-150 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-800 font-bold" variant="outline">
            Draft
          </Badge>
        )
    }
  }

  // --- Calculations for Statistics ---
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'active').length
  const soldProducts = products.filter(p => p.status === 'sold').length
  const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0)

  // --- Filter and Search Logic ---
  const filterList = (list: any[]) => {
    return list.filter(item => {
      const matchesSearch = 
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }

  const filteredProducts = filterList(products)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Inventory</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">Manage Products</h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">Create, update, boost, and review your shop products catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchProducts}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl h-10 px-4 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChild className="bg-white text-indigo-700 hover:bg-white/90 rounded-xl h-10 shadow-md font-bold transition-all">
              <Link href="/user/products/create">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Seller Verification Alert */}
      {!profile?.is_verified_seller && (
        <Card className="border-2 border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-amber-950/20 dark:to-orange-950/10 shadow-lg rounded-2xl overflow-hidden backdrop-blur-sm">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0 border border-amber-200/50 dark:border-amber-800/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-950 dark:text-amber-400">Identity Verification Required</h4>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-450">
                You must verify your seller identity before your products can be visible on the public store.{' '}
                <Link href="/user/settings" className="underline hover:text-amber-900 dark:hover:text-amber-300 font-bold">
                  Submit Verification Documents
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Dashboard Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Products */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">{totalProducts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Public */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Public</p>
              <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">{activeProducts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items Sold</p>
              <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">{soldProducts}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Views</p>
              <h3 className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white">{totalViews.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Filters and Layout Toggles Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/10 p-4 rounded-2xl border border-slate-200 dark:border-slate-850">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="text"
            placeholder="Search products by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 focus-visible:ring-indigo-500 rounded-xl text-xs font-semibold"
          />
        </div>
        
        {/* Filter Badges and Grid/List Toggles */}
        <div className="flex flex-wrap items-center gap-4 justify-between md:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">Filter:</span>
            {(['all', 'active', 'sold', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setSelectedProducts(new Set())
                }}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-full transition-colors border ${
                  statusFilter === status
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center bg-white dark:bg-slate-950 border rounded-lg p-0.5 shadow-sm border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-250'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 dark:bg-slate-855 text-slate-800 dark:text-slate-250'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          <p className="mt-4 text-slate-400 text-xs font-bold">Loading inventory items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border border-dashed border-slate-300 dark:border-slate-800 py-16 rounded-2xl bg-white dark:bg-slate-950/50">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 text-slate-400 border">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm text-center mt-1 font-semibold">
              {searchTerm || statusFilter !== 'all' 
                ? "No products matched your current search or status filter." 
                : "You don't have any products listed in your shop inventory yet."}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button asChild className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-750 hover:to-blue-700 text-white rounded-xl shadow-md px-6 font-bold">
                <Link href="/user/products/create">Create Your First Product</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          
          {/* Header Action Select All (Only if not in List View) */}
          {viewMode === 'grid' && (
            <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/10 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850">
              <Checkbox
                checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all-grid"
              />
              <label htmlFor="select-all-grid" className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                {selectedProducts.size > 0 
                  ? `Selected ${selectedProducts.size} of ${filteredProducts.length} items` 
                  : `Select All visible items (${filteredProducts.length})`}
              </label>
            </div>
          )}

          {/* GRID VIEW LAYOUT */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const image = product.images?.[0] || '/placeholder.svg'
                const isSelected = selectedProducts.has(product.id)

                return (
                  <Card 
                    key={`manage-grid-${product.id}`} 
                    className={`overflow-hidden border transition-all duration-200 hover:shadow-lg bg-white dark:bg-slate-950 rounded-2xl ${
                      isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-sm' : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {/* Image Thumbnail with Overlay checkbox */}
                    <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 overflow-hidden group">
                      <img
                        src={image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      
                      {/* Floating Checkbox */}
                      <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-950/95 p-1.5 rounded-lg shadow-md border border-slate-200/50">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        />
                      </div>

                      {/* Status Overlay Badge */}
                      <div className="absolute top-3 right-3 shadow-md">
                        {getStatusBadge(product.status)}
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                          ₱{product.price.toLocaleString()}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-b pb-3 border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="line-clamp-1 font-semibold">{product.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <div className="flex items-center gap-1 font-semibold">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>{product.views || 0} Views</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(product.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Individual Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8 rounded-xl font-bold border-slate-250 hover:bg-indigo-50/50" asChild>
                          <Link href={`/user/products/${product.id}/edit`}>
                            <Edit className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        
                        {product.status !== 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleRelist(product.id)}
                            className="h-8 w-8 p-0 rounded-xl border-slate-250"
                            title="Re-list Product (Make Active)"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleBump(product.id)}
                          className="h-8 w-8 p-0 rounded-xl border-slate-250"
                          title="Bump to search top"
                        >
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600 animate-bounce" style={{ animationDuration: '4s' }} />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(product.id)}
                          className="h-8 w-8 p-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/20 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            
            /* LIST / TABLE VIEW LAYOUT */
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4">Product details</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Views</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {filteredProducts.map((product) => {
                    const image = product.images?.[0] || '/placeholder.svg'
                    const isSelected = selectedProducts.has(product.id)

                    return (
                      <tr 
                        key={`manage-list-${product.id}`}
                        className={`hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors ${
                          isSelected ? 'bg-indigo-500/5' : ''
                        }`}
                      >
                        {/* Checkbox column */}
                        <td className="p-4 w-12 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          />
                        </td>

                        {/* Product Column */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden border flex-shrink-0 border-slate-200 dark:border-slate-800">
                              <img src={image} alt={product.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="max-w-[200px] sm:max-w-xs md:max-w-sm">
                              <p className="font-bold text-sm text-slate-900 dark:text-white truncate animate-pulse-once" title={product.title}>
                                {product.title}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3" />
                                {product.location}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price Column */}
                        <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                          ₱{product.price.toLocaleString()}
                        </td>

                        {/* Status Column */}
                        <td className="p-4">
                          {getStatusBadge(product.status)}
                        </td>

                        {/* Views Column */}
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-extrabold">
                          {product.views || 0}
                        </td>

                        {/* Created Date Column */}
                        <td className="p-4 text-xs font-semibold text-slate-550">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions Column */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 rounded-lg" asChild>
                              <Link href={`/user/products/${product.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            {product.status !== 'active' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleRelist(product.id)}
                                className="h-8 w-8 text-indigo-600 rounded-lg"
                                title="Re-list Product (Make Active)"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleBump(product.id)}
                              className="h-8 w-8 text-emerald-600 rounded-lg"
                              title="Bump product to top"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FLOATING CONTEXT-AWARE BULK ACTIONS TOOLBAR */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950 dark:bg-slate-950 text-white rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md flex items-center gap-5 border border-slate-800 animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <Layers className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold whitespace-nowrap text-slate-200">
              {selectedProducts.size} item(s) selected
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => runBulkAction('activate')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-350 hover:bg-slate-850 rounded-xl h-8"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Activate
            </Button>
            <Button
              onClick={() => runBulkAction('deactivate')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-amber-400 hover:text-amber-350 hover:bg-slate-850 rounded-xl h-8"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Deactivate
            </Button>
            <Button
              onClick={() => runBulkAction('bump')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-350 hover:bg-slate-850 rounded-xl h-8"
            >
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              Bump
            </Button>
            <Button
              onClick={() => runBulkAction('delete')}
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-rose-400 hover:text-rose-350 hover:bg-slate-850 rounded-xl h-8"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>

          <button 
            onClick={() => setSelectedProducts(new Set())}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Clear Selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
