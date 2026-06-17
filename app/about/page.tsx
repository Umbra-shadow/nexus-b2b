import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, FeatureRows, StatStrip, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'About',
  description: 'NexusB2B is the verified deal room for business — built to replace cold outreach with a network where every company is identity-checked.',
}

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="/ Company / About"
      title="We Build"
      accentWord="Trust"
      lede="NexusB2B exists to fix a simple, expensive problem: business-to-business outreach runs on cold email, and cold email runs on guesswork. We replaced it with a network where trust is the entry requirement."
    >
      <StatStrip
        stats={[
          { value: '2,400+', label: 'Verified firms' },
          { value: '38', label: 'Countries' },
          { value: '€140M', label: 'In session deals', accent: true },
          { value: '2026', label: 'Founded' },
        ]}
      />

      <div style={{ marginTop: 64 }}>
        <SectionTitle>Why we exist</SectionTitle>
        <Prose>
          <p>
            Every founder knows the ritual: scrape a list, blast an introduction, hope someone real replies. The
            economics are brutal and the experience is worse — for senders and recipients alike. The core defect is not
            the email; it is the absence of trust. You cannot tell who is real.
          </p>
          <p>
            NexusB2B starts from the opposite premise. A company proves its identity before it can be discovered, before
            it can message anyone, before it can transact. Once that single rule is in place, everything downstream gets
            better: discovery becomes meaningful, conversations become deals, and deals leave a clean record.
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>What we believe</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Verification before access', body: 'Trust should be a precondition, not a badge you earn after the damage is done.' },
            { title: 'Structure beats inboxes', body: 'Deals belong in a room built for them, with one shared timeline — not in forwarded email threads.' },
            { title: 'Plain language over taxonomies', body: 'People should describe what they need in their own words and let the system do the translating.' },
            { title: 'A record you can stand behind', body: 'Every transaction should produce an auditable, exportable receipt both sides agree on.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>The honest disclaimer</SectionTitle>
        <Prose>
          <p>
            NexusB2B is presented here as a demonstration build. The companies shown on the network are fictional and the
            data is seeded for evaluation. The architecture, verification model and deal-room workflow, however, are real
            and fully implemented.
          </p>
        </Prose>
      </div>

      <CtaBand heading="Join the network" sub="Verify your business and see what B2B feels like without the cold email." />
    </InfoPage>
  )
}
