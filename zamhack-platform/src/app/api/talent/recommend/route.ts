import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { computeMatchScore } from "@/lib/talent/compute-match-score"

export async function GET() {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Get organization_id from the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.organization_id) {
    return NextResponse.json({ error: "Company profile not found" }, { status: 403 })
  }

  const orgId = profile.organization_id

  // 3. Fetch company challenges and build skill frequency map via challenge_skills join
  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, challenge_skills(skills(name))")
    .eq("organization_id", orgId)

  const skillFreq: Record<string, number> = {}
  for (const challenge of challenges ?? []) {
    for (const cs of (challenge as any).challenge_skills ?? []) {
      const name: string | undefined = cs.skills?.name
      if (name) skillFreq[name] = (skillFreq[name] ?? 0) + 1
    }
  }

  // Top 10 most-used skills across all company challenges
  const inferredSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name)

  // 4. Fetch all students with the data computeMatchScore needs
  const { data: rawStudents, error: studentsError } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      avatar_url,
      bio,
      degree,
      university,
      github_url,
      linkedin_url,
      updated_at,
      student_skills(
        level,
        skills(name)
      ),
      challenge_participants(
        status,
        joined_at,
        challenges(
          challenge_skills(
            skills(name)
          )
        ),
        submissions(
          evaluations(score)
        )
      ),
      winners(id)
    `)
    .eq("role", "student")

  if (studentsError) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }

  // Build winner IDs set
  const winnerIds = new Set<string>()
  for (const s of rawStudents ?? []) {
    if (((s as any).winners ?? []).length > 0) winnerIds.add(s.id)
  }

  // 5. Flatten submissions→evaluations onto each participant, then score
  const students = (rawStudents ?? []).map((student) => {
    const processedParticipants = ((student as any).challenge_participants ?? []).map(
      (p: any) => ({
        ...p,
        evaluations: (p.submissions ?? []).flatMap((sub: any) => sub.evaluations ?? []),
      })
    )

    const studentForScoring = { ...student, challenge_participants: processedParticipants }
    const score = computeMatchScore(studentForScoring, inferredSkills, winnerIds)

    return {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      avatar_url: student.avatar_url,
      bio: student.bio,
      degree: student.degree,
      university: student.university,
      github_url: student.github_url,
      linkedin_url: student.linkedin_url,
      student_skills: (student as any).student_skills,
      challenge_participants: processedParticipants,
      is_winner: winnerIds.has(student.id),
      matchScore: score,
    }
  })

  students.sort((a, b) => b.matchScore - a.matchScore)

  console.log("[recommend] inferredSkills:", inferredSkills)
  console.log("[recommend] top 3 students:", students.slice(0, 3).map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
    matchScore: s.matchScore,
  })))

  return NextResponse.json({ students, inferredSkills })
}
