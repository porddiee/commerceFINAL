'use client'

import { MobileLayout } from '../navigation/mobile-layout'
import { MobileHeader } from '../navigation/mobile-header'
import { MobileBottomNav } from '../navigation/mobile-bottom-nav'

interface MobileHomeProps {
  products?: any[]
}

/**
 * MobileHome - Mobile home page component
 * Placeholder for mobile-specific home page implementation
 */
export function MobileHome({ products = [] }: MobileHomeProps) {
  return (
    <MobileLayout>
      <MobileHeader title="SuriMart" />
      
      <main className="pb-20">
        <div className="p-4">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome to SuriMart</h1>
            <p className="text-indigo-100 text-sm">Find what matters. Sell with trust.</p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 gap-4">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{product.title}</h3>
                    <p className="text-indigo-600 font-bold text-sm mt-1">
                      ₱{product.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-slate-500">
                <p>No products available</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </MobileLayout>
  )
}
