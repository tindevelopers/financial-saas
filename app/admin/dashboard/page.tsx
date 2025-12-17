"use client";

import TenantBreadcrumbs from "@/components/tenant/TenantBreadcrumbs";
import { useTenant } from "@/core/multi-tenancy/context";
import React from "react";

export default function DashboardPage() {
  const { tenant, isLoading } = useTenant();

  // Log tenant to check for rendering issues
  React.useEffect(() => {
    console.log('[DashboardPage] Tenant:', {
      tenantType: typeof tenant,
      tenant: tenant,
      tenantKeys: tenant ? Object.keys(tenant) : [],
      nameType: typeof tenant?.name,
      nameValue: tenant?.name,
      isLoading,
    })
  }, [tenant, isLoading])

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <TenantBreadcrumbs 
        items={[
          { label: "Dashboard", href: "/admin/dashboard" }
        ]}
      />

      {/* Dashboard Content */}
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-10 top-0 h-56 w-56 rounded-full bg-indigo-500 blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-pink-500 blur-[140px]" />
          </div>
          <div className="relative space-y-4">
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
              Welcome{(() => {
                if (!tenant) return ""
                const tenantName = tenant.name
                console.log('[DashboardPage] Rendering tenant name in h1:', {
                  tenantNameType: typeof tenantName,
                  tenantNameValue: tenantName,
                  isString: typeof tenantName === 'string',
                })
                const safeName = typeof tenantName === 'string' ? tenantName : String(tenantName || '')
                return ` to ${safeName}`
              })()}
            </h1>
            <p className="max-w-2xl text-white/70">
              {isLoading 
                ? "Loading..." 
                : tenant 
                  ? (() => {
                      const tenantName = tenant.name
                      console.log('[DashboardPage] Rendering tenant name in p:', {
                        tenantNameType: typeof tenantName,
                        tenantNameValue: tenantName,
                        isString: typeof tenantName === 'string',
                      })
                      const safeName = typeof tenantName === 'string' ? tenantName : String(tenantName || '')
                      return `Manage your ${safeName} workspace from this dashboard.`
                    })()
                  : "Get started by creating or selecting a tenant."}
            </p>
          </div>
        </section>

        {/* Dashboard Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Quick Stats
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dashboard statistics will appear here
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recent activity will appear here
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quick actions will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
