'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginSchema } from '@/lib/validators'
import type { z } from 'zod'

type LoginFormData = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(LoginSchema) })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError('Invalid email or password. Please check your credentials.')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">NexusB2B</span>
      </Link>

      <div className="card-base w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your business account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-brand-brown hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          No account?{' '}
          <Link href="/auth/register" className="text-brand-brown font-medium hover:underline">
            Register your business
          </Link>
        </p>
      </div>
    </div>
  )
}
