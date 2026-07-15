'use client'

import { MobileLayout } from '../navigation/mobile-layout'
import { MobileHeader } from '../navigation/mobile-header'
import { MobileBottomNav } from '../navigation/mobile-bottom-nav'

interface MobileBrowseProps {
  listings?: any[]
}

/**
 * MobileBrowse - Mobile browse page component
 * Placeholder for mobile-specific browse page implementation
 */
export function MobileBrowse({ listings = [] }: MobileBrowseProps) {
  return (
    <MobileLayout>
      <MobileHeader title="Browse" />
      
      <main className="pb-20">
        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search listings..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-2 gap-4">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{listing.title}</h3>
                    <p className="text-indigo-600 font-bold text-sm mt-1">
                      ₱{listing.price?.toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">{listing.location}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-slate-500">
                <p>No listings available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </MobileLayout>
  )
}
