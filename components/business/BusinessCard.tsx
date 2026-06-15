import Link from 'next/link'
import { MapPin, Globe, ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { IndustryBadge } from '@/components/shared/IndustryBadge'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Button } from '@/components/ui/button'
import { truncate } from '@/lib/utils'
import type { BusinessSearchResult } from '@/types/business'

interface BusinessCardProps {
  business: BusinessSearchResult
  onStartSession?: (businessId: string) => void
}

export function BusinessCard({ business, onStartSession }: BusinessCardProps) {
  return (
    <div className="card-base flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          name={business.name}
          src={business.logoUrl}
          size="md"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/discovery/${business.slug}`}
              className="font-semibold text-foreground hover:text-brand-brown transition-colors truncate"
            >
              {business.name}
            </Link>
            {business.verificationStatus === 'verified' && (
              <VerifiedBadge />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <IndustryBadge industry={business.industry} />
            {(business.city || business.country) && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" aria-hidden />
                {[business.city, business.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {business.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncate(business.description, 140)}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border">
        <Link
          href={`/discovery/${business.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View profile <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {onStartSession && (
          <Button
            size="sm"
            onClick={() => onStartSession(business.id)}
          >
            Start Session
          </Button>
        )}
      </div>
    </div>
  )
}
