'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, Star, Package, ShoppingCart, MapPin, Calendar, ShoppingBag } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/utils'

interface ListingCardProps {
  id: string
  title: string
  price: number
  currency?: string
  location: string
  images: string[]
  sellerName: string
  sellerAvatar?: string
  condition: string
  views?: number
  createdAt: string
  description?: string
  isSaved?: boolean
  onToggleSave?: (id: string) => void
  className?: string
  quantity?: number
  avgRating?: number
  reviewCount?: number
  purchaseCount?: number
}

export default function ListingCard({
  id,
  title,
  price,
  currency = 'PHP',
  location,
  images,
  sellerName,
  sellerAvatar,
  condition,
  views = 0,
  createdAt,
  description,
  isSaved = false,
  onToggleSave,
  className,
  quantity = 1,
  avgRating = 0,
  reviewCount = 0,
  purchaseCount = 0,
}: ListingCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative group h-full">
      <Link href={`/products/${id}`} className="block h-full">
        <Card className={`hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-2xl bg-white dark:bg-slate-950 ${className || ''}`}>
          
          {/* Card Header (Image Container) */}
          <CardHeader className="p-3 pb-0 relative">
            <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
              {images && images.length > 0 && !imageError ? (
                <Image
                  src={images[0]}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs bg-slate-50 dark:bg-slate-900">
                  <ShoppingBag className="h-6 w-6 mb-1 text-slate-300 dark:text-slate-700" />
                  No image available
                </div>
              )}

              {/* Sliding Description Overlay (reveals on hover directly above product title) */}
              {description && (
                <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 text-white p-3 text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm flex flex-col justify-center pointer-events-none select-none z-10 h-[70%]">
                  <p className="line-clamp-4 leading-relaxed text-slate-200 font-medium">
                    {description}
                  </p>
                </div>
              )}

              {/* Floating Condition Badge */}
              <div className="absolute top-2 left-2 z-10">
                <span className={`capitalize px-2.5 py-1 rounded-lg font-bold text-[9px] tracking-wider shadow-sm border backdrop-blur-md bg-white/90 dark:bg-slate-950/90 ${
                  condition === 'new' ? 'text-emerald-600 border-emerald-200/50 dark:text-emerald-400 dark:border-emerald-950/50' :
                  condition === 'like_new' ? 'text-blue-600 border-blue-200/50 dark:text-blue-400 dark:border-blue-950/50' :
                  condition === 'good' ? 'text-violet-600 border-violet-200/50 dark:text-violet-400 dark:border-violet-950/50' :
                  'text-amber-600 border-amber-200/50 dark:text-amber-400 dark:border-amber-950/50'
                }`}>
                  {condition.replace('_', ' ')}
                </span>
              </div>

              {/* Floating Add to Cart Button */}
              {onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 backdrop-blur-md h-8 w-8 rounded-full shadow-md hover:scale-110 transition-all duration-200 border border-slate-200/30 z-10 ${
                    isSaved 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' 
                      : 'bg-white/95 dark:bg-slate-950/95 hover:bg-white dark:hover:bg-slate-900 text-slate-600 hover:text-indigo-600'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleSave(id)
                  }}
                  title={isSaved ? "Remove from Cart" : "Add to Cart"}
                >
                  <ShoppingCart className={`h-4 w-4 ${isSaved ? 'text-white fill-white' : ''}`} />
                </Button>
              )}
            </div>

            {/* Product Title */}
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 min-h-[2.5rem] text-slate-800 dark:text-slate-100 leading-snug mt-3">
              {title}
            </h3>
            
            {/* Product Price */}
            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatPrice(price, currency)}
            </p>
          </CardHeader>

          {/* Card Content (Product Metadata) */}
          <CardContent className="p-3 pt-2 flex-1 space-y-2 border-t border-slate-100 dark:border-slate-900 mt-2">
            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{location}</span>
            </div>

            {/* Availability & Rating */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-indigo-500/80" />
                <span className="font-medium text-[11px]">{quantity} available</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400">({reviewCount})</span>
              </div>
            </div>

            {/* Views, Sold Count, Time Ago */}
            <div className="flex items-center justify-between text-[11px] text-slate-450 dark:text-slate-400 pt-1.5 border-t border-dashed border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-500/70" />
                <span>{views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700 dark:text-slate-350">{purchaseCount}</span>
                <span>sold</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>{formatRelativeTime(createdAt)}</span>
              </div>
            </div>
          </CardContent>

          {/* Card Footer (Seller Info) */}
          <CardFooter className="p-3 pt-0 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/10">
            <div className="flex items-center gap-2 w-full mt-2.5">
              <Avatar className="h-6 w-6 ring-2 ring-indigo-500/10">
                <AvatarImage src={sellerAvatar} alt={sellerName} />
                <AvatarFallback className="text-[9px] bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold">
                  {sellerName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-semibold">
                {sellerName}
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
}
