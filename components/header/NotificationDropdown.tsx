"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotificationDropdown() {
  return (
    <Button variant="ghost" size="icon" className="h-10 w-10">
      <Bell className="h-5 w-5" />
      <span className="sr-only">Notifications</span>
    </Button>
  )
}
