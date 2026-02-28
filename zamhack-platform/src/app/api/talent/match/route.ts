import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { challengeId, requiredSkills = [] } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch all students with their skills, challenge history, and evaluations
  const { data: students } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, bio, university, degree,
      student_skills (
        level,
        skills ( id, name )
      ),
      challenge_participants (
        status,
        evaluations ( total_score )
      )
    `)
    .eq("role", "student")

  if (!students) return NextResponse.json({ error: "No students found" }, { status: 404 })

  const scored = students.map((student) => {
    const score = computeMatchScore(student, requiredSkills)
    return { ...student, matchScore: score }
  })

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({ students: scored })
}

function computeMatchScore(student: any, requiredSkills: string[]): number {
  let score = 0

  const studentSkills = student.student_skills || []
  const participants = student.challenge_participants || []

  // --- Skill overlap (40%) ---
  if (requiredSkills.length > 0) {
    const studentSkillNames = studentSkills.map((ss: any) =>
      ss.skills?.name?.toLowerCase()
    )
    const matches = requiredSkills.filter((rs) =>
      studentSkillNames.includes(rs.toLowerCase())
    )
    score += (matches.length / requiredSkills.length) * 40
  } else {
    score += studentSkills.length > 0 ? 20 : 0 // partial credit if they have any skills
  }

  // --- Proficiency levels (20%) ---
  const levelMap: Record<string, number> = {
    beginner: 1, intermediate: 2, advanced: 3
  }
  const avgLevel =
    studentSkills.length > 0
      ? studentSkills.reduce((sum: number, ss: any) => sum + (levelMap[ss.level] || 1), 0) /
        studentSkills.length
      : 0
  score += (avgLevel / 3) * 20

  // --- Completion rate (20%) ---
  const completed = participants.filter((p: any) => p.status === "completed").length
  const total = participants.length
  const completionRate = total > 0 ? completed / total : 0
  score += completionRate * 20

  // --- Avg evaluation score (15%) ---
  const allScores = participants
    .flatMap((p: any) => p.evaluations || [])
    .map((e: any) => e.total_score)
    .filter((s: any) => s != null)
  const avgScore =
    allScores.length > 0
      ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length
      : 0
  score += (avgScore / 100) * 15 // assuming scores are 0–100

  // --- Education keyword match (5%) ---
  if (requiredSkills.some((s) =>
    student.degree?.toLowerCase().includes(s.toLowerCase())
  )) {
    score += 5
  }

  return Math.round(Math.min(score, 100))
}