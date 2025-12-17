import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

// Redirect to SaaS admin dashboard (using tinadmin-saas-base admin panel)
export default function AdminPage() {
  redirect("/admin/dashboard")
}
