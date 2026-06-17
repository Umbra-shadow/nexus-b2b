export type Industry =
  | 'technology' | 'finance' | 'healthcare' | 'manufacturing'
  | 'logistics' | 'retail' | 'energy' | 'agriculture' | 'legal' | 'other'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface Business {
  id: string
  name: string
  slug: string
  industry: Industry
  country: string
  city?: string | null
  description?: string | null
  website?: string | null
  logoS3Key?: string | null
  logoUrl?: string | null
  verificationStatus: VerificationStatus
  services?: string[]
  createdAt: string
}

export interface BusinessWithBankDetails extends Business {
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankName?: string | null
  bankSwift?: string | null
}

export interface BusinessSearchResult {
  id: string
  name: string
  slug: string
  industry: Industry
  country: string
  city?: string | null
  description?: string | null
  logoUrl?: string | null
  verificationStatus: VerificationStatus
  services?: string[]
}
