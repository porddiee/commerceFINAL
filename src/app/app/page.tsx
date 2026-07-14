'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Users, Download, Menu, X } from 'lucide-react'

export default function MobileAppPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-white">SuriMart</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm pt-20 px-4">
          <div className="space-y-4">
            <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white font-semibold">
                Browse Products
              </div>
            </Link>
            <Link href="/user/products" onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white font-semibold">
                My Listings
              </div>
            </Link>
            <Link href="/user/saved" onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white font-semibold">
                Saved Items
              </div>
            </Link>
            <Link href="/user/messages" onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white font-semibold">
                Messages
              </div>
            </Link>
            <Link href="/user/profile" onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white font-semibold">
                Profile
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 px-4 pb-24">
        {/* Hero Section */}
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to SuriMart</h2>
          <p className="text-indigo-200">Find what matters. Sell with trust.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/browse">
            <Button className="w-full h-20 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl flex flex-col items-center justify-center gap-2">
              <ShoppingBag size={24} />
              <span className="text-sm font-semibold">Browse</span>
            </Button>
          </Link>
          <Link href="/user/products">
            <Button className="w-full h-20 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl flex flex-col items-center justify-center gap-2">
              <Users size={24} />
              <span className="text-sm font-semibold">Sell</span>
            </Button>
          </Link>
        </div>

        {/* Sign In Button */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6">
          <Link href="/login">
            <Button className="w-full bg-white hover:bg-indigo-50 text-indigo-700">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Download App Info */}
        <div className="bg-green-600/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4">
          <p className="text-green-100 text-sm mb-2">
            You're using the SuriMart mobile app!
          </p>
          <a href="/app-release.apk" download className="text-green-300 text-xs underline">
            Download latest version
          </a>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10">
        <div className="flex justify-around py-3">
          <Link href="/browse" className="text-white flex flex-col items-center">
            <ShoppingBag size={20} />
            <span className="text-xs mt-1">Browse</span>
          </Link>
          <Link href="/user/products" className="text-white flex flex-col items-center">
            <Users size={20} />
            <span className="text-xs mt-1">Sell</span>
          </Link>
          <Link href="/user/saved" className="text-white flex flex-col items-center">
            <Download size={20} />
            <span className="text-xs mt-1">Saved</span>
          </Link>
          <Link href="/user/profile" className="text-white flex flex-col items-center">
            <Menu size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
