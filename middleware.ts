import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protected routes
    const protectedRoutes = ['/create', '/profile', '/settings']
    const isProtectedRoute = protectedRoutes.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    // Auth routes
    const authRoutes = ['/signin', '/signup']
    const isAuthRoute = authRoutes.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    // Redirect if accessing protected route without session
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    // Redirect if accessing auth routes with session
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 