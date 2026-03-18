interface CompanyContext {
  industry?: string | null
  topSkills: string[]
  challengeTitles: string[]
}

interface AIMatchResult {
  score: number
  reason: string
}

export async function getAIMatchScore(
  student: {
    first_name?: string | null
    last_name?: string | null
    bio?: string | null
    degree?: string | null
    university?: string | null
    student_skills?: Array<{ skills?: { name?: string } | null; level?: string | null }>
  },
  companyContext: CompanyContext
): Promise<AIMatchResult> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return { score: 0, reason: "" }

    const skillNames =
      (student.student_skills ?? [])
        .map((ss) => ss.skills?.name)
        .filter(Boolean)
        .join(", ") || "none listed"

    const prompt = `You are evaluating how well a student matches a company's talent needs.

Company context:
- Industry: ${companyContext.industry || "Not specified"}
- Key skills they look for: ${companyContext.topSkills.join(", ") || "Not specified"}
- Their challenges: ${companyContext.challengeTitles.slice(0, 5).join("; ") || "Not specified"}

Student profile:
- Name: ${[student.first_name, student.last_name].filter(Boolean).join(" ") || "Unknown"}
- Degree: ${student.degree || "Not specified"}
- University: ${student.university || "Not specified"}
- Bio: ${student.bio || "Not provided"}
- Skills: ${skillNames}

Score this student's fit for this company 0–100 based on semantic skill similarity, domain relevance, and background alignment. Go beyond exact keyword matching — consider related fields, transferable skills, and contextual fit.

Respond with valid JSON only:
{"score": <number 0-100>, "reason": "<one concise sentence explaining the score>"}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) return { score: 0, reason: "" }

    const data = await response.json()
    const text: string = data.content?.[0]?.text ?? ""

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { score: 0, reason: "" }

    const parsed = JSON.parse(jsonMatch[0])
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
    const reason = typeof parsed.reason === "string" ? parsed.reason : ""

    return { score, reason }
  } catch {
    return { score: 0, reason: "" }
  }
}
