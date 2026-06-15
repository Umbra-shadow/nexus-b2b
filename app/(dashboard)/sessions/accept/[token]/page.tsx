'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AcceptSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = params.token as string

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    async function accept() {
      const res = await fetch(`/api/sessions/accept/${token}`, { method: 'POST' })
      const json = await res.json()

      if (res.ok) {
        setSessionId(json.sessionId)
        setState('success')
        setTimeout(() => router.push(`/sessions/${json.sessionId}`), 2000)
      } else {
        setError(json.error ?? 'Failed to accept session')
        setState('error')
      }
    }

    accept()
  }, [token, status, router])

  return (
    <div className="container-app py-20 flex items-center justify-center">
      <div className="card-base max-w-md w-full text-center space-y-4">
        {state === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-brand-brown mx-auto" />
            <p className="text-muted-foreground">Accepting session…</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
            <h1 className="text-xl font-semibold">Session accepted!</h1>
            <p className="text-muted-foreground">Redirecting you to the deal session…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Could not accept session</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link href="/sessions">
              <Button variant="outline" className="w-full">View your sessions</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
