"use client"

import { Zap } from "lucide-react"

const RANK_STYLES: Record<string, string> = {
  beginner:     "text-teal-700 bg-teal-50 border-teal-200",
  intermediate: "text-purple-700 bg-purple-50 border-purple-200",
  advanced:     "text-amber-700 bg-amber-50 border-amber-200",
}

const RANK_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

const NEXT_RANK: Record<string, string | null> = {
  beginner: "intermediate",
  intermediate: "advanced",
  advanced: null,
}

const NEXT_RANK_XP: Record<string, number> = {
  beginner: 2001,
  intermediate: 5001,
}

const BAND_START_XP: Record<string, number> = {
  beginner: 0,
  intermediate: 2001,
  advanced: 5001,
}

interface XpCardProps {
  xpPoints: number
  xpRank: string
}

export const XpCard = ({ xpPoints, xpRank }: XpCardProps) => {
  const nextRank = NEXT_RANK[xpRank]
  const targetXp = nextRank ? NEXT_RANK_XP[xpRank] : null
  const bandStart = BAND_START_XP[xpRank] ?? 0
  const progress = targetXp
    ? Math.min(100, ((xpPoints - bandStart) / (targetXp - bandStart)) * 100)
    : 100
  const xpToNext = targetXp ? Math.max(0, targetXp - xpPoints) : 0

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold text-sm">XP Rank</span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RANK_STYLES[xpRank] ?? ""}`}
        >
          {RANK_LABEL[xpRank] ?? xpRank}
        </span>
      </div>

      <div className="text-2xl font-bold">{xpPoints.toLocaleString()} XP</div>

      {targetXp ? (
        <>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary rounded-full h-1.5 transition-all"
              style={{ width: `${progress.toFixed(1)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {xpToNext.toLocaleString()} XP to{" "}
            {RANK_LABEL[nextRank!]}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Maximum rank reached</p>
      )}
    </div>
  )
}
