"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// ==========================================
// ORGANIZATION ACTIONS (Existing)
// ==========================================

export async function approveOrganization(orgId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" }
  }

  if (profile.role !== "admin") {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ status: "active" })
    .eq("id", orgId)

  if (updateError) {
    return { success: false, error: updateError.message || "Failed to approve organization" }
  }

  revalidatePath("/admin/dashboard")

  return { success: true }
}

export async function rejectOrganization(orgId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" }
  }

  if (profile.role !== "admin") {
    return { success: false, error: "Unauthorized: Admin access required" }
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ status: "rejected" })
    .eq("id", orgId)

  if (updateError) {
    return { success: false, error: updateError.message || "Failed to reject organization" }
  }

  revalidatePath("/admin/dashboard")

  return { success: true }
}

// ==========================================
// CHALLENGE ACTIONS (Existing)
// ==========================================

export async function approveChallenge(challengeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  const { error } = await supabase
    .from("challenges")
    .update({ status: "approved" })
    .eq("id", challengeId)

  if (error) throw new Error("Failed to approve challenge")

  revalidatePath("/admin/dashboard")
  revalidatePath(`/admin/challenges/${challengeId}`)
}

export async function rejectChallenge(challengeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  const { error } = await supabase
    .from("challenges")
    .update({ status: "draft" })
    .eq("id", challengeId)

  if (error) throw new Error("Failed to reject challenge")

  revalidatePath("/admin/dashboard")
  revalidatePath(`/admin/challenges/${challengeId}`)
}

// ==========================================
// PENDING EDIT ACTIONS (New)
// ==========================================

/**
 * Approve a pending edit — applies the stored payload directly to the
 * challenge and its milestones, then marks the edit record as approved.
 */
export async function approvePendingEdit(pendingEditId: string) {
  const supabase = await createClient()

  // 1. Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  // 2. Fetch the pending edit
  const { data: pendingEdit, error: fetchError } = await supabase
    .from("challenge_pending_edits")
    .select("*")
    .eq("id", pendingEditId)
    .single()

  if (fetchError || !pendingEdit) throw new Error("Pending edit not found")
  if (pendingEdit.status !== "pending") throw new Error("Edit has already been reviewed")

  const payload = pendingEdit.payload as any
  const challengeId = pendingEdit.challenge_id

  // 3. Apply challenge-level fields from the payload
  const { error: challengeError } = await supabase
    .from("challenges")
    .update({
      title: payload.title,
      description: payload.description,
      problem_brief: payload.problem_brief,
      industry: payload.industry,
      difficulty: payload.difficulty,
      status: payload.status,
      participation_type: payload.participation_type,
      max_participants: payload.max_participants,
      max_teams: payload.max_teams,
      max_team_size: payload.max_team_size,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      registration_deadline: payload.registration_deadline || null,
      entry_fee_amount: payload.entry_fee_amount,
      currency: payload.currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", challengeId)

  if (challengeError) throw new Error("Failed to apply challenge edits")

  // 4. Apply milestone changes from the payload
  for (const milestone of payload.milestones ?? []) {
    if (milestone.id) {
      await supabase
        .from("milestones")
        .update({
          title: milestone.title,
          description: milestone.description,
          due_date: milestone.due_date || null,
          sequence_order: milestone.sequence_order,
          requires_github: milestone.requires_github,
          requires_url: milestone.requires_url,
          requires_text: milestone.requires_text,
        })
        .eq("id", milestone.id)
    } else {
      await supabase.from("milestones").insert({
        challenge_id: challengeId,
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date || null,
        sequence_order: milestone.sequence_order,
        requires_github: milestone.requires_github,
        requires_url: milestone.requires_url,
        requires_text: milestone.requires_text,
      })
    }
  }

  // 5. Mark the pending edit as approved
  await supabase
    .from("challenge_pending_edits")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pendingEditId)

  revalidatePath(`/admin/challenges/${challengeId}`)
  revalidatePath(`/company/challenges/${challengeId}`)
}

/**
 * Reject a pending edit — marks it as rejected with an optional note.
 * The live challenge is left completely untouched.
 */
export async function rejectPendingEdit(pendingEditId: string, adminNote?: string) {
  const supabase = await createClient()

  // 1. Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  // 2. Fetch the pending edit to get the challenge_id for revalidation
  const { data: pendingEdit, error: fetchError } = await supabase
    .from("challenge_pending_edits")
    .select("challenge_id, status")
    .eq("id", pendingEditId)
    .single()

  if (fetchError || !pendingEdit) throw new Error("Pending edit not found")
  if (pendingEdit.status !== "pending") throw new Error("Edit has already been reviewed")

  // 3. Mark as rejected
  const { error } = await supabase
    .from("challenge_pending_edits")
    .update({
      status: "rejected",
      admin_note: adminNote ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pendingEditId)

  if (error) throw new Error("Failed to reject pending edit")

  revalidatePath(`/admin/challenges/${pendingEdit.challenge_id}`)
  revalidatePath(`/company/challenges/${pendingEdit.challenge_id}`)
}