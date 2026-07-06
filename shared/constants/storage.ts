// Supabase Storage folder structure conventions

export const STORAGE_PATHS = {
  // Listing images: listing-images/{listing-id}/image-{index}.jpg
  LISTING_IMAGES: 'listing-images',
  
  // User avatars: avatars/{user-id}/avatar.jpg
  AVATARS: 'avatars',
} as const

export function getListingImagePath(listingId: string, imageIndex: number): string {
  return `${STORAGE_PATHS.LISTING_IMAGES}/${listingId}/image-${imageIndex}.jpg`
}

export function getAvatarPath(userId: string): string {
  return `${STORAGE_PATHS.AVATARS}/${userId}/avatar.jpg`
}
