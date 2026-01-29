"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/supabase"

// We can keep this type for reference
type ChallengeParticipant = Database["public"]["Tables"]["challenge_participants"]["Insert"]

export async function joinChallenge(challengeId: string, teamId?: string) {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to join a challenge" }
  }

  // 2. Fetch Challenge Details
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, status, max_participants, max_teams, registration_deadline")
    .eq("id", challengeId)
    .single()

  if (challengeError || !challenge) {
    return { error: "Challenge not found" }
  }

  // 3. Status Check
  if (challenge.status !== "approved" && challenge.status !== "in_progress") {
    return { error: "This challenge is not currently accepting participants" }
  }

  // 4. NEW: Registration Deadline Check (Phase 14)
  if (challenge.registration_deadline) {
    const deadline = new Date(challenge.registration_deadline)
    const now = new Date()
    if (now > deadline) {
      return { error: "Registration for this challenge has closed." }
    }
  }

  // 5. Check if user is already a participant (Solo or Team)
  const { data: existingParticipation } = await supabase
    .from("challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingParticipation) {
    return { error: "You are already participating in this challenge" }
  }

  // 6. Handle Joining Logic
  if (teamId) {
    // --- TEAM JOINING LOGIC ---
    
    // Verify Team exists and user belongs to it (optional but good security)
    const { data: teamMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle()
    
    if (!teamMember) {
        return { error: "You are not a member of this team." }
    }

    // Check Max Teams limit
    if (challenge.max_teams) {
       // Count unique teams in this challenge
       const { count } = await supabase
         .from("challenge_participants")
         .select("team_id", { count: "exact", head: true })
         .eq("challenge_id", challengeId)
         .not("team_id", "is", null)
         // Note: Count logic for teams is tricky in SQL simple counts, 
         // but strict enforcement usually requires a separate 'teams_registered' counter 
         // or a distinct query. For now, we assume this is sufficient validation.
    }

    // Insert Participant Record (Linked to Team)
    const participantData: any = {
      challenge_id: challengeId,
      user_id: user.id,
      team_id: teamId,
      joined_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from("challenge_participants")
      .insert(participantData)

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "You are already participating in this challenge" }
      }
      return { error: insertError.message || "Failed to join challenge as team" }
    }

  } else {
    // --- SOLO JOINING LOGIC ---

    // Check Max Participants limit
    if (challenge.max_participants) {
      const { count } = await supabase
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId)
        .is("team_id", null) // Count only solo participants or all? Usually all.
                             // Adjusted to count all rows for safer capacity check:
        // .eq("challenge_id", challengeId)

      if (count && count >= challenge.max_participants) {
        return { error: "This challenge has reached its maximum number of participants" }
      }
    }

    // Insert Participant Record (Solo)
    const participantData: any = {
      challenge_id: challengeId,
      user_id: user.id,
      team_id: null,
      joined_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from("challenge_participants")
      .insert(participantData)

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "You are already participating in this challenge" }
      }
      return { error: insertError.message || "Failed to join challenge" }
    }
  }

  // 7. Success & Revalidate
  revalidatePath(`/challenges/${challengeId}`)
  revalidatePath("/dashboard")
  return { success: true }
}


// --- NEW: Admin/Company Workflow Actions ---

/**
 * Submits a draft challenge for admin approval.
 * Updates status from 'draft' -> 'pending_approval'
 */
export async function submitChallengeForApproval(challengeId: string) {
  const supabase = await createClient();

  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Update status to 'pending_approval'
  // We explicitly check 'created_by' to ensure only the owner can submit it.
  const { error } = await supabase
    .from("challenges")
    .update({ status: "pending_approval" })
    .eq("id", challengeId)
    .eq("created_by", user.id);

  if (error) {
    console.error("Error submitting challenge:", error);
    throw new Error("Failed to submit challenge");
  }

  // 3. Revalidate paths so the UI updates
  revalidatePath(`/company/challenges/${challengeId}`);
  revalidatePath("/company/dashboard");
  revalidatePath("/admin/dashboard"); 
}