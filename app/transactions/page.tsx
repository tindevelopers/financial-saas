"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from "react"
import { DashboardLayoutWrapper } from "@/components/dashboard/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Search, Filter, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  date: string
  description: string
  payerPayee?: string
  amount: string
  paidIn?: string
  paidOut?: string
  category?: { id: string; name: string }
  confidence?: string
  status: string
  needsReview: boolean
}

interface Category {
  id: string
  name: string
  type: string
}

export default function TransactionsPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadTransactions()
    loadCategories()
  }, [])

  const loadTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (!response.ok) throw new Error("Failed to load transactions")
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error: any) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to load categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error: any) {
      console.error("Error loading categories:", error)
    }
  }

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          categoryId,
          isReviewed: true,
        }),
      })

      if (!response.ok) throw new Error("Failed to update category")

      const data = await response.json()
      
      // Update local state
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, ...data.transaction } : t
        )
      )

      toast({
        title: "Category updated",
        description: "Transaction categorized successfully",
      })
    } catch (error: any) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        transaction.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        transaction.payerPayee?.toLowerCase()?.includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "needs-review" && transaction.needsReview) ||
        (statusFilter === "categorized" && transaction.category && !transaction.needsReview) ||
        (statusFilter === "pending" && !transaction.category)

      return matchesSearch && matchesStatus
    })
  }, [transactions, searchTerm, statusFilter])

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Description",
      "Payee/Payer",
      "Reference",
      "Paid In",
      "Paid Out",
      "Amount",
      "Category",
      "Confidence",
      "AI Reasoning",
      "Status",
      "Needs Review",
      "Reviewed",
    ]
    
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString("en-GB"),
      t.description,
      t.payerPayee || "",
      (t as any).reference || "",
      t.paidIn || "",
      t.paidOut || "",
      t.amount,
      t.category?.name || "Uncategorized",
      t.confidence ? `${Math.round(parseFloat(t.confidence) * 100)}%` : "",
      (t as any).aiReasoning || "",
      t.status,
      t.needsReview ? "Yes" : "No",
      (t as any).isReviewed ? "Yes" : "No",
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Export successful",
      description: "Transactions exported as CSV",
    })
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Review and categorize your financial transactions
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by description or payee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="needs-review">Needs Review</SelectItem>
                <SelectItem value="categorized">Categorized</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter((t) => t.category && !t.needsReview).length}
              </div>
              <p className="text-xs text-muted-foreground">Categorized</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {transactions.filter((t) => t.needsReview).length}
              </div>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction List</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transactions shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No transactions found</p>
                <p className="text-sm">Upload a file to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className={transaction.needsReview ? "bg-orange-50" : ""}
                      >
                        <TableCell className="whitespace-nowrap">
                          {new Date(transaction.date).toLocaleDateString("en-GB")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.payerPayee && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.payerPayee}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={parseFloat(transaction.amount) >= 0 ? "text-green-600" : "text-red-600"}
                          >
                            £{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transaction.category?.id || ""}
                            onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {transaction.confidence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(parseFloat(transaction.confidence) * 100)}% confident
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.needsReview ? (
                            <Badge variant="outline" className="border-orange-600 text-orange-600 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Needs Review
                            </Badge>
                          ) : transaction.category ? (
                            <Badge variant="outline" className="border-green-600 text-green-600 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Categorized
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutWrapper>
  )
}
