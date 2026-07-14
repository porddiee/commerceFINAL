'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Users, Download, Menu, X } from 'lucide-react'

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white text-center">SuriMart</h1>
        <p className="text-indigo-200 text-center mt-2">Find what matters. Sell with trust.</p>
      </div>

      {/* Centered Login/Signup Buttons */}
      <div className="w-full max-w-sm space-y-4">
        <Link href="/login" className="block">
          <Button className="w-full h-14 bg-white hover:bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-lg">
            Log In
          </Button>
        </Link>
        <Link href="/register" className="block">
          <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg">
            Sign Up
          </Button>
        </Link>
      </div>

      {/* Download App Info */}
      <div className="absolute bottom-8 left-6 right-6">
        <div className="bg-green-600/20 backdrop-blur-md border border-green-400/30 rounded-xl p-4">
          <p className="text-green-100 text-sm mb-2 text-center">
            You're using the SuriMart mobile app!
          </p>
          <a href="/app-release.apk" download className="text-green-300 text-xs underline block text-center">
            Download latest version
          </a>
        </div>
      </div>
    </div>
  )
}
