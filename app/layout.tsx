import type { Metadata } from 'next'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'NexusB2B — Find. Connect. Deal.',
    template: '%s | NexusB2B',
  },
  description:
    'The verified B2B discovery and AI-mediated deal platform. Find global business partners, connect instantly, and transact securely — without leaving.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
