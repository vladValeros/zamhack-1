import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ChallengeCard } from "@/components/challenge-card"
import { ChallengeFilters } from "@/components/challenge-filters"
import { Telescope } from "lucide-react"

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StudentDashboard({ searchParams }: DashboardProps) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Extract params
  const q = typeof params.q === "string" ? params.q : ""
  const category = typeof params.category === "string" ? params.category : ""
  const sort = typeof params.sort === "string" ? params.sort : "newest"

  // 1. Base Query
  let query = supabase
    .from("challenges")
    .select(`
      *,
      organization:organizations(name)
    `)
    // Filter out draft/pending challenges immediately
    .neq("status", "draft")
    .neq("status", "pending_approval")
    // FIX: Cast "rejected" to any to bypass TS error until types are regenerated
    .neq("status", "rejected" as any)

  // 2. Apply Search (Title or Description)
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // 3. Apply Category Filter (Mapping to 'industry' column)
  if (category && category !== "all") {
    // ilike allows for partial matches e.g. "Tech" matching "Technology"
    query = query.ilike("industry", `%${category}%`)
  }

  // 4. Apply Sorting
  switch (sort) {
    case "closing_soon":
      // Order by registration deadline, nearest first.
      // Only show challenges that haven't passed the deadline yet.
      query = query
        .gt("registration_deadline", new Date().toISOString())
        .order("registration_deadline", { ascending: true })
      break
    case "participants_high":
      // Sort by max_participants as a proxy for scale/popularity
      query = query.order("max_participants", { ascending: false })
      break
    case "newest":
    default:
      query = query.order("created_at", { ascending: false })
      break
  }

  const { data: challenges, error } = await query

  if (error) {
    console.error("Error fetching challenges:", error)
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Challenges</h1>
        <p className="text-muted-foreground">
          Find the perfect project to build your portfolio and win prizes.
        </p>
      </div>

      {/* Filter Component */}
      <ChallengeFilters />

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges?.map((challenge) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            href={`/challenges/${challenge.id}`}
            // We pass showStatus=true by default, but the component handles hiding 'Approved' internally now
          />
        ))}
      </div>

      {/* Empty State */}
      {(!challenges || challenges.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 dark:bg-slate-800">
            <Telescope className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No challenges found</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            We couldn't find any challenges matching your filters. Try adjusting your search terms or category.
          </p>
        </div>
      )}
    </div>
  )
}