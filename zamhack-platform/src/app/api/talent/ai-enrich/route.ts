import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { getAIMatchScore } from "@/lib/talent/ai-match"

function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const companyId: string | undefined = body.companyId
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 })
  }

  const supabase = getAdminSupabase()

  // 1. Get the company's organization
  const { data: companyProfile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", companyId)
    .single()

  if (!companyProfile?.organization_id) {
    return NextResponse.json({ error: "Company profile not found" }, { status: 404 })
  }

  const orgId = companyProfile.organization_id

  // 2. Build company context: industry from org, top skills + titles from challenges
  const [{ data: org }, { data: challenges }] = await Promise.all([
    supabase
      .from("organizations")
      .select("industry, name")
      .eq("id", orgId)
      .single(),
    supabase
      .from("challenges")
      .select("title, challenge_skills(skills(name))")
      .eq("organization_id", orgId),
  ])

  type ChallengeRow = {
    title: string | null
    challenge_skills: Array<{ skills: { name: string } | null } | null>
  }

  const skillFreq: Record<string, number> = {}
  for (const ch of (challenges ?? []) as ChallengeRow[]) {
    for (const cs of ch.challenge_skills ?? []) {
      const name = cs?.skills?.name
      if (name) skillFreq[name] = (skillFreq[name] ?? 0) + 1
    }
  }

  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name)

  const challengeTitles = (challenges ?? []).map((c) => c.title).filter(Boolean) as string[]

  const companyContext = {
    industry: org?.industry,
    topSkills,
    challengeTitles,
  }

  // 3. Fetch all students (fields needed by getAIMatchScore)
  const { data: students } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      bio,
      degree,
      university,
      student_skills(
        level,
        skills(name)
      )
    `)
    .eq("role", "student")

  if (!students || students.length === 0) {
    return NextResponse.json({ enriched: 0 })
  }

  // 4. Score in batches of 10 with 300ms delay between batches
  const BATCH_SIZE = 10
  const upsertRows: Array<{
    company_id: string
    student_id: string
    score: number
    reason: string
    computed_at: string
  }> = []

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((student) => getAIMatchScore(student, companyContext))
    )

    for (let j = 0; j < batch.length; j++) {
      upsertRows.push({
        company_id: companyId,
        student_id: batch[j].id,
        score: results[j].score,
        reason: results[j].reason,
        computed_at: new Date().toISOString(),
      })
    }

    if (i + BATCH_SIZE < students.length) {
      await sleep(300)
    }
  }

  if (upsertRows.length > 0) {
    await (supabase as any)
      .from("talent_match_cache")
      .upsert(upsertRows, { onConflict: "company_id,student_id" })
  }

  return NextResponse.json({ enriched: upsertRows.length })
}
