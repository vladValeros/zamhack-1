import { SupabaseClient } from "@supabase/supabase-js"

type XpRank = "beginner" | "intermediate" | "advanced"

const MULTIPLIER: Record<XpRank, Record<string, number>> = {
  beginner:     { beginner: 1.0, intermediate: 1.5, advanced: 2.0 },
  intermediate: { beginner: 0.5, intermediate: 1.0, advanced: 1.5 },
  advanced:     { beginner: 0.2, intermediate: 0.5, advanced: 1.0 },
}

function deriveRank(xp: number): XpRank {
  if (xp >= 5001) return "advanced"
  if (xp >= 2001) return "intermediate"
  return "beginner"
}

function computeBaseXp(score: number): number {
  if (score < 70) return -50
  return Math.round(50 + ((score - 70) / 30) * 350)
}

export type XpAwardResult = {
  xpDelta: number
  newXp: number
  previousRank: XpRank
  newRank: XpRank
  promoted: boolean
  penaltyApplied: boolean
}

export async function awardXp(
  supabase: SupabaseClient,
  profileId: string,
  challengeDifficulty: string,
  finalScore: number // 0–100
): Promise<XpAwardResult> {
  const fallback: XpAwardResult = {
    xpDelta: 0,
    newXp: 0,
    previousRank: "beginner",
    newRank: "beginner",
    promoted: false,
    penaltyApplied: false,
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("xp_points, xp_rank")
    .eq("id", profileId)
    .single()

  if (error || !profile) {
    console.error("[award-xp] Failed to fetch profile:", error?.message)
    return fallback
  }

  const currentXp: number = (profile as any).xp_points ?? 0
  const currentRank: XpRank = ((profile as any).xp_rank ?? "beginner") as XpRank

  const baseXp = computeBaseXp(finalScore)
  const multiplier = MULTIPLIER[currentRank]?.[challengeDifficulty] ?? 1.0
  let xpDelta = Math.round(baseXp * multiplier)

  // Penalty only applies to Advanced rank students.
  // Beginner and Intermediate: clamp any negative delta to 0.
  const penaltyApplied = xpDelta < 0 && currentRank === "advanced"
  if (xpDelta < 0 && currentRank !== "advanced") {
    xpDelta = 0
  }

  const newXp = Math.max(0, currentXp + xpDelta)
  const newRank = deriveRank(newXp)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp_points: newXp, xp_rank: newRank } as any)
    .eq("id", profileId)

  if (updateError) {
    console.error("[award-xp] Failed to update profile XP:", updateError.message)
  }

  return {
    xpDelta,
    newXp,
    previousRank: currentRank,
    newRank,
    promoted: newRank !== currentRank && newXp > currentXp,
    penaltyApplied,
  }
}
