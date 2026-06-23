import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/client'
import ListingDetailContent from './listing-detail-content'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('title, description, price, currency, images, location')
      .eq('id', params.id)
      .eq('status', 'active')
      .single()

    if (!listing) {
      return {
        title: 'Product Not Found - SuriMart',
        description: 'This product could not be found.',
      }
    }

    const imageUrl = listing.images?.[0] || '/placeholder.svg'
    const price = listing.price.toLocaleString()
    const description = listing.description?.slice(0, 160) || 'No description available.'

    return {
      title: `${listing.title} - ₱${price} - SuriMart`,
      description: description,
      openGraph: {
        title: `${listing.title} - ₱${price}`,
        description: description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: listing.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${listing.title} - ₱${price}`,
        description: description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `/listings/${params.id}`,
      },
    }
  } catch (error) {
    return {
      title: 'Product - SuriMart',
      description: 'View this product on SuriMart marketplace.',
    }
  }
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ListingDetailContent listingId={params.id} />
}

