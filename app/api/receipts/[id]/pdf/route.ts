import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { decrypt } from '@/lib/crypto/encrypt'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake')

interface Params { params: Promise<{ id: string }> }

interface ReceiptRow {
  id: string
  session_id: string
  status: string
  items: Array<{ description: string; unit?: string; qty: number; unitPrice: number; total: number }>
  subtotal: string
  tax_rate: string
  total: string
  currency: string
  notes: string | null
  created_at: string
  issuer_id: string
  issuer_name: string
  issuer_country: string
  receiver_id: string
  receiver_name: string
  receiver_country: string
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_swift: string | null
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

const STATUS_LABEL: Record<string, string> = {
  sent: 'Sent',
  processed: 'Processed — Awaiting Sign-off',
  completed: 'Completed',
  acknowledged: 'Completed',
  draft: 'Draft',
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const receipt = await queryOne<ReceiptRow>(`
    SELECT r.id, r.session_id, r.status,
           r.items, r.subtotal::text, r.tax_rate::text, r.total::text,
           r.currency, r.notes, r.created_at,
           ib.id as issuer_id, ib.name as issuer_name, ib.country as issuer_country,
           rb.id as receiver_id, rb.name as receiver_name, rb.country as receiver_country,
           ib.bank_account_name, ib.bank_account_number, ib.bank_name, ib.bank_swift
    FROM receipts r
    JOIN businesses ib ON ib.id = r.issuer_business_id
    JOIN businesses rb ON rb.id = r.receiver_business_id
    WHERE r.id = $1
  `, [id])

  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = session.user.businessId
  if (receipt.issuer_id !== uid && receipt.receiver_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isReceiver = receipt.receiver_id === uid
  const items = Array.isArray(receipt.items) ? receipt.items : []
  const subtotal = parseFloat(receipt.subtotal)
  const taxRate = parseFloat(receipt.tax_rate ?? '0')
  const total = parseFloat(receipt.total)
  const taxAmount = total - subtotal
  const date = new Date(receipt.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const bank = isReceiver && receipt.bank_account_number ? {
    name: receipt.bank_account_name ? decrypt(receipt.bank_account_name) : null,
    number: decrypt(receipt.bank_account_number!),
    bankName: receipt.bank_name ? decrypt(receipt.bank_name) : null,
    swift: receipt.bank_swift ? decrypt(receipt.bank_swift) : null,
  } : null

  const ACCENT = '#c44b1b'
  const MUTED = '#777777'
  const LINE = '#dddddd'

  const fonts = {
    Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' },
    Courier: { normal: 'Courier', bold: 'Courier-Bold', italics: 'Courier-Oblique', bolditalics: 'Courier-BoldOblique' },
  }

  const printer = new PdfPrinter(fonts)

  const itemRows = items.map((item) => [
    { text: item.description, font: 'Helvetica', fontSize: 10, color: '#111' },
    { text: item.unit ?? 'Units', font: 'Courier', fontSize: 9, color: MUTED },
    { text: String(item.qty), font: 'Courier', fontSize: 9, color: MUTED, alignment: 'right' },
    { text: fmt(item.unitPrice, receipt.currency), font: 'Courier', fontSize: 9, color: MUTED, alignment: 'right' },
    { text: fmt(item.qty * item.unitPrice, receipt.currency), font: 'Courier', bold: true, fontSize: 10, color: '#111', alignment: 'right' },
  ])

  const bankSection = bank ? [
    { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 0.5, lineColor: LINE }], margin: [0, 16, 0, 12] },
    { text: 'PAYMENT DETAILS', font: 'Courier', fontSize: 7, color: MUTED, letterSpacing: 2, margin: [0, 0, 0, 10] },
    {
      columns: [
        bank.name ? [
          { text: 'ACCOUNT HOLDER', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
          { text: bank.name, font: 'Helvetica', fontSize: 11, color: '#111' },
        ] : [],
        [
          { text: 'ACCOUNT / IBAN', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
          { text: bank.number, font: 'Courier', fontSize: 10, color: '#111' },
        ],
        bank.bankName ? [
          { text: 'BANK', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
          { text: bank.bankName, font: 'Helvetica', fontSize: 11, color: '#111' },
        ] : [],
        bank.swift ? [
          { text: 'SWIFT / BIC', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
          { text: bank.swift, font: 'Courier', fontSize: 10, color: '#111' },
        ] : [],
      ],
      columnGap: 20,
    },
  ] : []

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [52, 52, 52, 52],
    defaultStyle: { font: 'Helvetica', fontSize: 11, color: '#111' },
    content: [
      // Header
      {
        columns: [
          {
            stack: [
              { text: [{ text: 'NEXUS', font: 'Helvetica', bold: true, fontSize: 22, color: '#111' }, { text: 'B2B', bold: true, fontSize: 22, color: ACCENT }] },
              { text: 'VERIFIED B2B DEAL PLATFORM', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 3, 0, 0] },
            ],
          },
          {
            stack: [
              { text: 'RECEIPT', font: 'Courier', fontSize: 7, color: MUTED, alignment: 'right', margin: [0, 0, 0, 4] },
              { text: `#${receipt.id.slice(0, 8).toUpperCase()}`, font: 'Courier', bold: true, fontSize: 14, color: '#111', alignment: 'right' },
              { text: date, font: 'Courier', fontSize: 9, color: MUTED, alignment: 'right', margin: [0, 4, 0, 0] },
              { text: STATUS_LABEL[receipt.status] ?? receipt.status, font: 'Courier', fontSize: 8, color: receipt.status === 'completed' || receipt.status === 'acknowledged' ? '#5a9a7a' : ACCENT, alignment: 'right', margin: [0, 6, 0, 0] },
            ],
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 28],
      },

      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE }], margin: [0, 0, 0, 20] },

      // Parties
      {
        columns: [
          {
            stack: [
              { text: 'ISSUED BY', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 8] },
              { text: receipt.issuer_name, font: 'Helvetica', bold: true, fontSize: 16, color: '#111', margin: [0, 0, 0, 4] },
              { text: receipt.issuer_country, font: 'Courier', fontSize: 10, color: MUTED },
            ],
          },
          {
            stack: [
              { text: 'ISSUED TO', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 8] },
              { text: receipt.receiver_name, font: 'Helvetica', bold: true, fontSize: 16, color: '#111', margin: [0, 0, 0, 4] },
              { text: receipt.receiver_country, font: 'Courier', fontSize: 10, color: MUTED },
            ],
          },
        ],
        columnGap: 32,
        margin: [0, 0, 0, 28],
      },

      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE }], margin: [0, 0, 0, 0] },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: ['*', 80, 48, 80, 80],
          body: [
            [
              { text: 'DESCRIPTION', font: 'Courier', fontSize: 7, color: MUTED, border: [false, false, false, true], fillColor: '#fafafa', margin: [0, 6, 0, 6] },
              { text: 'UNIT', font: 'Courier', fontSize: 7, color: MUTED, border: [false, false, false, true], fillColor: '#fafafa', margin: [0, 6, 0, 6] },
              { text: 'QTY', font: 'Courier', fontSize: 7, color: MUTED, alignment: 'right', border: [false, false, false, true], fillColor: '#fafafa', margin: [0, 6, 0, 6] },
              { text: 'UNIT PRICE', font: 'Courier', fontSize: 7, color: MUTED, alignment: 'right', border: [false, false, false, true], fillColor: '#fafafa', margin: [0, 6, 0, 6] },
              { text: 'AMOUNT', font: 'Courier', fontSize: 7, color: MUTED, alignment: 'right', border: [false, false, false, true], fillColor: '#fafafa', margin: [0, 6, 0, 6] },
            ],
            ...itemRows.map((row) => row.map((cell) => ({ ...cell, border: [false, false, false, true], borderColor: [LINE, LINE, LINE, LINE], margin: [0, 8, 0, 8] }))),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          hLineColor: () => LINE,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
        margin: [0, 0, 0, 16],
      },

      // Totals
      {
        alignment: 'right',
        stack: [
          {
            columns: [
              { text: 'Subtotal', font: 'Courier', fontSize: 9, color: MUTED, alignment: 'right' },
              { text: fmt(subtotal, receipt.currency), font: 'Courier', fontSize: 10, color: '#111', width: 110, alignment: 'right' },
            ],
            margin: [0, 0, 0, 4],
          },
          ...(taxRate > 0 ? [{
            columns: [
              { text: `Tax (${(taxRate * 100).toFixed(0)}%)`, font: 'Courier', fontSize: 9, color: MUTED, alignment: 'right' },
              { text: fmt(taxAmount, receipt.currency), font: 'Courier', fontSize: 10, color: '#111', width: 110, alignment: 'right' },
            ],
            margin: [0, 0, 0, 4],
          }] : []),
          { canvas: [{ type: 'line', x1: 300, y1: 4, x2: 515, y2: 4, lineWidth: 1.5, lineColor: '#111' }], margin: [0, 0, 0, 8] },
          {
            columns: [
              { text: 'TOTAL', font: 'Courier', bold: true, fontSize: 11, color: '#111', alignment: 'right', letterSpacing: 1 },
              { text: fmt(total, receipt.currency), font: 'Courier', bold: true, fontSize: 16, color: '#111', width: 110, alignment: 'right' },
            ],
          },
        ],
      },

      // Notes
      ...(receipt.notes ? [
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 0.5, lineColor: LINE }], margin: [0, 20, 0, 12] },
        { text: 'NOTES', font: 'Courier', fontSize: 7, color: MUTED, margin: [0, 0, 0, 8] },
        { text: receipt.notes, font: 'Helvetica', fontSize: 10, color: '#444', lineHeight: 1.5 },
      ] : []),

      // Bank details
      ...bankSection,

      // Footer
      { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 0.5, lineColor: LINE }], margin: [0, 28, 0, 10] },
      {
        columns: [
          { text: `Issued via NexusB2B · Session ${receipt.session_id.slice(0, 8).toUpperCase()}`, font: 'Courier', fontSize: 7, color: '#aaa' },
          { text: 'nexus-b2b.vercel.app', font: 'Courier', fontSize: 7, color: '#aaa', alignment: 'right' },
        ],
      },
    ],
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks: Uint8Array[] = []

  await new Promise<void>((resolve, reject) => {
    pdfDoc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    pdfDoc.on('end', resolve)
    pdfDoc.on('error', reject)
    pdfDoc.end()
  })

  const buffer = Buffer.concat(chunks)
  const filename = `receipt-${receipt.id.slice(0, 8).toUpperCase()}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
  } catch (err) {
    console.error('[pdf/generate]', err)
    return NextResponse.json({ error: 'PDF generation failed', detail: String(err) }, { status: 500 })
  }
}
