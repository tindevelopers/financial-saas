"use client"

import React from "react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export default function UserDropdown() {
  const { user, signOut } = useSupabaseAuth()
  const router = useRouter()

  // Log user object to check for rendering issues
  React.useEffect(() => {
    console.log('[UserDropdown] User object:', {
      userType: typeof user,
      user: user,
      userKeys: user ? Object.keys(user) : [],
      emailType: typeof user?.email,
      emailValue: user?.email,
    })
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    // Remove admin subdomain: admin.fincat.tinconnect.com -> fincat.tinconnect.com
    const signinUrl = new URL('/auth/signin', window.location.origin)
    signinUrl.hostname = signinUrl.hostname.replace(/^admin\./, '')
    window.location.href = signinUrl.toString()
  }

  const initials = user?.email
    ?.split('@')[0]
    .substring(0, 2)
    .toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 xl:block">
            {user?.email?.split('@')[0] || 'User'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {(() => {
                const emailPrefix = user?.email?.split('@')[0]
                console.log('[UserDropdown] Rendering email prefix:', {
                  emailPrefixType: typeof emailPrefix,
                  emailPrefixValue: emailPrefix,
                  isString: typeof emailPrefix === 'string',
                })
                return typeof emailPrefix === 'string' ? emailPrefix : String(emailPrefix || 'User')
              })()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {(() => {
                const email = user?.email
                console.log('[UserDropdown] Rendering email:', {
                  emailType: typeof email,
                  emailValue: email,
                  isString: typeof email === 'string',
                })
                return typeof email === 'string' ? email : String(email || '')
              })()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

