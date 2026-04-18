import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get("tab") || "all"
  const q   = (searchParams.get("q") || "").trim()

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = adminSupabase
    .from("activity_logs")
    .select(`
      id,
      log_type,
      action,
      entity_type,
      entity_id,
      entity_label,
      metadata,
      created_at,
      actor:profiles!activity_logs_actor_id_fkey(first_name, last_name, role),
      organization:organizations(name)
    `)
    .order("created_at", { ascending: false })
    .limit(10000)

  if (tab === "admin" || tab === "company") {
    query = query.eq("log_type", tab)
  }

  if (q) {
    query = query.or(`action.ilike.%${q}%,entity_label.ilike.%${q}%`)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: logs ?? [] })
}
