import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request)

  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith('/user') || pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')
  
  // Protected routes
  if (isProtectedRoute) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin routes check
    if (pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/user', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
