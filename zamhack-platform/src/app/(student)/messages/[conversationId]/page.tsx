import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { redirect } from "next/navigation"
import { ChatClient } from "./chat-client"

export default async function MobileChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify user is a participant
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id)
    .eq("conversation_id", conversationId)
    .single()

  if (!participation) redirect("/messages")

  // Mark all messages as read (service role bypasses RLS)
  const adminSupabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await adminSupabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)

  // Fetch message thread
  const { data: msgs } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      created_at,
      is_read,
      sender_profile:profiles!sender_id (
        first_name,
        last_name,
        role,
        avatar_url
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  // Fetch the other participant's profile
  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select(`profiles ( id, first_name, last_name, avatar_url, role, organization_id, organizations ( name ) )`)
    .eq("conversation_id", conversationId)
    .neq("profile_id", user.id)
    .single()

  const otherProfile = (otherParticipant?.profiles as any) ?? null

  return (
    <ChatClient
      conversationId={conversationId}
      messages={msgs ?? []}
      otherProfile={otherProfile}
      currentUserId={user.id}
    />
  )
}
