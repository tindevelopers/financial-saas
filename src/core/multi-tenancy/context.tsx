"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createBrowserClient } from '@supabase/ssr'

// Tenant type matching our Prisma schema
type Tenant = {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  plan: string | null;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
};

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant | null) => void;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return document.cookie.split(';').map(c => {
                const [name, ...rest] = c.trim().split('=')
                return { name, value: rest.join('=') }
              })
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${options?.maxAge ? `max-age=${options.maxAge}` : ''}`
              })
            },
          },
        }
      )
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setTenant(null);
        setIsLoading(false);
        return;
      }

      // Fetch tenant from our API (uses Prisma)
      const response = await fetch('/api/admin/current-tenant', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const tenantData = await response.json()
        setTenant(tenantData)
      } else {
        setTenant(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenant");
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
    
    // Listen for auth changes
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return document.cookie.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: rest.join('=') }
            })
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${options?.maxAge ? `max-age=${options.maxAge}` : ''}`
            })
          },
        },
      }
    )
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadTenant();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshTenant = async () => {
    await loadTenant();
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: tenant?.id || null,
        isLoading,
        error,
        setTenant,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

