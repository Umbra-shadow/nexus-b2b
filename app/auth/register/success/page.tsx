import Link from 'next/link'
import { Mail, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">NexusB2B</span>
      </Link>

      <div className="card-base w-full max-w-md text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-brand-brown/10 flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-brand-brown" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            We've sent a verification link to your email address. Click it to activate your account.
          </p>
        </div>

        <div className="bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground text-left space-y-1">
          <p>After verifying your email:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Our team will review your business verification document</li>
            <li>You'll receive an email once your business is approved</li>
            <li>Approved businesses appear in search results immediately</li>
          </ul>
        </div>

        <Link href="/auth/login">
          <Button variant="outline" className="w-full">Go to Login</Button>
        </Link>
      </div>
    </div>
  )
}
