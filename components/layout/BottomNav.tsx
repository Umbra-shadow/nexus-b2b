'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageSquare, Users, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/discovery', label: 'Discovery', icon: Search },
  { href: '/sessions', label: 'Sessions', icon: MessageSquare },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/receipts', label: 'Receipts', icon: FileText },
  { href: '/settings/business', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-md min-w-[44px] transition-colors',
                active ? 'text-brand-brown' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
