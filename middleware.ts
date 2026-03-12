import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Update session and get user. 
  // IMPORTANT: We must start with the response from updateSession
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // 2. Allow access to /login
  if (pathname === '/login') {
    return supabaseResponse
  }

  // 3. If no user, redirect to /login but KEEP the response's cookies 
  // (which might be important for clearing old sessions)
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    
    // We create a new redirect response but copy the cookies from supabaseResponse
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        ...cookie
      })
    })
    return redirectResponse
  }

  // 4. Return authorized response
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
