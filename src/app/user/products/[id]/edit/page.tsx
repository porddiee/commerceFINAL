'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store/auth'
import { toast } from '@/hooks/use-toast'
import { ShoppingBag, Upload, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { categoriesService, listingsService } from '@/services'
import type { Condition } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'good',
    location: '',
    buy_type: 'buy_now',
    quantity: 1 as number | string,
  })

  useEffect(() => {
    fetchCategories()
    fetchListing()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchListing = async () => {
    try {
      const data = await listingsService.getListingById(params.id as string)
      if (data) {
        const listingData = data as any
        setFormData({
          title: listingData.title || '',
          description: listingData.description || '',
          price: listingData.price?.toString() || '',
          category_id: listingData.category_id || '',
          condition: listingData.condition || 'good',
          location: listingData.location || '',
          buy_type: listingData.buy_type || 'buy_now',
          quantity: listingData.quantity || 1,
        })
        setExistingImages(listingData.images || [])
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 5) {
      toast({ title: 'Error', description: 'You can only upload up to 5 images', variant: 'destructive' })
      return
    }
    setImageFiles(files)
  }

  const uploadImages = async () => {
    if (!user) throw new Error('User not authenticated')
    if (imageFiles.length === 0) return existingImages

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

  const handleDeleteImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Upload new images
      const uploadedImageUrls = await uploadImages()
      const allImages = [...existingImages, ...uploadedImageUrls]

      const newQuantity = typeof formData.quantity === 'string' ? (parseInt(formData.quantity) || 1) : formData.quantity

      // Automatically re-activate product when restocking from 0 to > 0
      const updateData: any = {
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition as Condition,
        location: formData.location,
        buy_type: formData.buy_type,
        quantity: newQuantity,
        images: allImages,
      }
      if (newQuantity > 0) {
        updateData.status = 'active'
      }

      await listingsService.updateListing(params.id as string, updateData)
      
      router.push('/user/products')
    } catch (error: unknown) {
      console.error('Error updating product:', error)
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Unknown error'
      toast({ title: 'Error', description: `Failed to update product: ${errorMessage}`, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/user/products">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Edit Product</h1>
          <p className="text-xs font-semibold text-slate-500">Update your product listing details</p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <ShoppingBag className="w-5 h-5 text-indigo-500" />
            Product Specification Details
          </CardTitle>
          <CardDescription className="text-xs font-semibold text-slate-500">Modify and save catalog details</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Core Text Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="iPhone 15 Pro Max"
                    required
                    className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    required
                  >
                    <SelectTrigger id="category" className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="font-semibold text-xs rounded-lg">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price (PHP)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="85000"
                      required
                      className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger id="condition" className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="new" className="font-semibold text-xs rounded-lg">New</SelectItem>
                        <SelectItem value="like_new" className="font-semibold text-xs rounded-lg">Like New</SelectItem>
                        <SelectItem value="good" className="font-semibold text-xs rounded-lg">Good</SelectItem>
                        <SelectItem value="fair" className="font-semibold text-xs rounded-lg">Fair</SelectItem>
                        <SelectItem value="poor" className="font-semibold text-xs rounded-lg">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Surigao City"
                      required
                      className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData({ ...formData, quantity: '' });
                        } else {
                          const num = parseInt(val);
                          setFormData({ ...formData, quantity: isNaN(num) ? '' : num });
                        }
                      }}
                      onBlur={() => {
                        if (formData.quantity === '' || Number(formData.quantity) < 1) {
                          setFormData({ ...formData, quantity: 1 });
                        }
                      }}
                      min="1"
                      className="h-11 border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Descriptions & Photos */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your item in detail..."
                    rows={5}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none font-semibold text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catalog Photos</Label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-4 text-center hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto h-6 w-6 text-slate-400 group-hover:scale-110 transition-transform" />
                    <p className="mt-1 text-xs font-bold text-slate-850 dark:text-slate-255">Upload new catalog photos</p>
                  </div>

                  {/* Existing Photos */}
                  {existingImages.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {existingImages.map((url, index) => (
                          <div key={`existing-${index}`} className="relative h-14 w-14 border rounded-xl overflow-hidden shadow-sm">
                            <img src={url} alt={`Catalog image ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:scale-105"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Upload Photos */}
                  {imageFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Uploading Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {imageFiles.map((file, index) => (
                          <div key={`new-${index}`} className="relative h-14 w-14 border rounded-xl overflow-hidden shadow-sm">
                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:scale-105"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading || uploading} className="w-full h-11 bg-gradient-to-r from-indigo-650 to-blue-600 hover:from-indigo-750 hover:to-blue-700 text-white font-extrabold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
              {loading ? 'Updating...' : uploading ? 'Uploading photos...' : 'Update Product Listing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
