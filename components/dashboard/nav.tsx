"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Upload, FileText, LogOut, Settings } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Transactions", href: "/transactions", icon: FileText },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut } = useSupabaseAuth()

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-2xl">£</span>
          <span>FinCat</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive
                    ? "bg-muted text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">
            Signed in as
          </div>
          <div className="text-sm font-medium truncate">
            {user?.email || "User"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full mt-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
