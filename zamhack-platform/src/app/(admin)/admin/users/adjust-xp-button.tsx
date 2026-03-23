"use client"

import { useState } from "react"
import { adjustStudentXp } from "@/app/admin/actions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap } from "lucide-react"

interface AdjustXpButtonProps {
  userId: string
  role: string | null
  currentXp: number
  currentRank: string
}

export function AdjustXpButton({ userId, role, currentXp, currentRank }: AdjustXpButtonProps) {
  const [open, setOpen] = useState(false)
  const [xpValue, setXpValue] = useState(String(currentXp))
  const [loading, setLoading] = useState(false)

  if (role !== "student") return null

  const handleSave = async () => {
    const parsed = parseInt(xpValue, 10)
    if (isNaN(parsed) || parsed < 0) {
      toast.error("XP must be a non-negative number")
      return
    }
    setLoading(true)
    const result = await adjustStudentXp(userId, parsed)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("XP updated successfully")
      setOpen(false)
    }
  }

  return (
    <>
      <button
        className="admin-btn admin-btn-sm admin-btn-outline"
        style={{ color: "#b45309", borderColor: "#fde68a" }}
        onClick={() => { setXpValue(String(currentXp)); setOpen(true) }}
        title="Adjust this student's XP"
      >
        <Zap style={{ width: 13, height: 13 }} />
        XP
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 360 }}>
          <DialogHeader>
            <DialogTitle>Adjust Student XP</DialogTitle>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
            <p style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
              Current: <strong>{currentXp.toLocaleString()} XP</strong> ({currentRank} rank)
            </p>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem", color: "#374151" }}>
                New XP total
              </label>
              <Input
                type="number"
                min={0}
                value={xpValue}
                onChange={(e) => setXpValue(e.target.value)}
                placeholder="Enter new XP value"
              />
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                Rank is derived automatically: 0–2000 = Beginner, 2001–5000 = Intermediate, 5001+ = Advanced
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving…" : "Save XP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
