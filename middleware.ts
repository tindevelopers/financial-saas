import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Detect admin subdomain (e.g., admin.fincat.tinconnect.com)
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const isAdminSubdomain = subdomain === 'admin'
  
  // Refresh Supabase session
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    await supabase.auth.getUser()
  }

  // Handle admin subdomain routing
  if (isAdminSubdomain) {
    const url = request.nextUrl.clone()
    const pathname = url.pathname
    
    // Allow auth routes, API routes, and static assets
    const allowedPaths = ['/auth', '/api', '/_next', '/favicon']
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))
    
    // Admin routes are always allowed on admin subdomain
    const isAdminRoute = pathname.startsWith('/admin')
    
    // If accessing root on admin subdomain, redirect to admin dashboard
    if (pathname === '/') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // If accessing user routes (dashboard, upload, transactions) on admin subdomain, redirect to admin
    if (!isAdminRoute && !isAllowedPath && (pathname.startsWith('/dashboard') || pathname.startsWith('/upload') || pathname.startsWith('/transactions'))) {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // If not accessing /admin/* routes and not an allowed path, redirect to /admin
    if (!isAdminRoute && !isAllowedPath) {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // Add header to indicate admin subdomain
    supabaseResponse.headers.set('x-admin-subdomain', 'true')
  } else {
    // On regular domain (e.g., fincat.tinconnect.com)
    const pathname = request.nextUrl.pathname
    
    // Only redirect to admin subdomain if explicitly enabled via environment variable
    // Otherwise, allow /admin routes on main domain (works as fallback)
    if (pathname.startsWith('/admin') && process.env.ENABLE_ADMIN_SUBDOMAIN === 'true') {
      const isProduction = !hostname.includes('localhost') && 
                          !hostname.includes('127.0.0.1') && 
                          !hostname.includes('vercel.app')
      
      if (isProduction) {
        // Redirect to admin subdomain (only if ENABLE_ADMIN_SUBDOMAIN is set)
        const adminUrl = new URL(request.url)
        adminUrl.hostname = `admin.${hostname}`
        return NextResponse.redirect(adminUrl)
      }
    }
    // If ENABLE_ADMIN_SUBDOMAIN is not set, /admin routes work on main domain
  }

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
