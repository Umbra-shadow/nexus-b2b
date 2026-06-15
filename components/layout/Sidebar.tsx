'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  MessageSquare,
  Users,
  FileText,
  Settings,
  LogOut,
  Briefcase,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/discovery', label: 'Discovery', icon: Search },
  { href: '/sessions', label: 'Sessions', icon: MessageSquare },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/receipts', label: 'Receipts', icon: FileText },
  { href: '/settings/business', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-border bg-background">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">NexusB2B</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-brown text-white'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
