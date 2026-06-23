'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, MapPin, Clock, Package } from 'lucide-react'
import { formatPrice, formatRelativeTime } from '@/lib/utils'

interface ListingHoverCardProps {
  title: string
  price: number
  currency?: string
  location: string
  condition: string
  views?: number
  createdAt: string
  description?: string
}

export function ListingHoverCard({
  title,
  price,
  currency = 'PHP',
  location,
  condition,
  views,
  createdAt,
  description,
}: ListingHoverCardProps) {
  return (
    <Card className="absolute z-50 w-72 p-4 shadow-2xl backdrop-blur-md bg-white/95 dark:bg-gray-800/95 border-2 border-gray-200 dark:border-gray-700 rounded-xl animate-fade-in pointer-events-none">
      <CardContent className="p-0">
        <h4 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{title}</h4>
        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-3">
          {formatPrice(price, currency)}
        </p>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
        )}
        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-purple-500" />
            <span className="capitalize">{condition}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-purple-500" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-purple-500" />
            <span>{views || 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-purple-500" />
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
