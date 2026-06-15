'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Send, Bot, FileText, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatBubble } from '@/components/session/ChatBubble'
import { SessionHeader } from '@/components/session/SessionHeader'
import type { ChatMessage } from '@/lib/db/dynamo'
import type { SessionWithDetails } from '@/types/session'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: authSession } = useSession()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout>()

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/messages`)
    if (res.ok) {
      const json = await res.json()
      setMessages(json.messages)
    }
  }, [sessionId])

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`)
    if (res.ok) {
      const json = await res.json()
      setSession(json.session)
    }
  }, [sessionId])

  useEffect(() => {
    async function init() {
      await Promise.all([fetchSession(), fetchMessages()])
      setLoading(false)
    }
    init()

    pollRef.current = setInterval(fetchMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [fetchSession, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const content = input.trim()
    setInput('')

    if (content.startsWith('/ai ')) {
      const question = content.slice(4).trim()
      if (!question) return
      setAiTyping(true)
      setSending(true)
      try {
        await fetch(`/api/ai/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, sessionId }),
        })
        await fetchMessages()
      } finally {
        setAiTyping(false)
        setSending(false)
      }
      return
    }

    setSending(true)
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      await fetchMessages()
    } finally {
      setSending(false)
    }
  }

  function handleClose() {
    fetchSession()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    )
  }

  const closed = session.status === 'closed'

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-0px)]">
      <SessionHeader
        session={session}
        currentUserId={authSession?.user?.id ?? ''}
        onClose={handleClose}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {session.status === 'pending'
              ? 'Waiting for the other party to accept the invitation…'
              : 'Session started. Say hello!'}
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.message_id}
            message={msg}
            isOwn={msg.sender_id === authSession?.user?.id}
          />
        ))}
        {aiTyping && (
          <div className="flex gap-3 my-3">
            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
              AI
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!closed && (
        <div className="border-t border-border px-4 py-3 bg-background">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message… or /ai [question] to call the AI"
                className="pr-10"
                disabled={sending}
              />
              {input.startsWith('/ai') && (
                <Bot className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Attach receipt"
              onClick={() => router.push(`/sessions/${sessionId}/receipt/new`)}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button type="submit" size="icon" disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
            Tip: type <code className="bg-secondary px-1 rounded">/ai your question</code> to call the AI assistant
          </p>
        </div>
      )}

      {closed && (
        <div className="border-t border-border px-4 py-4 bg-red-50 text-center">
          <p className="text-sm text-red-600 font-medium">This session has ended.</p>
        </div>
      )}
    </div>
  )
}
