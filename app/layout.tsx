import type { Metadata } from 'next'
import { Bebas_Neue, Crimson_Pro, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
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
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${bebasNeue.variable} ${crimsonPro.variable} ${jetbrainsMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
