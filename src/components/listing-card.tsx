'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShoppingCart, Eye } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { ListingHoverCard } from '@/components/listing-hover-card'

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
  onToggleSave?: () => void
  className?: string
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
}: ListingCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/listings/${id}`}>
        <Card className={`hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden h-full flex flex-col border-2 border-transparent hover:border-primary/20 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${className || ''}`}>
        <CardHeader className="p-2 pb-1">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-1 relative shadow-inner">
            {images && images.length > 0 && !imageError ? (
              <Image
                src={images[0]}
                alt={title}
                fill
                className="object-cover hover:scale-110 transition-transform duration-500"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                No image
              </div>
            )}
            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-1 right-1 backdrop-blur-sm h-6 w-6 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900'}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleSave(id)
                }}
              >
                <ShoppingCart className={`h-3 w-3 ${isSaved ? 'text-white' : ''}`} />
              </Button>
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.2rem] text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{formatPrice(price, currency)}</p>
        </CardHeader>
        <CardContent className="p-2 pt-0 flex-1">
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mb-0.5">
            <span className={`capitalize px-2 py-0.5 rounded-full font-medium ${
              condition === 'new' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              condition === 'like_new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              condition === 'good' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {condition.replace('_', ' ')}
            </span>
            <span className="text-gray-400">•</span>
            <span>{location}</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Eye className="h-1.5 w-1.5 text-blue-500" />
              <span>{views} views</span>
            </div>
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        </CardContent>
        <CardFooter className="p-2 pt-0">
          <div className="flex items-center gap-0.5 w-full">
            <Avatar className="h-4 w-4 ring-2 ring-gradient-to-r from-blue-500 to-purple-500">
              <AvatarImage src={sellerAvatar} alt={sellerName} />
              <AvatarFallback className="text-[7px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">{sellerName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-[9px] text-muted-foreground truncate font-medium">{sellerName}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
    {isHovered && (
      <div className="absolute top-[55%] left-[0%] transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <ListingHoverCard
          title={title}
          price={price}
          currency={currency}
          location={location}
          condition={condition}
          views={views}
          createdAt={createdAt}
          description={description}
        />
      </div>
    )}
  </div>
  )
}
