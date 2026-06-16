import Link from 'next/link'
import { ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateToken, markTokenUsed } from '@/lib/auth/tokens'
import { query } from '@/lib/db/aurora'

interface Props {
  params: Promise<{ token: string }>
}

export default async function VerifyEmailPage({ params }: Props) {
  const { token } = await params
  const result = await validateToken(token, 'email_verify')

  if (!result) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="card-base max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Invalid or expired link</h1>
          <p className="text-sm text-muted-foreground">
            This verification link has expired or already been used. Please request a new one.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Back to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  await query(`UPDATE users SET email_verified = true WHERE id = $1`, [result.userId])
  await markTokenUsed(result.tokenId)

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="card-base max-w-md w-full text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-green-600 mx-auto" />
        <h1 className="text-xl font-semibold text-foreground">Email verified!</h1>
        <p className="text-sm text-muted-foreground">
          Your email has been verified. You can now sign in to your NexusB2B account.
          Your business registration is under review — we'll notify you once approved.
        </p>
        <Link href="/auth/login">
          <Button className="w-full">Sign In</Button>
        </Link>
      </div>
    </div>
  )
}
