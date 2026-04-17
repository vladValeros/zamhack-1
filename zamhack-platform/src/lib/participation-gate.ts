import { SupabaseClient } from "@supabase/supabase-js"

export type GateResult =
  | { allowed: true }
  | {
      allowed: false
      reason: "skill_gate"
      requiredTier: "beginner" | "intermediate"
      difficulty: string
      missingSkillIds: string[]
    }
  | {
      allowed: false
      reason: "advanced_limit"
      nextEligibleAt: string
      effectiveLimit: number
    }
  | {
      allowed: false
      reason: "xp_rank_gate"
      requiredRank: "intermediate" | "advanced"
      currentRank: string
    }
  | {
      allowed: false
      reason: "xp_rank_advisory"
      challengeRank: "intermediate" | "advanced"
      currentRank: string
    }

export async function checkParticipationGate(
  supabase: SupabaseClient,
  challengeId: string,
  profileId: string
): Promise<GateResult> {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("difficulty")
    .eq("id", challengeId)
    .single()

  if (!challenge) return { allowed: true } // fail-open

  const difficulty: string = challenge.difficulty ?? "beginner"

  if (difficulty === "beginner") {
    // Fetch global guardrail limit from platform_settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("advanced_beginner_weekly_limit")
      .eq("id", true)
      .single()

    // undefined = column missing or query failed (fail-open); null = admin disabled guardrail
    const globalLimit = (settings as any)?.advanced_beginner_weekly_limit
    if (globalLimit == null) {
      return { allowed: true }
    }

    // Detect advanced students via xp_rank
    const { data: profileForGuard } = await supabase
      .from("profiles")
      .select("xp_rank")
      .eq("id", profileId)
      .single()

    const guardRank = (profileForGuard as any)?.xp_rank ?? "beginner"
    if (guardRank !== "advanced") {
      return { allowed: true }
    }

    // Advanced-XP student — count ALL beginner challenge joins in the past 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentJoins } = await (supabase
      .from("challenge_participants")
      .select("joined_at, challenges(difficulty)")
      .eq("user_id", profileId)
      .neq("status", "withdrawn")
      .gte("joined_at", weekAgo) as any)

    const beginnerJoins = (recentJoins ?? []).filter(
      (p: any) => p.challenges?.difficulty === "beginner"
    )

    if (beginnerJoins.length >= globalLimit) {
      const sorted = [...beginnerJoins].sort(
        (a: any, b: any) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      )
      const nextEligibleAt = new Date(
        new Date(sorted[0].joined_at).getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString()

      return {
        allowed: false,
        reason: "advanced_limit",
        nextEligibleAt,
        effectiveLimit: globalLimit,
      }
    }

    return { allowed: true }
  }

  // XP rank gate — replaces the old skill-tier gate for intermediate and advanced challenges
  const { data: studentProfileGate } = await supabase
    .from("profiles")
    .select("xp_rank")
    .eq("id", profileId)
    .single()

  const studentXpRank = (studentProfileGate as any)?.xp_rank ?? "beginner"

  if (difficulty === "intermediate" && studentXpRank === "beginner") {
    return {
      allowed: false,
      reason: "xp_rank_advisory",
      challengeRank: "intermediate",
      currentRank: studentXpRank,
    }
  }

  if (difficulty === "advanced" && studentXpRank !== "advanced") {
    return {
      allowed: false,
      reason: "xp_rank_advisory",
      challengeRank: "advanced",
      currentRank: studentXpRank,
    }
  }

  return { allowed: true }
}
