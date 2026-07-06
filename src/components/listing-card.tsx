'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Eye, Star, ShoppingCart, ShoppingBag } from 'lucide-react'
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
        <Card className={`hover:shadow-xl hover:shadow-indigo-500/20 hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col border-2 border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-indigo-950 dark:via-slate-900 dark:to-blue-950 ${className || ''}`}>
          
          {/* Card Header (Image Container) */}
          <CardHeader className="p-2 sm:p-3 pb-0 relative">
            <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-lg sm:rounded-xl overflow-hidden relative shadow-inner">
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
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] sm:text-xs bg-slate-50 dark:bg-slate-900">
                  <ShoppingBag className="h-4 w-4 sm:h-6 sm:w-6 mb-1 text-slate-300 dark:text-slate-700" />
                  No image
                </div>
              )}

              {/* Sliding Description Overlay (reveals on hover directly above product title) — Hidden on mobile */}
              {description && (
                <div className="hidden sm:flex absolute inset-x-0 bottom-0 bg-slate-950/90 text-white p-3 text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm flex-col justify-center pointer-events-none select-none z-10 h-[70%]">
                  <p className="line-clamp-4 leading-relaxed text-slate-200 font-medium">
                    {description}
                  </p>
                </div>
              )}

              {/* Floating Condition Badge */}
              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                <span className={`capitalize px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded sm:rounded-lg font-bold text-[8px] sm:text-[9px] tracking-wider shadow-sm border backdrop-blur-md bg-white/90 dark:bg-slate-950/90 ${
                  condition === 'new' ? 'text-emerald-600 border-emerald-200/50 dark:text-emerald-400 dark:border-emerald-950/50' :
                  condition === 'like_new' ? 'text-blue-600 border-blue-200/50 dark:text-blue-400 dark:border-blue-950/50' :
                  condition === 'good' ? 'text-violet-600 border-violet-200/50 dark:text-violet-400 dark:border-violet-950/50' :
                  'text-amber-600 border-amber-200/50 dark:text-amber-400 dark:border-amber-950/50'
                }`}>
                  {condition.replace('_', ' ')}
                </span>
              </div>

              {/* Sold Out Badge */}
              {quantity === 0 && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg border-2 border-red-500">
                    SOLD OUT
                  </div>
                </div>
              )}

              {/* Floating Add to Cart Button */}
              {onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 backdrop-blur-md h-6 w-6 sm:h-8 sm:w-8 rounded-full shadow-md hover:scale-110 transition-all duration-200 border border-slate-200/30 z-10 ${
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
                  <ShoppingCart className={`h-3 w-3 sm:h-4 sm:w-4 ${isSaved ? 'text-white fill-white' : ''}`} />
                </Button>
              )}
            </div>

            {/* Product Title */}
            <h3 className="font-bold text-xs sm:text-sm md:text-base line-clamp-2 min-h-[1.75rem] sm:min-h-[2.5rem] text-slate-800 dark:text-slate-100 leading-snug mt-1.5 sm:mt-3">
              {title}
            </h3>
            
            {/* Product Price */}
            <p className="text-sm sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatPrice(price, currency)}
            </p>
          </CardHeader>

          {/* Card Content (Product Metadata) */}
          <CardContent className="p-2 pt-1.5 sm:p-3 sm:pt-2 flex-1 space-y-1 sm:space-y-1.5 border-t border-indigo-100 dark:border-indigo-800/50 mt-1 sm:mt-2 bg-gradient-to-b from-indigo-50/40 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/40">
            {/* Views and Ratings Row */}
            <div className="flex items-center justify-between text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500/70" />
                <span>{views} views</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-[8px] sm:text-[10px] text-slate-400">({reviewCount})</span>
              </div>
            </div>

            {/* Sold Count */}
            <div className="flex items-center gap-1 text-[9px] sm:text-xs text-slate-500 dark:text-slate-400">
              <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-500/80" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{purchaseCount} sold</span>
            </div>
          </CardContent>

          {/* Card Footer (Seller Info) */}
          <CardFooter className="p-2 pt-0 sm:p-3 sm:pt-0 border-t border-indigo-100 dark:border-indigo-800/50 bg-indigo-100/60 dark:bg-indigo-900/50">
            <div className="flex items-center gap-1 sm:gap-2 w-full mt-1.5 sm:mt-2.5">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ring-2 ring-indigo-500/10">
                <AvatarImage src={sellerAvatar} alt={sellerName} />
                <AvatarFallback className="text-[7px] sm:text-[9px] bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold">
                  {sellerName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate font-semibold">
                {sellerName}
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
}
