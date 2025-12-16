"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayoutWrapper } from "@/components/dashboard/layout-wrapper"
import { FileText, Upload as UploadIcon, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalTransactions: number
  categorized: number
  needsReview: number
  recentUploads: Array<{
    id: string
    filename: string
    rowCount: number
    status: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch dashboard stats
    // For now, using placeholder data
    setTimeout(() => {
      setStats({
        totalTransactions: 0,
        categorized: 0,
        needsReview: 0,
        recentUploads: [],
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <DashboardLayoutWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayoutWrapper>
    )
  }

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all uploads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorized</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.categorized || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalTransactions ? `${Math.round((stats.categorized / stats.totalTransactions) * 100)}% complete` : '0% complete'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.needsReview || 0}</div>
              <p className="text-xs text-muted-foreground">
                Uncertain categorizations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link href="/upload">
              <Button className="w-full h-24 flex flex-col gap-2">
                <UploadIcon className="h-6 w-6" />
                <span>Upload Transactions</span>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>View All Transactions</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        {stats?.recentUploads && stats.recentUploads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>
                Your latest transaction uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentUploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{upload.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {upload.rowCount} transactions • {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">{upload.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Get Started Guide */}
        {stats?.totalTransactions === 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Upload your first transaction file to begin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Upload Transactions" above or go to the Upload page</li>
                <li>Select your CSV or Excel file from your bank</li>
                <li>Our AI will automatically categorize your transactions</li>
                <li>Review and correct any uncertain categorizations</li>
                <li>Export to Google Sheets when done</li>
              </ol>
              <Link href="/upload">
                <Button className="w-full mt-4">Upload Your First File</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayoutWrapper>
  )
}
