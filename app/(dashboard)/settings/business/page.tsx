'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/settings/account?tab=business') }, [router])
  return null
}
