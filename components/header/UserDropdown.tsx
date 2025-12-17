"use client"

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
            <p className="text-sm font-medium leading-none">{user?.email?.split('@')[0]}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
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

