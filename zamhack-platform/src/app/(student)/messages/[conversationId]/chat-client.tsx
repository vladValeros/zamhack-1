"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Send, Building2, ArrowLeft } from "lucide-react"
import { sendDirectMessage } from "@/app/actions/message-actions"
import { sessionReadIds } from "../session-read-ids"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string | null
  organization_id: string | null
  organizations?: { name: string } | null
}

interface Message {
  id: string
  conversation_id: string | null
  sender_id: string | null
  content: string
  created_at: string | null
  is_read: boolean | null
  sender_profile?: {
    first_name: string | null
    last_name: string | null
    role: string | null
    avatar_url: string | null
  } | null
}

interface ChatClientProps {
  conversationId: string
  messages: Message[]
  otherProfile: Profile | null
  currentUserId: string
}

export function ChatClient({ conversationId, messages: initialMessages, otherProfile, currentUserId }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Mark this conversation as read in the session so the list page clears the badge
  useEffect(() => {
    sessionReadIds.add(conversationId)
  }, [conversationId])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    setSending(true)
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      sender_profile: { first_name: "Me", last_name: "", role: null, avatar_url: null },
    }
    setMessages((prev) => [...prev, optimistic])
    const sent = text
    setText("")
    const result = await sendDirectMessage(conversationId, sent)
    if (result.error) {
      toast.error(result.error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setText(sent)
    }
    setSending(false)
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const getInitials = (p: Profile | null) => {
    if (!p) return "?"
    return `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "?"
  }

  const getName = (p: Profile | null) => {
    if (!p) return "Unknown"
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown"
  }

  const getCompany = (p: Profile | null) => {
    return (p as any)?.organizations?.name ?? null
  }

  return (
    <>
      <style>{`
        .msg-input-area { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
      `}</style>
      <div style={{
        position: "fixed", top: 64, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column", background: "#fff",
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "0.875rem", background: "#fff", flexShrink: 0 }}>
          <button
            onClick={() => router.push("/messages")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 8px 8px 0", color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={22} />
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#2c3e50" }}>Messages</span>
          </button>
          <Avatar style={{ width: 40, height: 40 }}>
            <AvatarImage src={otherProfile?.avatar_url ?? undefined} />
            <AvatarFallback style={{ background: "linear-gradient(135deg,#ff9b87,#e8836f)", color: "#fff", fontSize: "0.8rem", fontWeight: 700 }}>
              {getInitials(otherProfile)}
            </AvatarFallback>
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2c3e50", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {getName(otherProfile)}
            </p>
            {getCompany(otherProfile) && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Building2 size={11} style={{ color: "#9ca3af" }} />
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{getCompany(otherProfile)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "2rem", color: "#9ca3af", fontSize: "0.875rem" }}>
              No messages yet. Say hello! 👋
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUserId
            const prevMsg = messages[i - 1]
            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {!isMe && isFirstInGroup && (
                  <span style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 3, marginLeft: 8 }}>
                    {msg.sender_profile?.first_name} {msg.sender_profile?.last_name}
                  </span>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? "linear-gradient(135deg,#ff9b87,#e8836f)" : "#f3f4f6",
                  color: isMe ? "#fff" : "#2c3e50",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 3, marginLeft: 4, marginRight: 4 }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        <div
          className="msg-input-area"
          style={{ padding: "0.875rem 1.25rem 1rem", borderTop: "1px solid #f3f4f6", background: "#fff", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexShrink: 0 }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            rows={1}
            style={{
              flex: 1, resize: "none", border: "1px solid #e5e7eb", borderRadius: 12,
              padding: "0.75rem 1rem", fontSize: "1rem", fontFamily: "inherit",
              outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
              transition: "border-color 0.15s", WebkitAppearance: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ff9b87")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 46, height: 46, borderRadius: 12, border: "none", cursor: "pointer",
              background: text.trim() && !sending ? "linear-gradient(135deg,#ff9b87,#e8836f)" : "#f3f4f6",
              color: text.trim() && !sending ? "#fff" : "#9ca3af",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  )
}
