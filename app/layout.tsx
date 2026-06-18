import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

// Headline weight — Didone Black for the large editorial headings
const playfairBlack = Playfair_Display({
  subsets: ['latin'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

// Body serif — Playfair Display regular/medium for readable text
const playfairBody = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

// Label / UI sans-serif — Inter replaces JetBrains Mono
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'NexusB2B — Find. Connect. Deal.',
    template: '%s | NexusB2B',
  },
  description:
    'The verified B2B discovery and AI-mediated deal platform. Find global business partners, connect instantly, and transact securely — without leaving.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfairBlack.variable} ${playfairBody.variable} ${inter.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
