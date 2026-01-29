import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import Link from "next/link"
import { approveChallenge, rejectChallenge } from "@/app/admin/actions"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"

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

  // 2. Helper for formatting
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
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

        {/* Approval Actions */}
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