import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, StepGrid, FeatureRows, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Sessions',
  description: 'Structured deal rooms for verified businesses. Sessions keep negotiation, messages, AI-mediated intros and receipts in one auditable thread.',
}

export default function SessionsInfoPage() {
  return (
    <InfoPage
      eyebrow="/ Platform / Sessions"
      title="Sessions"
      lede="A session is a structured deal room between two verified companies. Every message, introduction and receipt lives in one auditable thread — from first hello to signed deal."
    >
      <div>
        <SectionTitle>Negotiation with a paper trail</SectionTitle>
        <Prose>
          <p>
            Email threads fork, get forwarded, and lose context. A NexusB2B session replaces the scattered inbox with a
            single room scoped to exactly two businesses. Both sides see the same timeline, the same attachments, and the
            same receipts — there is one version of the truth.
          </p>
          <p>
            Sessions open from a discovery profile, run through negotiation, and close when the deal is done or abandoned.
            Nothing is lost when a session closes; it becomes a permanent, read-only record.
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>The lifecycle of a deal</SectionTitle>
        <StepGrid
          steps={[
            { n: '01', title: 'Request', body: 'One company invites another into a session from a verified profile or a shared invite link.' },
            { n: '02', title: 'Negotiate', body: 'Both sides exchange messages, terms and documents inside a single shared thread.' },
            { n: '03', title: 'Transact', body: 'Issue receipts directly inside the session so the commercial record stays attached to the conversation.' },
            { n: '04', title: 'Close', body: 'Archive the session as a permanent, read-only record once the deal is settled.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>Built into every session</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Two-party scoping', body: 'Each session is locked to the two businesses involved. No accidental forwards, no leaking context to outsiders.' },
            { title: 'AI-mediated introductions', body: 'When a session opens, an AI introducer can summarize both companies so the first message starts with shared context.' },
            { title: 'Inline receipts', body: 'Receipts are issued and acknowledged without leaving the room, keeping the commercial trail beside the conversation.' },
            { title: 'Immutable history', body: 'Closing a session freezes it. The record stays available for audit, compliance and future reference.' },
          ]}
        />
      </div>

      <CtaBand heading="Open your first session" sub="Move from a verified profile to a structured deal room in a single click." />
    </InfoPage>
  )
}
