export type UserRole = 'business_admin' | 'business_agent'
export type PlatformRole = 'platform_admin' | UserRole

export interface User {
  id: string
  businessId: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      businessId: string
      emailVerified: boolean
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
    businessId?: string
    emailVerified?: boolean
    hydrated?: boolean
  }
}
