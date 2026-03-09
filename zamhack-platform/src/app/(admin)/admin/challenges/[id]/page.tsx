import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import Link from "next/link"
import { approveChallenge, rejectChallenge, approvePendingEdit, rejectPendingEdit } from "@/app/admin/actions"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"

export default async function AdminChallengeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Challenge Data with Organization
  const { data: challenge, error } = await supabase
    .from("challenges")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", id)
    .single()

  if (error || !challenge) {
    return <div>Challenge not found</div>
  }

  // 2. Fetch pending edits for this challenge
  const { data: pendingEdits } = await supabase
    .from("challenge_pending_edits")
    .select("*")
    .eq("challenge_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // 3. Helper for formatting
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
            <Badge variant="outline">{challenge.status}</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            By <span className="font-semibold text-foreground">{challenge.organization?.name}</span>
            • {formatDate(challenge.created_at)}
          </p>
        </div>

        {/* Approval Actions — only for fresh pending_approval challenges */}
        {challenge.status === "pending_approval" && (
          <div className="flex items-center gap-3">
            <form action={async () => {
              "use server"
              await rejectChallenge(challenge.id)
            }}>
              <Button type="submit" variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" />
                Reject (Draft)
              </Button>
            </form>

            <form action={async () => {
              "use server"
              await approveChallenge(challenge.id)
            }}>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 gap-2">
                <CheckCircle className="h-4 w-4" />
                Approve Challenge
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* ── Pending Edits Queue ── */}
      {pendingEdits && pendingEdits.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Pending Edits ({pendingEdits.length})
            </CardTitle>
            <p className="text-sm text-yellow-700">
              The company has submitted edits to this live challenge that are waiting for your review.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingEdits.map((edit) => {
              const payload = edit.payload as any
              return (
                <div key={edit.id} className="rounded-lg border border-yellow-200 bg-white p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(edit.created_at)}
                    </span>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      Pending Review
                    </Badge>
                  </div>

                  {/* Show a diff-style summary of what changed */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-semibold text-muted-foreground uppercase text-xs">Current</p>
                      <p><span className="text-muted-foreground">Title:</span> {challenge.title}</p>
                      <p><span className="text-muted-foreground">Status:</span> {challenge.status}</p>
                      <p><span className="text-muted-foreground">Industry:</span> {challenge.industry ?? "—"}</p>
                      <p><span className="text-muted-foreground">Difficulty:</span> {challenge.difficulty ?? "—"}</p>
                      <p><span className="text-muted-foreground">Max Participants:</span> {challenge.max_participants ?? "—"}</p>
                      <p><span className="text-muted-foreground">Start Date:</span> {formatDate(challenge.start_date)}</p>
                      <p><span className="text-muted-foreground">End Date:</span> {formatDate(challenge.end_date)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-muted-foreground uppercase text-xs">Proposed</p>
                      <p className={payload.title !== challenge.title ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Title:</span> {payload.title}
                      </p>
                      <p className={payload.status !== challenge.status ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Status:</span> {payload.status}
                      </p>
                      <p className={payload.industry !== challenge.industry ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Industry:</span> {payload.industry ?? "—"}
                      </p>
                      <p className={payload.difficulty !== challenge.difficulty ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Difficulty:</span> {payload.difficulty ?? "—"}
                      </p>
                      <p className={payload.max_participants !== challenge.max_participants ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Max Participants:</span> {payload.max_participants ?? "—"}
                      </p>
                      <p className={payload.start_date !== challenge.start_date ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">Start Date:</span> {formatDate(payload.start_date)}
                      </p>
                      <p className={payload.end_date !== challenge.end_date ? "text-yellow-700 font-medium" : ""}>
                        <span className="text-muted-foreground">End Date:</span> {formatDate(payload.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Description diff */}
                  {payload.description !== challenge.description && (
                    <div className="space-y-1 text-sm border-t pt-3">
                      <p className="font-semibold text-muted-foreground uppercase text-xs">Description Changed</p>
                      <p className="text-yellow-700 whitespace-pre-wrap">{payload.description}</p>
                    </div>
                  )}

                  {/* Milestone count change */}
                  {payload.milestones?.length !== undefined && (
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      Milestones: <span className="font-medium">{payload.milestones.length}</span> proposed
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t">
                    <form action={async () => {
                      "use server"
                      await rejectPendingEdit(edit.id)
                    }}>
                      <Button type="submit" variant="destructive" size="sm" className="gap-2">
                        <XCircle className="h-4 w-4" />
                        Reject Edit
                      </Button>
                    </form>

                    <form action={async () => {
                      "use server"
                      await approvePendingEdit(edit.id)
                    }}>
                      <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approve &amp; Apply Edit
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Challenge Content Preview */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Challenge Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{challenge.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Timeline</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Registration Deadline:</span>
                    <span className="font-medium">{formatDate(challenge.registration_deadline)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Start Date:</span>
                    <span className="font-medium">{formatDate(challenge.start_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>End Date:</span>
                    <span className="font-medium">{formatDate(challenge.end_date)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Requirements</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Participants:</span>
                    <span className="font-medium">{challenge.max_participants || "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Entry Fee:</span>
                    <span className="font-medium">
                      {challenge.entry_fee_amount && challenge.entry_fee_amount > 0
                        ? `${challenge.currency} ${challenge.entry_fee_amount}`
                        : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}