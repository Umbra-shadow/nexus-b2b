import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { queryOne } from '@/lib/db/aurora'
import type { User } from '@/types/user'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await queryOne<{
          id: string
          email: string
          name: string
          password_hash: string
          role: string
          business_id: string
          is_active: boolean
          email_verified: boolean
        }>(
          `SELECT u.id, u.email, u.name, u.password_hash, u.role, u.business_id, u.is_active, u.email_verified
           FROM users u
           WHERE u.email = $1`,
          [credentials.email]
        )

        if (!user || !user.is_active) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business_id,
          emailVerified: user.email_verified,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
        token.businessId = (user as User).businessId
        token.emailVerified = (user as User).emailVerified
        token.hydrated = true
      }

      // Refresh stale JWT fields from DB:
      //  - !hydrated: old JWT issued before these fields existed (businessId missing)
      //  - emailVerified === false: re-check so verification takes effect without re-login
      if (token.sub && (!token.hydrated || token.emailVerified === false)) {
        const fresh = await queryOne<{
          business_id: string | null
          role: string
          email_verified: boolean
        }>(
          `SELECT business_id, role, email_verified FROM users WHERE id = $1`,
          [token.sub]
        )
        if (fresh) {
          if (!token.hydrated) {
            token.businessId = fresh.business_id ?? ''
            token.role = fresh.role
          }
          token.emailVerified = fresh.email_verified
          token.hydrated = true
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>
        u.id = token.sub!
        u.role = token.role ?? ''
        u.businessId = token.businessId ?? ''
        u.emailVerified = token.emailVerified ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
})
