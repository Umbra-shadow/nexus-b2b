'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  description: string
  qty: number
  unitPrice: number
}

export default function NewReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [items, setItems] = useState<LineItem[]>([{ description: '', qty: 1, unitPrice: 0 }])
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  function addItem() {
    setItems([...items, { description: '', qty: 1, unitPrice: 0 }])
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.some((i) => !i.description.trim())) {
      setError('All line items need a description.')
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        items: items.map((i) => ({
          description: i.description,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
        })),
        currency,
        taxRate: taxRate / 100,
        notes: notes || undefined,
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to create receipt.')
      return
    }

    router.push(`/sessions/${sessionId}`)
  }

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'NGN', 'KES', 'ZAR', 'GHS', 'XOF']

  return (
    <div className="container-app py-8 max-w-2xl space-y-6">
      <Link
        href={`/sessions/${sessionId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to session
      </Link>

      <div>
        <h1 className="text-heading text-foreground">Create Receipt</h1>
        <p className="text-muted-foreground mt-1">This receipt will be shared directly into the deal session.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency */}
        <div className="card-base space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="space-y-1.5 w-32">
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-base"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 w-32">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card-base space-y-4">
          <h2 className="font-semibold text-foreground">Line items</h2>

          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_110px_auto] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit price</span>
              <span />
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid sm:grid-cols-[1fr_80px_110px_auto] gap-3 items-center">
                <div>
                  <Label className="sm:hidden mb-1 block">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Service or product description"
                    required
                  />
                </div>
                <div>
                  <Label className="sm:hidden mb-1 block">Qty</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="sm:hidden mb-1 block">Unit price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 mt-auto mb-1 ml-1"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" /> Add line item
          </Button>
        </div>

        {/* Totals */}
        <div className="card-base">
          <div className="space-y-2 text-sm ml-auto w-full sm:w-72">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-mono">{formatCurrency(tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card-base space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            rows={3}
            maxLength={1000}
            className="input-base resize-none"
            placeholder="Payment terms, delivery details, reference number…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Link href={`/sessions/${sessionId}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Send to Session
          </Button>
        </div>
      </form>
    </div>
  )
}
