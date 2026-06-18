'use client'

import { useEffect, useState } from 'react'
import { Loader2, FileDown, Check } from 'lucide-react'

interface ReceiptRow {
  id: string
  status: string
  total: string | number
  currency: string
  created_at: string
  issuer_name: string
  receiver_name: string
}

export default function DataSettingsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[] | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/receipts').then((r) => (r.ok ? r.json() : { receipts: [] })),
      fetch('/api/businesses/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([rec, biz]) => {
        setReceipts(rec.receipts ?? [])
        if (biz?.business?.name) setBusinessName(biz.business.name)
      })
      .catch(() => setError('Failed to load your receipts.'))
      .finally(() => setLoading(false))
  }, [])

  async function downloadAllPdf() {
    if (!receipts || receipts.length === 0) return
    setGenerating(true)
    setError(null)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const TERRACOTTA: [number, number, number] = [196, 75, 27]

      // Header band
      doc.setFillColor(...TERRACOTTA)
      doc.rect(0, 0, pageWidth, 6, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(20, 20, 20)
      doc.text('NEXUSB2B', 40, 56)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(110, 110, 110)
      doc.text('Consolidated Receipt Statement', 40, 74)

      // Meta
      doc.setFontSize(9)
      doc.setTextColor(140, 140, 140)
      const generatedOn = new Date().toLocaleString()
      doc.text(`Business: ${businessName || '—'}`, 40, 100)
      doc.text(`Generated: ${generatedOn}`, 40, 114)
      doc.text(`Total receipts: ${receipts.length}`, 40, 128)

      // Totals summary by currency
      const totalsByCurrency = receipts.reduce<Record<string, number>>((acc, r) => {
        const n = typeof r.total === 'string' ? parseFloat(r.total) : r.total
        acc[r.currency] = (acc[r.currency] ?? 0) + (isNaN(n) ? 0 : n)
        return acc
      }, {})
      const summaryText = Object.entries(totalsByCurrency)
        .map(([cur, sum]) => `${cur} ${sum.toFixed(2)}`)
        .join('   ·   ')
      doc.setTextColor(...TERRACOTTA)
      doc.setFont('helvetica', 'bold')
      doc.text(`Lifetime value: ${summaryText || '—'}`, 40, 146)

      // Table
      autoTable(doc, {
        startY: 168,
        head: [['Date', 'Receipt ID', 'Issuer', 'Receiver', 'Status', 'Amount']],
        body: receipts.map((r) => {
          const n = typeof r.total === 'string' ? parseFloat(r.total) : r.total
          return [
            new Date(r.created_at).toLocaleDateString(),
            r.id.slice(0, 8),
            r.issuer_name,
            r.receiver_name,
            r.status.toUpperCase(),
            `${r.currency} ${(isNaN(n) ? 0 : n).toFixed(2)}`,
          ]
        }),
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: [40, 40, 40] },
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [246, 243, 238] },
        columnStyles: { 5: { halign: 'right' } },
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
          const ph = doc.internal.pageSize.getHeight()
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.setFont('helvetica', 'normal')
          doc.text('NexusB2B — verified deal room. Demonstration build; figures are illustrative.', 40, ph - 24)
        },
      })

      doc.save(`nexusb2b-receipts-${new Date().toISOString().slice(0, 10)}.pdf`)
      setDone(true)
      setTimeout(() => setDone(false), 3500)
    } catch (e) {
      console.log('[v0] PDF generation error:', (e as Error).message)
      setError('Could not generate the PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const count = receipts?.length ?? 0

  return (
    <div style={{ padding: '28px 20px', maxWidth: 760, animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Settings / Data</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>DATA & EXPORTS</h1>
      </div>

      {error && (
        <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Receipt export card */}
      <div style={{ border: '1px solid var(--nx-border)', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Receipts</div>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6, marginBottom: 20 }}>
            Download every receipt your business has ever issued or received as a single, consolidated PDF statement —
            complete with a lifetime value summary and a full itemized table.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', border: '1px solid var(--nx-line)', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>
              {loading ? '—' : count}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
              {count === 1 ? 'receipt on record' : 'receipts on record'}
            </div>
          </div>

          <button
            onClick={downloadAllPdf}
            disabled={loading || generating || count === 0}
            style={{
              background: count > 0 ? '#c44b1b' : 'var(--nx-raised)',
              color: count > 0 ? '#ffffff' : 'var(--nx-muted)',
              border: '1px solid',
              borderColor: count > 0 ? '#c44b1b' : 'var(--nx-border)',
              padding: '13px 22px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: loading || generating || count === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: 'fit-content',
            }}
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : done ? <Check size={13} /> : <FileDown size={13} />}
            {generating ? 'Generating…' : done ? 'Downloaded' : 'Download all receipts (PDF)'}
          </button>

          {!loading && count === 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-subtle)', marginTop: 12 }}>
              You have no receipts yet. They will appear here once you issue or receive one in a session.
            </p>
          )}
        </div>
      </div>

      {/* Account data note */}
      <div style={{ border: '1px solid var(--nx-border)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Account data</div>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6 }}>
            To permanently delete your account and all associated data, visit the{' '}
            <a href="/settings/account" style={{ color: '#c44b1b', textDecoration: 'none' }}>Account</a> tab&apos;s danger zone.
            Account deletion is irreversible.
          </p>
        </div>
      </div>
    </div>
  )
}
