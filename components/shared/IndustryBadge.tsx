import { cn } from '@/lib/utils'
import type { Industry } from '@/types/business'

const INDUSTRY_COLORS: Record<Industry, string> = {
  technology: 'bg-blue-100 text-blue-700',
  finance: 'bg-emerald-100 text-emerald-700',
  healthcare: 'bg-pink-100 text-pink-700',
  manufacturing: 'bg-yellow-100 text-yellow-700',
  logistics: 'bg-purple-100 text-purple-700',
  retail: 'bg-orange-100 text-orange-700',
  energy: 'bg-amber-100 text-amber-700',
  agriculture: 'bg-lime-100 text-lime-700',
  legal: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-700',
}

interface IndustryBadgeProps {
  industry: Industry
  className?: string
}

export function IndustryBadge({ industry, className }: IndustryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        INDUSTRY_COLORS[industry],
        className
      )}
    >
      {industry}
    </span>
  )
}
