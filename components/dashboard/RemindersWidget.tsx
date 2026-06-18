'use client'

import { useEffect, useRef, useState } from 'react'

interface Reminder {
  id: string
  title: string
  note: string | null
  remind_at: string
  user_name: string
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function urgencyStyle(days: number): { border: string; bg: string; dot: string; label: string } {
  if (days < 0) return { border: 'var(--nx-border)', bg: 'var(--nx-panel)', dot: 'var(--nx-muted)', label: 'Overdue' }
  if (days === 0) return { border: 'rgba(196,75,27,0.5)', bg: 'rgba(196,75,27,0.06)', dot: '#c44b1b', label: 'Today' }
  if (days <= 2) return { border: 'rgba(200,162,64,0.5)', bg: 'rgba(200,162,64,0.06)', dot: '#c8a240', label: `${days}d` }
  if (days <= 7) return { border: 'rgba(90,154,122,0.35)', bg: 'rgba(90,154,122,0.04)', dot: '#5a9a7a', label: `${days}d` }
  return { border: 'var(--nx-border)', bg: 'var(--nx-panel)', dot: 'var(--nx-muted)', label: `${days}d` }
}

function formatRemindAt(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function RemindersWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function load() {
    const r = await fetch('/api/reminders')
    if (r.ok) setReminders(await r.json())
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    setSaving(true)
    const r = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, note, remind_at: date }),
    })
    setSaving(false)
    if (r.ok) {
      setTitle(''); setNote(''); setDate(''); setOpen(false)
      load()
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ marginTop: 24, border: '1px solid var(--nx-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: open || reminders.length > 0 ? '1px solid var(--nx-border)' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)' }}>
            Reminders
          </span>
          {reminders.length > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', background: 'rgba(196,75,27,0.10)', padding: '2px 7px' }}>
              {reminders.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid rgba(196,75,27,0.3)', background: 'none', padding: '5px 12px', cursor: 'pointer' }}
        >
          {open ? '✕ Cancel' : '＋ Add'}
        </button>
      </div>

      {/* Add form */}
      {open && (
        <form onSubmit={handleAdd} style={{ padding: '18px 24px', borderBottom: '1px solid var(--nx-border)', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end', background: 'var(--nx-raised)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Reminder</span>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contact Dentist Corp"
              required
              style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Date</span>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: '#c44b1b', border: 'none', padding: '10px 18px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap', marginBottom: 1 }}
          >
            {saving ? '…' : 'Save →'}
          </button>
          <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any details..."
              style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
            />
          </label>
        </form>
      )}

      {/* Reminder cards */}
      {reminders.length === 0 && !open ? (
        <div style={{ padding: '20px 24px', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
          No reminders yet — add one to stay on top of upcoming contacts.
        </div>
      ) : reminders.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'var(--nx-border)' }}>
          {reminders.map((r) => {
            const days = daysUntil(r.remind_at)
            const u = urgencyStyle(days)
            return (
              <div
                key={r.id}
                style={{ padding: '16px 20px', background: u.bg, border: `1px solid ${u.border}`, margin: -0.5, position: 'relative' }}
              >
                {/* Urgency dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9999, background: u.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: u.dot }}>
                    {u.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginLeft: 'auto' }}>
                    {formatRemindAt(r.remind_at)}
                  </span>
                </div>
                {/* Title */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--nx-fg-strong)', lineHeight: 1.2, marginBottom: r.note ? 6 : 10 }}>
                  {r.title}
                </div>
                {r.note && (
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-muted)', lineHeight: 1.45, marginBottom: 10 }}>
                    {r.note}
                  </div>
                )}
                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', letterSpacing: '0.06em' }}>
                    by {r.user_name.split(' ')[0]}
                  </span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    title="Remove reminder"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
