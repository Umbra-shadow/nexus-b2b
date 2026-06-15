import type { Business } from './business'

export type ReceiptStatus = 'draft' | 'sent' | 'acknowledged'

export interface ReceiptItem {
  description: string
  qty: number
  unitPrice: number
  total: number
}

export interface Receipt {
  id: string
  sessionId: string
  issuerBusinessId: string
  receiverBusinessId: string
  items: ReceiptItem[]
  subtotal: number
  taxRate: number
  total: number
  currency: string
  notes?: string | null
  status: ReceiptStatus
  createdAt: string
}

export interface ReceiptWithBusinesses extends Receipt {
  issuerBusiness: Business
  receiverBusiness: Business
}
