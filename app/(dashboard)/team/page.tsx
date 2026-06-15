'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, Plus, MoreVertical, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'

interface Member {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const isAdmin = session?.user?.role === 'business_admin'

  async function fetchMembers() {
    const res = await fetch('/api/team')
    if (res.ok) {
      const json = await res.json()
      setMembers(json.members)
    }
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inviteName, email: inviteEmail }),
    })
    setInviting(false)
    setInviteSuccess(true)
    setInviteName('')
    setInviteEmail('')
    setTimeout(() => setInviteSuccess(false), 3000)
  }

  async function toggleActive(memberId: string, active: boolean) {
    await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !active }),
    })
    fetchMembers()
  }

  return (
    <div className="container-app py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your business members</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(!showInvite)} className="gap-2">
            <Plus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && isAdmin && (
        <div className="card-base">
          <h2 className="font-semibold mb-4">Invite a team member</h2>
          {inviteSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-3 mb-4">
              Invitation sent successfully!
            </div>
          )}
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label>Full name</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" required />
            </div>
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label>Work email</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@company.com" required />
            </div>
            <Button type="submit" disabled={inviting} className="gap-2">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Send Invite
            </Button>
          </form>
        </div>
      )}

      {/* Members */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No team members yet.</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                  {isAdmin && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-muted-foreground">
                        {m.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${m.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && m.id !== session?.user?.id && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(m.id, m.is_active)}
                          className="text-xs text-brand-brown hover:underline"
                        >
                          {m.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
