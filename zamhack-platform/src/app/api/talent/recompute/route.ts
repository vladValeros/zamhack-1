import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { computeMatchScore } from "@/lib/talent/compute-match-score"

function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const studentId: string | undefined = body.studentId
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 })
  }

  const supabase = getAdminSupabase()

  // 1. All unique company profile IDs (both admin and member)
  const { data: companyProfiles, error: companyError } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .in("role", ["company_admin", "company_member"])

  if (companyError || !companyProfiles) {
    return NextResponse.json({ error: "Failed to fetch company profiles" }, { status: 500 })
  }

  // 2. Build inferred-skills map per organization (top-10 most-used skills)
  const uniqueOrgIds = [
    ...new Set(
      companyProfiles.map((p) => p.organization_id).filter(Boolean) as string[]
    ),
  ]

  const orgSkillMap = new Map<string, string[]>()

  if (uniqueOrgIds.length > 0) {
    const { data: challenges } = await supabase
      .from("challenges")
      .select("organization_id, challenge_skills(skills(name))")
      .in("organization_id", uniqueOrgIds)

    for (const orgId of uniqueOrgIds) {
      const skillFreq: Record<string, number> = {}
      for (const ch of (challenges ?? []).filter((c) => c.organization_id === orgId)) {
        for (const cs of (ch as any).challenge_skills ?? []) {
          const name: string | undefined = cs.skills?.name
          if (name) skillFreq[name] = (skillFreq[name] ?? 0) + 1
        }
      }
      const inferredSkills = Object.entries(skillFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name)
      orgSkillMap.set(orgId, inferredSkills)
    }
  }

  // 3. Fetch the student's full profile data required by computeMatchScore
  const { data: studentData, error: studentError } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, bio, degree, university, updated_at,
      student_skills(level, skills(name)),
      challenge_participants(
        status,
        joined_at,
        challenges(challenge_skills(skills(name))),
        submissions(evaluations(score))
      ),
      winners(id)
    `)
    .eq("id", studentId)
    .single()

  if (studentError || !studentData) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  // Build winnerIds for this student
  const winnerIds = new Set<string>()
  if (((studentData as any).winners ?? []).length > 0) winnerIds.add(studentData.id)

  // Flatten submissions→evaluations onto participants (matches recommend route shape)
  const processedParticipants = ((studentData as any).challenge_participants ?? []).map(
    (p: any) => ({
      ...p,
      evaluations: (p.submissions ?? []).flatMap((sub: any) => sub.evaluations ?? []),
    })
  )
  const studentForScoring = { ...studentData, challenge_participants: processedParticipants }

  // 4. Compute score per company profile and batch upsert
  const upsertRows = companyProfiles.map((company) => {
    const inferredSkills = company.organization_id
      ? (orgSkillMap.get(company.organization_id) ?? [])
      : []
    const score = computeMatchScore(studentForScoring, inferredSkills, winnerIds)
    return {
      company_id: company.id,
      student_id: studentId,
      score,
      computed_at: new Date().toISOString(),
    }
  })

  if (upsertRows.length > 0) {
    const { error: upsertError } = await (supabase as any)
      .from("talent_match_cache")
      .upsert(upsertRows, { onConflict: "company_id,student_id" })

    if (upsertError) {
      return NextResponse.json(
        { error: "Upsert failed", details: upsertError.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ upserted: upsertRows.length })
}
