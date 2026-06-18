'use client'

import { useState, useRef } from 'react'

export function DeleteBusinessButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (confirming) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        border: '1px solid rgba(196,75,27,0.35)',
        background: 'rgba(196,75,27,0.04)',
        padding: '10px 16px',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b', whiteSpace: 'nowrap' }}>
          Delete &ldquo;{name}&rdquo;?
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-muted)', whiteSpace: 'nowrap' }}>
          Cannot be undone.
        </div>
        <form ref={formRef} action={`/api/admin/businesses/${id}`} method="POST" style={{ display: 'contents' }}>
          <input type="hidden" name="_method" value="DELETE" />
          <button
            type="submit"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '7px 16px', border: 'none', background: '#c44b1b', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ✕ Yes, delete
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '7px 14px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)',
            background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
        padding: '9px 16px', border: '1px solid rgba(196,75,27,0.4)', color: '#c44b1b',
        background: 'rgba(196,75,27,0.06)', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      ✕ Delete Business
    </button>
  )
}

export function DeleteUserButton({ id, name, businessId }: { id: string; name: string; businessId: string }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1px solid rgba(196,75,27,0.3)',
        background: 'rgba(196,75,27,0.04)',
        padding: '5px 10px',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c44b1b', whiteSpace: 'nowrap' }}>
          Remove {name}?
        </span>
        <form action={`/api/admin/users/${id}`} method="POST" style={{ display: 'contents' }}>
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="redirectTo" value={`/admin/users/${businessId}`} />
          <button
            type="submit"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '4px 10px', border: 'none', background: '#c44b1b', color: '#fff', cursor: 'pointer',
            }}
          >
            Yes
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 10px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)',
            background: 'none', cursor: 'pointer',
          }}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '5px 10px', border: '1px solid rgba(196,75,27,0.35)', color: '#c44b1b',
        background: 'rgba(196,75,27,0.04)', cursor: 'pointer',
      }}
    >
      Delete
    </button>
  )
}
