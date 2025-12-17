"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

type BreadcrumbItem = {
  label: string
  href: string
}

export default function TenantBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
      <Link href="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-300">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

