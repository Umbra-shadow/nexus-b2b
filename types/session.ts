import type { Business } from './business'
import type { User } from './user'

export type SessionStatus = 'pending' | 'active' | 'closed'

export interface Session {
  id: string
  initiatorAgentId: string
  receiverAgentId?: string | null
  initiatorBusinessId: string
  receiverBusinessId: string
  status: SessionStatus
  aiIntroduced: boolean
  invitationToken: string
  searchContext?: string | null
  invitationSentAt?: string | null
  acceptedAt?: string | null
  closedAt?: string | null
  createdAt: string
}

export interface SessionWithDetails extends Session {
  initiatorBusiness: Business
  receiverBusiness: Business
  initiatorAgent: Pick<User, 'id' | 'name' | 'email'>
  receiverAgent?: Pick<User, 'id' | 'name' | 'email'> | null
}
