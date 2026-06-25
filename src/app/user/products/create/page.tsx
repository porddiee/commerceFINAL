'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import {
  ShoppingBag, Upload, X, ArrowLeft, AlertCircle,
  Sparkles, MapPin, Tag, DollarSign, FileText,
  CheckCircle, Loader2, Image as ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const CONDITIONS = [
  { value: 'new',      label: 'Brand New',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { value: 'like_new', label: 'Like New',        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  { value: 'good',     label: 'Good',            cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  { value: 'fair',     label: 'Fair Wear',       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  { value: 'poor',     label: 'Needs Work',      cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
]

const BUY_TYPES = [
  { value: 'meetup',  label: 'Meetup Only',    desc: 'Buyer comes to pick up in person' },
  { value: 'reserve', label: 'Reserve',         desc: 'Buyer reserves; seller confirms' },
  { value: 'buy_now', label: 'Buy Now',         desc: 'Instant purchase available' },
]

export default function CreateProductPage() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition: 'good',
    location: profile?.location || '',
    quantity: 1 as number | string,
    buy_type: 'buy_now',
  })
  const [priceSuggestion, setPriceSuggestion] = useState<{ min: number; avg: number; max: number } | null>(null)

  useEffect(() => {
    fetchCategories()
    const template = localStorage.getItem('listingTemplate')
    if (template) {
      const t = JSON.parse(template)
      setFormData((prev) => ({
        ...prev,
        title: t.title || '',
        description: t.description || '',
        category_id: t.category_id || '',
        condition: t.condition || 'good',
        location: t.location || profile?.location || '',
      }))
      localStorage.removeItem('listingTemplate')
    }
  }, [profile])

  useEffect(() => {
    if (formData.category_id && formData.condition) fetchPriceSuggestion()
  }, [formData.category_id, formData.condition])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
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
        .limit(50)
      if (data && data.length > 0) {
        const prices = data.map((l: any) => l.price)
        setPriceSuggestion({
          min: Math.min(...prices),
          avg: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
          max: Math.max(...prices),
        })
      } else {
        setPriceSuggestion(null)
      }
    } catch (e) { console.error(e) }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (imageFiles.length + files.length > 5) {
      alert('You can only upload up to 5 images')
      return
    }
    const newFiles = [...imageFiles, ...files].slice(0, 5)
    setImageFiles(newFiles)
    // Generate previews
    newFiles.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreviews((prev) => {
          const next = [...prev]
          next[i] = ev.target?.result as string
          return next
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (!user) throw new Error('Not authenticated')
    if (imageFiles.length === 0) return []
    setUploading(true)
    const urls: string[] = []
    try {
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('listing-images').upload(path, file)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
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
      const uploadedUrls = await uploadImages()
      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        location: formData.location,
        images: uploadedUrls,
        status: 'active',
        buy_type: 'buy_now',
        quantity: typeof formData.quantity === 'string' ? (parseInt(formData.quantity) || 1) : formData.quantity,
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/user/products'), 1500)
    } catch (error: any) {
      console.error(error)
      alert(`Failed to create product: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl flex-shrink-0 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
          <Link href="/user/products">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Add New Product</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Publish a new item to the SuriMart marketplace</p>
        </div>
      </div>

      {/* Verification warning */}
      {!profile?.is_verified_seller && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/10">
          <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            Verify your seller account to make listings visible to the public.{' '}
            <Link href="/user/settings" className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200">
              Verify Identity Now →
            </Link>
          </p>
        </div>
      )}

      {/* Success state */}
      {success && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Product published! Redirecting to your listings…
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: Main fields (3 cols) ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Basic Info Card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="e.g. Brand New Mountain Bike"
                    required
                    className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Write detailed specs, size, history, reason for selling…"
                    rows={5}
                    required
                    className="w-full px-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-background text-sm resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground font-medium"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.category_id} onValueChange={(v) => update('category_id', v)} required>
                    <SelectTrigger id="category" className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 font-semibold">
                      <SelectValue placeholder="Select a category…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="font-semibold text-xs">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing & Details Card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                  Pricing & Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Price (PHP) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₱</span>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => update('price', e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                        className="h-11 pl-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <Label htmlFor="quantity" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          update('quantity', '');
                        } else {
                          const num = parseInt(val);
                          update('quantity', isNaN(num) ? '' : num);
                        }
                      }}
                      onBlur={() => {
                        if (formData.quantity === '' || Number(formData.quantity) < 1) {
                          update('quantity', 1);
                        }
                      }}
                      min="1"
                      className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Market price insight */}
                {priceSuggestion && (
                  <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/60 dark:bg-indigo-950/20 px-4 py-3 space-y-1">
                    <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Market Price Intelligence
                    </p>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="text-muted-foreground">Min <span className="text-foreground">₱{priceSuggestion.min.toLocaleString()}</span></span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">Avg ₱{Math.round(priceSuggestion.avg).toLocaleString()}</span>
                      <span className="text-muted-foreground">Max <span className="text-foreground">₱{priceSuggestion.max.toLocaleString()}</span></span>
                    </div>
                  </div>
                )}

                {/* Condition pill picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Condition <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => update('condition', c.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 ${
                          formData.condition === c.value
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="e.g. Surigao City Plaza"
                      required
                      className="h-11 pl-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Images + Submit (2 cols) ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image upload card */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 dark:from-indigo-950/20 dark:to-blue-950/20">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  Photos
                  <span className="text-[10px] text-muted-foreground font-normal ml-auto">
                    {imageFiles.length}/5
                  </span>
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Drop zone */}
                {imageFiles.length < 5 && (
                  <label className="flex flex-col items-center gap-2.5 px-4 py-7 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/10 transition-all cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload photos</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Up to 5 images • JPG, PNG, WebP</p>
                    </div>
                  </label>
                )}

                {/* Image previews grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border/60 group">
                        <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" sizes="120px" />
                        {/* Primary badge */}
                        {i === 0 && (
                          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-md">
                            Main
                          </div>
                        )}
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center">
                  First image will be the main cover. Drag to reorder.
                </p>
              </div>
            </div>

            {/* Tips card */}
            <div className="rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/10 p-5 space-y-3">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Listing Tips
              </p>
              {[
                'Add 3–5 clear photos for more views',
                'Be honest about the condition',
                'Set a fair price using the market data',
                'Include meetup details in description',
              ].map((tip) => (
                <p key={tip} className="text-[11px] text-blue-800/80 dark:text-blue-300/70 flex items-start gap-2 font-medium">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </p>
              ))}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || uploading || success}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all gap-2 disabled:opacity-60"
            >
              {loading || uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{uploading ? 'Uploading photos…' : 'Creating listing…'}</>
              ) : success ? (
                <><CheckCircle className="h-4 w-4" />Published!</>
              ) : (
                <><ShoppingBag className="h-4 w-4" />Publish to Marketplace</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
