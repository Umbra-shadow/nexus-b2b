import { z } from 'zod'

export const INDUSTRIES = [
  'technology', 'finance', 'healthcare', 'manufacturing',
  'logistics', 'retail', 'energy', 'agriculture', 'legal', 'other',
] as const

export const RegisterBusinessSchema = z.object({
  businessName: z.string().min(2).max(100),
  industry: z.enum(INDUSTRIES),
  country: z.string().length(2),
  city: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
})

export const RegisterUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const SearchSchema = z.object({
  q: z.string().min(1).max(500),
  country: z.string().length(2).optional(),
  industry: z.enum(INDUSTRIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export const CreateSessionSchema = z.object({
  receiverBusinessId: z.string().uuid(),
  searchContext: z.string().max(500).optional(),
})

export const ReceiptItemSchema = z.object({
  description: z.string().min(1).max(200),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative(),
})

export const CreateReceiptSchema = z.object({
  items: z.array(ReceiptItemSchema).min(1),
  currency: z.string().length(3).default('USD'),
  taxRate: z.number().min(0).max(1).default(0),
  notes: z.string().max(1000).optional(),
})

export const InviteTeamSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['business_admin', 'business_agent']).default('business_agent'),
})

export const UpdateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  bankAccountName: z.string().max(200).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankName: z.string().max(100).optional(),
  bankSwift: z.string().max(20).optional(),
})

export const AIQuerySchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().uuid(),
})

// Server-side user schema (ZodEffects from .refine() doesn't support .omit())
export const RegisterUserServerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(12),
})
