"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || "Invalid email or password")
      } else if (data.user) {
        // Check if user is admin and redirect accordingly
        try {
          const checkResponse = await fetch("/api/admin/check-access", {
            credentials: "include",
          })
          
          if (checkResponse.ok) {
            // User is admin, redirect to admin panel
            const hostname = window.location.hostname
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('localhost:')
            
            // If already on admin subdomain, just redirect to /admin
            if (hostname.startsWith('admin.')) {
              router.push("/admin")
            } else if (isLocalhost) {
              // For localhost, just redirect to /admin on same domain
              router.push("/admin")
            } else {
              // For production, redirect to admin subdomain
              // Only construct admin subdomain if we have a proper domain (not Vercel preview URLs)
              const parts = hostname.split('.')
              if (parts.length >= 2 && !hostname.includes('vercel.app')) {
                // Regular domain like fincat.tinconnect.com -> admin.fincat.tinconnect.com
                const baseDomain = parts.slice(1).join('.')
                const adminHostname = `admin.${baseDomain}`
                const adminUrl = new URL("/admin", window.location.origin)
                adminUrl.hostname = adminHostname
                window.location.href = adminUrl.toString()
              } else {
                // Vercel preview or localhost - just redirect to /admin on same domain
                router.push("/admin")
              }
            }
          } else {
            // Regular user, go to dashboard
            router.push("/dashboard")
          }
        } catch (error) {
          // If check fails, default to dashboard
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
