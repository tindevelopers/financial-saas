"use client"

import React from "react"
import { useTenant } from "@/core/multi-tenancy/context"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TenantSwitcher({ className }: { className?: string }) {
  const { tenant, isLoading } = useTenant()

  // Log tenant to check for rendering issues
  React.useEffect(() => {
    console.log('[TenantSwitcher] Tenant:', {
      tenantType: typeof tenant,
      tenant: tenant,
      tenantKeys: tenant ? Object.keys(tenant) : [],
      nameType: typeof tenant?.name,
      nameValue: tenant?.name,
      isLoading,
    })
  }, [tenant, isLoading])

  if (isLoading || !tenant) {
    return null
  }

  return (
    <Button variant="outline" className={className} disabled>
      <Building2 className="mr-2 h-4 w-4" />
      <span className="text-sm">
        {(() => {
          const tenantName = tenant.name
          console.log('[TenantSwitcher] Rendering tenant name:', {
            tenantNameType: typeof tenantName,
            tenantNameValue: tenantName,
            isString: typeof tenantName === 'string',
          })
          return typeof tenantName === 'string' ? tenantName : String(tenantName || '')
        })()}
      </span>
    </Button>
  )
}

