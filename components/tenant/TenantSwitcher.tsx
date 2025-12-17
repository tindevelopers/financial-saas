"use client"

import { useTenant } from "@/core/multi-tenancy/context"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TenantSwitcher({ className }: { className?: string }) {
  const { tenant, isLoading } = useTenant()

  if (isLoading || !tenant) {
    return null
  }

  return (
    <Button variant="outline" className={className} disabled>
      <Building2 className="mr-2 h-4 w-4" />
      <span className="text-sm">{tenant.name}</span>
    </Button>
  )
}

