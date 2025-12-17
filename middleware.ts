import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Detect subdomain
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
    
    // If accessing root on admin subdomain, redirect to admin dashboard
    if (pathname === '/') {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // If not accessing /admin/* routes, redirect to /admin
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // Add header to indicate admin subdomain
    supabaseResponse.headers.set('x-admin-subdomain', 'true')
  } else {
    // On regular domain, redirect /admin routes to admin subdomain if configured
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/admin') && process.env.ADMIN_SUBDOMAIN) {
      const adminUrl = new URL(request.url)
      adminUrl.hostname = `admin.${hostname.split('.').slice(1).join('.')}`
      return NextResponse.redirect(adminUrl)
    }
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
