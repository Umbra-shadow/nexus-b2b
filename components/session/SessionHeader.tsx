'use client'

import { useState } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { X, Bot } from 'lucide-react'
import type { SessionWithDetails } from '@/types/session'

interface SessionHeaderProps {
  session: SessionWithDetails
  currentUserId: string
  onClose: () => void
}

export function SessionHeader({ session, currentUserId, onClose }: SessionHeaderProps) {
  const [closing, setClosing] = useState(false)

  const isInitiator = session.initiatorAgentId === currentUserId
  const myBusiness = isInitiator ? session.initiatorBusiness : session.receiverBusiness
  const theirBusiness = isInitiator ? session.receiverBusiness : session.initiatorBusiness

  async function handleClose() {
    if (!confirm('Are you sure you want to close this session? Both parties will be notified.')) return
    setClosing(true)
    try {
      await fetch(`/api/sessions/${session.id}/close`, { method: 'POST' })
      onClose()
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="border-b border-border px-4 py-3 bg-background">
      <div className="flex items-center justify-between gap-4">
        {/* Businesses */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center -space-x-2">
            <Avatar name={myBusiness.name} src={myBusiness.logoUrl} size="sm" className="ring-2 ring-background z-10" />
            <Avatar name={theirBusiness.name} src={theirBusiness.logoUrl} size="sm" className="ring-2 ring-background" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {myBusiness.name} <span className="text-muted-foreground font-normal">↔</span> {theirBusiness.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusPill status={session.status} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Bot className="w-3 h-3" aria-hidden />
                AI Standing By
              </span>
            </div>
          </div>
        </div>

        {/* Close button */}
        {session.status !== 'closed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={closing}
            className="shrink-0"
          >
            <X className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Close Session</span>
          </Button>
        )}
      </div>
    </div>
  )
}
