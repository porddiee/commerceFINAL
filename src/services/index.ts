// Shared API service layer
// This file exports all services for easy importing
// These services are designed to be shared between web and mobile apps

export { authService } from './auth'
export { profilesService } from './profiles'
export { categoriesService } from './categories'
export { listingsService } from './listings'
export { messagesService } from './messages'
export { reviewsService } from './reviews'
export { notificationsService } from './notifications'
export { savedListingsService } from './saved-listings'
export { ordersService } from './orders'
export { searchHistoryService } from './search-history'
export { recentlyViewedService } from './recently-viewed'
export { listingTemplatesService } from './listing-templates'

// Re-export types for convenience
export type * from './auth'
export type * from './profiles'
export type * from './categories'
export type * from './listings'
export type * from './messages'
export type * from './reviews'
export type * from './notifications'
export type * from './saved-listings'
export type * from './orders'
export type * from './search-history'
export type * from './recently-viewed'
export type * from './listing-templates'
