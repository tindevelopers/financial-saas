import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client (for API routes and server components)
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Get current user from Supabase session
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Get current user with tenant info
export async function getCurrentUserWithTenant() {
  const user = await getCurrentUser()
  if (!user) return null

  const { prisma } = await import('./db')
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { tenant: true },
  })

  if (!userProfile) return null

  return {
    ...user,
    tenantId: userProfile.tenantId,
    tenant: userProfile.tenant,
    fullName: userProfile.fullName,
    name: userProfile.fullName, // Keep 'name' for backward compatibility
    email: userProfile.email,
    roleId: userProfile.roleId,
    plan: userProfile.plan,
    status: userProfile.status,
  }
}

