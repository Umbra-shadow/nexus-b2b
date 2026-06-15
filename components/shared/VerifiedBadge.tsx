import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function VerifiedBadge({ className, size = 'sm' }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-green-700 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className
      )}
      title="Verified Business"
    >
      <ShieldCheck className={cn('shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} aria-hidden />
      Verified
    </span>
  )
}
