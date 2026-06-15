'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, ChevronRight, ChevronLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegisterBusinessSchema, RegisterUserSchema, INDUSTRIES } from '@/lib/validators'
import { COUNTRIES } from '@/lib/constants/countries'
import type { z } from 'zod'

type BusinessData = z.infer<typeof RegisterBusinessSchema>
type UserData = z.infer<typeof RegisterUserSchema>

const STEPS = ['Business Details', 'Your Account']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const bizForm = useForm<BusinessData>({ resolver: zodResolver(RegisterBusinessSchema) })
  const userForm = useForm<UserData>({ resolver: zodResolver(RegisterUserSchema) })

  async function onBizSubmit(data: BusinessData) {
    setBusinessData(data)
    setStep(1)
  }

  async function onUserSubmit(data: UserData) {
    if (!businessData) return
    setSubmitting(true)
    setServerError(null)

    try {
      const fd = new FormData()
      fd.append('business', JSON.stringify(businessData))
      fd.append('user', JSON.stringify({ name: data.name, email: data.email, password: data.password }))
      if (logoFile) fd.append('logo', logoFile)
      if (docFile) fd.append('doc', docFile)

      const res = await fetch('/api/auth/register', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error ?? 'Registration failed. Please try again.')
        return
      }

      router.push('/auth/register/success')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">NexusB2B</span>
      </Link>

      <div className="card-base w-full max-w-lg">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                i === step
                  ? 'bg-brand-brown text-white'
                  : i < step
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary border border-border text-muted-foreground'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">
            {serverError}
          </div>
        )}

        {/* Step 1: Business */}
        {step === 0 && (
          <form onSubmit={bizForm.handleSubmit(onBizSubmit)} className="space-y-4" noValidate>
            <h1 className="text-2xl font-semibold text-foreground">Register your business</h1>
            <p className="text-sm text-muted-foreground">
              Tell us about your company. All registrations are verified before appearing in search.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business name *</Label>
              <Input id="businessName" placeholder="Acme Corporation" {...bizForm.register('businessName')} />
              {bizForm.formState.errors.businessName && (
                <p className="text-xs text-destructive">{bizForm.formState.errors.businessName.message}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry *</Label>
                <select
                  id="industry"
                  className="input-base capitalize"
                  {...bizForm.register('industry')}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="capitalize">{ind}</option>
                  ))}
                </select>
                {bizForm.formState.errors.industry && (
                  <p className="text-xs text-destructive">{bizForm.formState.errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country *</Label>
                <select id="country" className="input-base" {...bizForm.register('country')}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                {bizForm.formState.errors.country && (
                  <p className="text-xs text-destructive">{bizForm.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Berlin" {...bizForm.register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" placeholder="https://acme.com" {...bizForm.register('website')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                maxLength={500}
                className="input-base resize-none"
                placeholder="What does your business do? (max 500 chars)"
                {...bizForm.register('description')}
              />
            </div>

            {/* Logo upload */}
            <div className="space-y-1.5">
              <Label>Company logo (PNG/JPG, max 2MB)</Label>
              <label className="flex items-center gap-3 border border-dashed border-border rounded-md px-4 py-3 cursor-pointer hover:bg-secondary transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {logoFile ? logoFile.name : 'Click to upload logo'}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Verification doc */}
            <div className="space-y-1.5">
              <Label>Business verification document (PDF, max 5MB) *</Label>
              <p className="text-xs text-muted-foreground">Certificate of Incorporation or Business License</p>
              <label className="flex items-center gap-3 border border-dashed border-border rounded-md px-4 py-3 cursor-pointer hover:bg-secondary transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {docFile ? docFile.name : 'Click to upload PDF'}
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept="application/pdf"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <Button type="submit" className="w-full gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Step 2: User account */}
        {step === 1 && (
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4" noValidate>
            <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              You'll be the Business Admin for <strong>{businessData?.businessName}</strong>.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" placeholder="Jane Doe" {...userForm.register('name')} />
              {userForm.formState.errors.name && (
                <p className="text-xs text-destructive">{userForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work email *</Label>
              <Input id="email" type="email" placeholder="jane@acme.com" {...userForm.register('email')} />
              {userForm.formState.errors.email && (
                <p className="text-xs text-destructive">{userForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" placeholder="Min 12 chars, 1 uppercase, 1 number" {...userForm.register('password')} />
              {userForm.formState.errors.password && (
                <p className="text-xs text-destructive">{userForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password *</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat password" {...userForm.register('confirmPassword')} />
              {userForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{userForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Registering…' : 'Create Account'}
              </Button>
            </div>
          </form>
        )}

        <p className="text-sm text-center text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-brown font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
