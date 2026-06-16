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
        if (!user.email_verified) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business_id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
        token.businessId = (user as User).businessId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = (token.role ?? '') as string
        session.user.businessId = (token.businessId ?? '') as string
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
