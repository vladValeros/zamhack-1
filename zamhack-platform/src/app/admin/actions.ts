"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// ==========================================
// ORGANIZATION ACTIONS (Existing)
// ==========================================

export async function approveOrganization(orgId: string) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Check admin role
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

  // Update organization status to 'active'
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ status: "active" })
    .eq("id", orgId)

  if (updateError) {
    return { success: false, error: updateError.message || "Failed to approve organization" }
  }

  // Revalidate the admin dashboard
  revalidatePath("/admin/dashboard")

  return { success: true }
}

export async function rejectOrganization(orgId: string) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Check admin role
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

  // Update organization status to 'rejected'
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ status: "rejected" })
    .eq("id", orgId)

  if (updateError) {
    return { success: false, error: updateError.message || "Failed to reject organization" }
  }

  // Revalidate the admin dashboard
  revalidatePath("/admin/dashboard")

  return { success: true }
}

// ==========================================
// CHALLENGE ACTIONS (New)
// ==========================================

/**
 * Approve a challenge (pending -> approved)
 */
export async function approveChallenge(challengeId: string) {
  const supabase = await createClient()

  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  // 2. Update Status
  const { error } = await supabase
    .from("challenges")
    .update({ status: "approved" }) // 'approved' means it is live
    .eq("id", challengeId)

  if (error) throw new Error("Failed to approve challenge")

  revalidatePath("/admin/dashboard")
  revalidatePath(`/admin/challenges/${challengeId}`)
}

/**
 * Reject a challenge (pending -> draft)
 * Sends it back to 'draft' so the company can fix issues.
 */
export async function rejectChallenge(challengeId: string) {
  const supabase = await createClient()

  // 1. Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Unauthorized")

  // 2. Update Status back to draft
  const { error } = await supabase
    .from("challenges")
    .update({ status: "draft" }) 
    .eq("id", challengeId)

  if (error) throw new Error("Failed to reject challenge")

  revalidatePath("/admin/dashboard")
  revalidatePath(`/admin/challenges/${challengeId}`)
}


