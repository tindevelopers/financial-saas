"use client"

import { ThemeProvider } from "next-themes"
import { useState, useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    console.log('[Providers] Component mounting')
    setMounted(true)
    console.log('[Providers] Component mounted')
    
    return () => {
      console.log('[Providers] Component unmounting')
    }
  }, [])

  useEffect(() => {
    console.log('[Providers] Children type:', typeof children)
    console.log('[Providers] Children is array:', Array.isArray(children))
    if (children && typeof children === 'object' && 'props' in children) {
      console.log('[Providers] Children props keys:', Object.keys((children as any).props || {}))
    }
  }, [children])

  if (!mounted) {
    console.log('[Providers] Not mounted yet, returning children directly')
    return <>{children}</>
  }

  console.log('[Providers] Rendering ThemeProvider')
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  )
}
