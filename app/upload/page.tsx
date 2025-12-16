"use client"

import { useState, useCallback } from "react"
import { DashboardLayoutWrapper } from "@/components/dashboard/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type UploadStatus = "idle" | "uploading" | "parsing" | "categorizing" | "completed" | "error"

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [result, setResult] = useState<{
    transactionsCreated: number
    errors: string[]
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target?.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      })
      return
    }

    setFile(file)
    setStatus("idle")
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setStatus("uploading")

      // Upload to S3 via our API
      const formData = new FormData()
      formData.append("file", file)
      formData.append("cloudStoragePath", `uploads/${Date.now()}-${file.name}`)

      const uploadResponse = await fetch("/api/upload/complete", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload failed")
      }

      const uploadData = await uploadResponse.json()
      setUploadId(uploadData.uploadId)
      setResult({
        transactionsCreated: uploadData.transactionsCreated,
        errors: uploadData.errors || [],
      })

      setStatus("categorizing")

      // Start AI categorization
      const categorizeResponse = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: uploadData.uploadId }),
      })

      if (!categorizeResponse.ok) {
        throw new Error("Categorization failed")
      }

      // Handle streaming response
      const reader = categorizeResponse.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const decoder = new TextDecoder()
      let buffer = ""
      let partialRead = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split("\n")
        partialRead = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              setStatus("completed")
              toast({
                title: "Success!",
                description: "Transactions categorized successfully",
              })
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.status === "completed") {
                setStatus("completed")
                toast({
                  title: "Success!",
                  description: `${parsed.result?.categorized || 0} transactions categorized`,
                })
                return
              } else if (parsed.status === "error") {
                throw new Error(parsed.message || "Categorization failed")
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStatus("completed")
    } catch (error: any) {
      console.error("Upload error:", error)
      setStatus("error")
      toast({
        title: "Upload failed",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "Uploading file..."
      case "parsing":
        return "Parsing transactions..."
      case "categorizing":
        return "AI is categorizing transactions..."
      case "completed":
        return "Completed successfully!"
      case "error":
        return "An error occurred"
      default:
        return ""
    }
  }

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Transactions</h1>
          <p className="text-muted-foreground">
            Upload your bank statement CSV or Excel file
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>
              Supported formats: CSV, XLSX. We support all major UK banks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx"
                onChange={handleFileInput}
                className="hidden"
                disabled={status === "uploading" || status === "parsing" || status === "categorizing"}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">
                  {file ? file.name : "Drop your file here or click to browse"}
                </p>
                <p className="text-sm text-gray-500">
                  CSV or Excel files up to 10MB
                </p>
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {status === "idle" && (
                  <Button onClick={handleUpload}>Upload & Categorize</Button>
                )}
              </div>
            )}

            {/* Status Messages */}
            {status !== "idle" && status !== "error" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                {status === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
                <p className="text-sm font-medium">{getStatusMessage()}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-red-800">{getStatusMessage()}</p>
              </div>
            )}

            {/* Results */}
            {result && status === "completed" && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    ✔ Successfully processed {result.transactionsCreated} transactions
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-sm text-orange-600">
                      {result.errors.length} rows had issues (shown in transaction list)
                    </p>
                  )}
                </div>
                <Button onClick={() => router.push("/transactions")} className="w-full">
                  View Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Export your transactions from your bank as CSV or Excel</p>
            <p>• Make sure the file includes Date, Description, and Amount columns</p>
            <p>• The AI will automatically detect and categorize your transactions</p>
            <p>• You can review and correct any uncertain categorizations afterwards</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayoutWrapper>
  )
}
