'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BusinessData {
  name: string
  description: string
  city: string
  website: string
  bank_account_name: string
  bank_account_number: string
  bank_name: string
  bank_swift: string
}

export default function BusinessSettingsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/businesses/me')
      .then((r) => r.json())
      .then((json) => { setData(json.business); setLoading(false) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSaving(true)
    await fetch('/api/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const isAdmin = session?.user?.role === 'business_admin'

  return (
    <div className="container-app py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-heading text-foreground">Business Settings</h1>
        <p className="text-muted-foreground mt-1">Update your company profile and banking details</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3">
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card-base space-y-4">
          <h2 className="font-semibold text-foreground">Company profile</h2>

          <div className="space-y-1.5">
            <Label>Business name</Label>
            <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              rows={3}
              maxLength={500}
              className="input-base resize-none"
              value={data.description ?? ''}
              onChange={(e) => setData({ ...data, description: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={data.city ?? ''} onChange={(e) => setData({ ...data, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input type="url" value={data.website ?? ''} onChange={(e) => setData({ ...data, website: e.target.value })} />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="card-base space-y-4">
            <div>
              <h2 className="font-semibold text-foreground">Banking details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shown only to counterparties when they receive a receipt from you. Encrypted at rest.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Account holder name</Label>
                <Input value={data.bank_account_name ?? ''} onChange={(e) => setData({ ...data, bank_account_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Account number / IBAN</Label>
                <Input value={data.bank_account_number ?? ''} onChange={(e) => setData({ ...data, bank_account_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bank name</Label>
                <Input value={data.bank_name ?? ''} onChange={(e) => setData({ ...data, bank_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SWIFT / BIC</Label>
                <Input value={data.bank_swift ?? ''} onChange={(e) => setData({ ...data, bank_swift: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </form>
    </div>
  )
}
