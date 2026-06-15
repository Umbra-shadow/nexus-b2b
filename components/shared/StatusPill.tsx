import { cn } from '@/lib/utils'
import type { SessionStatus } from '@/types/session'

const STATUS_CONFIG = {
  pending: {
    dot: 'bg-status-pending',
    pill: 'bg-orange-100 text-orange-700',
    label: 'Pending',
  },
  active: {
    dot: 'bg-status-active',
    pill: 'bg-green-100 text-green-700',
    label: 'Active',
  },
  closed: {
    dot: 'bg-status-closed',
    pill: 'bg-red-100 text-red-700',
    label: 'Closed',
  },
}

interface StatusPillProps {
  status: SessionStatus
  className?: string
  showDot?: boolean
}

export function StatusPill({ status, className, showDot = true }: StatusPillProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.pill,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', config.dot)}
          aria-hidden
        />
      )}
      {config.label}
    </span>
  )
}
