'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/shared/Avatar'

export default function AccountSettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name)
  }, [session])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setError(null)

    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    setSavingProfile(false)
    if (res.ok) {
      await update({ name })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to update profile')
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return }
    if (newPassword.length < 12) { setError('New password must be at least 12 characters'); return }

    setSavingPassword(true)
    setError(null)

    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    setSavingPassword(false)
    if (res.ok) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to update password')
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container-app py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-heading text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal profile and password</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      {/* Profile */}
      <form onSubmit={handleProfileSave} className="card-base space-y-4">
        <h2 className="font-semibold text-foreground">Profile</h2>

        {profileSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-2">
            Profile updated.
          </div>
        )}

        <div className="flex items-center gap-4">
          <Avatar name={name || session.user.name} size="lg" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{session.user.email}</p>
            <p className="capitalize">{(session.user as { role?: string }).role?.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <Button type="submit" disabled={savingProfile} className="gap-2">
          {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Profile
        </Button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordSave} className="card-base space-y-4">
        <h2 className="font-semibold text-foreground">Change Password</h2>

        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-2">
            Password changed successfully.
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Min 12 chars, 1 uppercase, 1 number"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={savingPassword} className="gap-2">
          {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
          Change Password
        </Button>
      </form>
    </div>
  )
}
