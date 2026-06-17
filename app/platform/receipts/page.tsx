import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, StepGrid, FeatureRows, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Receipts',
  description: 'Structured, itemized receipts exchanged inside verified deal sessions. Issue, acknowledge and export a complete commercial record.',
}

export default function ReceiptsInfoPage() {
  return (
    <InfoPage
      eyebrow="/ Platform / Receipts"
      title="Receipts"
      lede="Every transaction inside a session produces a structured, itemized receipt — issued by one verified company, acknowledged by the other, and kept as a permanent commercial record."
    >
      <div>
        <SectionTitle>A commercial record, not a PDF in an inbox</SectionTitle>
        <Prose>
          <p>
            A NexusB2B receipt is a structured document: line items, quantities, unit prices, tax and totals, tied to the
            session and the two verified businesses involved. Because it is generated inside the deal room, there is no
            ambiguity about who issued it, who received it, or what was agreed.
          </p>
          <p>
            Receipts can be acknowledged by the receiving company, creating a mutual record that both parties have seen and
            accepted the terms. You can export your entire receipt history as a single PDF from account settings at any
            time.
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>From line items to record</SectionTitle>
        <StepGrid
          steps={[
            { n: '01', title: 'Itemize', body: 'Add line items with quantities and unit prices; subtotal, tax and total are calculated automatically.' },
            { n: '02', title: 'Issue', body: 'Send the receipt into the session. It is timestamped and attached to both businesses.' },
            { n: '03', title: 'Acknowledge', body: 'The receiving company confirms receipt, creating a mutual, auditable record.' },
            { n: '04', title: 'Export', body: 'Download any single receipt, or your entire history as one consolidated PDF.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>What every receipt carries</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Structured line items', body: 'Quantities, unit prices and per-line totals — not free text — so receipts are consistent and machine-readable.' },
            { title: 'Automatic totals & tax', body: 'Subtotal, configurable tax rate and grand total are computed for you, in the currency you choose.' },
            { title: 'Mutual acknowledgement', body: 'Receiving companies can formally acknowledge a receipt, turning it into a two-sided record.' },
            { title: 'Consolidated PDF export', body: 'Generate one PDF of every receipt you have ever issued or received, straight from settings.' },
          ]}
        />
      </div>

      <CtaBand heading="Keep a clean commercial trail" sub="Issue itemized receipts inside every deal and export them whenever you need." />
    </InfoPage>
  )
}
