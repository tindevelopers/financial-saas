"use client"

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Log error details with full object inspection
    console.error('[ErrorBoundary] Caught error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errorType: typeof error,
      errorConstructor: error.constructor?.name,
      errorKeys: Object.keys(error),
      errorStringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    })
    
    // Try to extract more details from the error message
    if (error.message.includes('object')) {
      console.error('[ErrorBoundary] React Error #130 detected - Object being rendered!')
      console.error('[ErrorBoundary] Full error object:', error)
    }
    
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detailed error information with full object details
    console.error('[ErrorBoundary] Error details:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: typeof error,
        constructor: error.constructor?.name,
        keys: Object.keys(error),
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
    })

    // Log what was being rendered
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    
    // Try to extract the problematic object from the error
    if (error.message.includes('object')) {
      console.error('[ErrorBoundary] ===== REACT ERROR #130 DETECTED =====')
      console.error('[ErrorBoundary] An object is being rendered directly in JSX')
      console.error('[ErrorBoundary] Check the component stack above to find the component')
      console.error('[ErrorBoundary] Look for places where objects might be rendered:')
      console.error('[ErrorBoundary] - tenant.name, tenant, user, user.email')
      console.error('[ErrorBoundary] - nav.name, subItem.name, nestedItem.name')
      console.error('[ErrorBoundary] - Any object properties being rendered directly')
    }
    
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>An error occurred while rendering this page.</p>
              {this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {'\n\n'}
                        {this.state.error.stack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
