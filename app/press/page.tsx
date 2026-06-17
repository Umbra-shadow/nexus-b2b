import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, FeatureRows, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Press',
  description: 'Press and media resources for NexusB2B — the verified deal room for business. Brand assets, fast facts, and media contact.',
}

const FACTS = [
  { title: 'What it is', body: 'A closed B2B network where every company is identity-verified before it appears, paired with structured deal sessions and receipts.' },
  { title: 'The problem', body: 'Cold outreach is built on unverifiable identities. NexusB2B makes trust the precondition for access.' },
  { title: 'Founded', body: '2026. Presented here as a fully implemented demonstration build with seeded, fictional businesses.' },
  { title: 'Category', body: 'B2B marketplace · trust & verification infrastructure · AI-mediated deal making.' },
]

export default function PressPage() {
  return (
    <InfoPage
      eyebrow="/ Company / Press"
      title="Press"
      accentWord="Kit"
      lede="Resources for journalists and partners covering NexusB2B. For interviews or additional material, reach our media team directly."
    >
      <div>
        <SectionTitle>Fast facts</SectionTitle>
        <FeatureRows items={FACTS} />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>Boilerplate</SectionTitle>
        <Prose>
          <p>
            NexusB2B is the verified deal room for business. By requiring identity verification before a company can be
            discovered, messaged or transact, NexusB2B replaces cold outreach with a trusted network — then gives members
            structured sessions and itemized receipts to take a relationship from first contact to closed deal in one
            place.
          </p>
          <p>
            <em>Note: NexusB2B is presented as a demonstration build. Company names and data shown on the network are
            fictional.</em>
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>Brand</SectionTitle>
        <div style={{ border: '1px solid var(--nx-border)', padding: '32px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, position: 'relative' }}>
              <div style={{ position: 'absolute', width: 9, height: 9, background: '#c44b1b', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', width: 9, height: 9, border: '1px solid #c44b1b', top: 0, right: 0 }} />
              <div style={{ position: 'absolute', width: 9, height: 9, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
              <div style={{ position: 'absolute', width: 9, height: 9, background: '#c44b1b', bottom: 0, right: 0 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>NEXUS<span style={{ color: '#c44b1b' }}>B2B</span></span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 18, height: 18, background: '#c44b1b', display: 'inline-block', border: '1px solid var(--nx-border)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)' }}>#C44B1B Terracotta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)' }}>Bebas Neue · Crimson Pro · JetBrains Mono</span>
            </div>
          </div>
        </div>
      </div>

      <CtaBand heading="Media enquiries" sub="Email press@nexusb2b.io and we will respond promptly with assets and availability." />
    </InfoPage>
  )
}
