import { cn, formatDateTime } from '@/lib/utils'
import type { ChatMessage } from '@/lib/db/dynamo'

interface ChatBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-muted-foreground italic bg-secondary px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  if (message.type === 'ai_response') {
    return (
      <div className="flex gap-3 my-3 max-w-xl mx-auto w-full">
        <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0 mt-1">
          AI
        </div>
        <div className="flex-1">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 ml-1">
            NexusB2B AI · {formatDateTime(message.created_at)}
          </span>
        </div>
      </div>
    )
  }

  if (message.type === 'receipt_ref') {
    return (
      <div className={cn('flex my-3', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="max-w-xs bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</span>
          </div>
          <p className="text-sm text-foreground">{message.content}</p>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {formatDateTime(message.created_at)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 my-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5',
          isOwn
            ? 'bg-surface text-white rounded-br-sm'
            : 'bg-secondary text-foreground rounded-bl-sm'
        )}
      >
        {!isOwn && (
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">
            {message.sender_name} · {message.sender_business}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <span className={cn(
          'text-[10px] mt-1 block',
          isOwn ? 'text-white/60 text-right' : 'text-muted-foreground'
        )}>
          {formatDateTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}
