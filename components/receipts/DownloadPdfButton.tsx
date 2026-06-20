'use client'

import { useState } from 'react'

export function DownloadPdfButton({ receiptId }: { receiptId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  async function download() {
    setState('loading')
    try {
      const res = await fetch(`/api/receipts/${receiptId}/pdf`, { credentials: 'include' })
      if (!res.ok) {
        const text = await res.text()
        console.error('[pdf] server error:', text)
        setState('error')
        setTimeout(() => setState('idle'), 3000)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${receiptId.slice(0, 8).toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setState('idle')
    } catch (err) {
      console.error('[pdf] fetch failed:', err)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={download}
      disabled={state === 'loading'}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: state === 'error' ? '#8b1c1c' : '#c44b1b',
        border: `1px solid ${state === 'error' ? 'rgba(139,28,28,0.4)' : 'rgba(196,75,27,0.4)'}`,
        padding: '12px 20px',
        background: 'none',
        cursor: state === 'loading' ? 'wait' : 'pointer',
        whiteSpace: 'nowrap',
        opacity: state === 'loading' ? 0.6 : 1,
      }}
    >
      {state === 'loading' ? '… Generating' : state === 'error' ? '✕ Failed — retry' : '⬇ Download PDF'}
    </button>
  )
}
