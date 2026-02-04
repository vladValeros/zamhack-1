import { createClient } from "@/utils/supabase/server"
import { ChallengeCard } from "@/components/challenge-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function MyChallengesPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user's challenge participants with challenge details
  // Using the join syntax to get the related challenge data
  const { data: participants, error: participantsError } = await supabase
    .from("challenge_participants")
    .select(`
      id,
      challenge_id,
      status,
      joined_at,
      challenge:challenges (
        *,
        organization:organizations (*)
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })

  if (participantsError) {
    console.error("Error fetching participants:", participantsError)
  }

  // Process data to flat lists
  const activeChallenges: any[] = []
  const completedChallenges: any[] = []

  participants?.forEach((p) => {
    // Check if challenge data exists (it might be null if challenge was deleted)
    if (!p.challenge) return

    // Type casting for safety if needed, though Supabase types usually handle this
    const challengeData = p.challenge as any

    // Categorize based on Participant status OR Challenge status
    // Usually "completed" means the user finished it, or the challenge itself is closed.
    const isCompleted = p.status === "completed" || challengeData.status === "completed"

    if (isCompleted) {
      completedChallenges.push(challengeData)
    } else {
      activeChallenges.push(challengeData)
    }
  })

  const hasAnyChallenges = activeChallenges.length > 0 || completedChallenges.length > 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Challenges</h1>
        <p className="text-muted-foreground">
          Track your progress and manage your active challenges.
        </p>
      </div>

      {!hasAnyChallenges ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground">
            You haven't joined any challenges yet
          </p>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Browse available challenges and start your journey.
          </p>
          <Button asChild>
            <Link href="/challenges">Browse Challenges</Link>
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedChallenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center text-muted-foreground">
                <p className="text-lg font-medium">No active challenges</p>
                <p className="text-sm mt-2">
                  You don't have any active challenges at the moment.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    href={`/challenges/${challenge.id}`}
                    // Removed 'progress' prop as it's not supported by ChallengeCard
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center text-muted-foreground">
                <p className="text-lg font-medium">No completed challenges</p>
                <p className="text-sm mt-2">
                  Your completed challenges will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    href={`/challenges/${challenge.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}