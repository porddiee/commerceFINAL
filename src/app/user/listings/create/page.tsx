'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { ShoppingBag, Upload, X } from 'lucide-react'

export default function CreateListingPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'good',
    location: profile?.location || '',
    quantity: 1,
  })
  const [priceSuggestion, setPriceSuggestion] = useState<{ min: number; avg: number; max: number } | null>(null)

  useEffect(() => {
    fetchCategories()
    // Check if there's a template in localStorage
    const template = localStorage.getItem('listingTemplate')
    if (template) {
      const templateData = JSON.parse(template)
      setFormData({
        title: templateData.title || '',
        description: templateData.description || '',
        category_id: templateData.category_id || '',
        condition: templateData.condition || 'good',
        location: templateData.location || profile?.location || '',
        price: '',
      })
      // Clear the template from localStorage
      localStorage.removeItem('listingTemplate')
    }
  }, [])

  useEffect(() => {
    if (formData.category_id && formData.condition) {
      fetchPriceSuggestion()
    }
  }, [formData.category_id, formData.condition])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchPriceSuggestion = async () => {
    if (!formData.category_id || !formData.condition) return

    try {
      const { data } = await supabase
        .from('listings')
        .select('price')
        .eq('category_id', formData.category_id)
        .eq('condition', formData.condition)
        .eq('status', 'active')
        .order('price', { ascending: true })
        .limit(50)

      if (data && data.length > 0) {
        const prices = data.map((l: any) => l.price)
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length
        setPriceSuggestion({ min, avg, max })
      } else {
        setPriceSuggestion(null)
      }
    } catch (error) {
      console.error('Error fetching price suggestion:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 5) {
      alert('You can only upload up to 5 images')
      return
    }
    setImageFiles(files)
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return []

    setUploading(true)
    const urls: string[] = []

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath)

        urls.push(publicUrl)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    } finally {
      setUploading(false)
    }

    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages()

      const { data, error } = await supabase.from('listings').insert({
        seller_id: user.id,
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        location: formData.location,
        images: uploadedImageUrls,
        status: 'active',
        buy_type: formData.buy_type,
        quantity: formData.quantity,
      }).select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      router.push('/user/listings')
    } catch (error: any) {
      console.error('Error creating listing:', error)
      alert(`Failed to create listing: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sell Product</h1>
        <p className="text-muted-foreground">List an item for sale</p>
      </div>

      {!profile?.is_verified_seller && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <p className="text-yellow-800 dark:text-yellow-400">
              You need to verify your account to create listings.{' '}
              <a href="/user/settings" className="underline">
                Verify now
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Product Details
          </CardTitle>
          <CardDescription>Fill in the details for your product</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="iPhone 15 Pro Max - Excellent Condition"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item in detail..."
                className="w-full min-h-[120px] px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (PHP)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="85000"
                  required
                />
                {priceSuggestion && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-1">
                    <p>💡 Price suggestions for this category & condition:</p>
                    <p>Range: ₱{priceSuggestion.min.toLocaleString()} - ₱{priceSuggestion.max.toLocaleString()}</p>
                    <p>Average: ₱{Math.round(priceSuggestion.avg).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Surigao City"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="cursor-pointer"
                  onChange={handleImageChange}
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFiles(imageFiles.filter((_, i) => i !== index))
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload up to 5 images (JPG, PNG, WEBP)
              </p>
            </div>
            <Button type="submit" disabled={loading || uploading} className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full">
              {loading ? 'Creating...' : uploading ? 'Uploading images...' : 'Sell Product'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
