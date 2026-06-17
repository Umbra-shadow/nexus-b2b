import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, StepGrid, FeatureRows, StatStrip, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Verification',
  description: 'Every company on NexusB2B is identity-verified before it appears. Learn how business verification keeps the network free of fraud.',
}

export default function VerificationInfoPage() {
  return (
    <InfoPage
      eyebrow="/ Platform / Verification"
      title="Verification"
      accentWord="First"
      lede="No company appears on NexusB2B until its legal identity has been checked. Verification is the foundation the entire network is built on — not an optional badge."
    >
      <StatStrip
        stats={[
          { value: '100%', label: 'Verified before listing', accent: true },
          { value: '< 48h', label: 'Typical review' },
          { value: '0', label: 'Anonymous accounts' },
        ]}
      />

      <div style={{ marginTop: 64 }}>
        <SectionTitle>Trust is the product</SectionTitle>
        <Prose>
          <p>
            Cold outreach is broken because anyone can claim to be anyone. NexusB2B inverts that: a business proves who it
            is <em>before</em> it can be discovered, messaged, or transact. By the time you see a company in the network,
            its registration details and authorized representative have already been reviewed.
          </p>
          <p>
            That single rule changes the texture of every interaction. You are never wondering whether the firm on the
            other side of a session is real — you are negotiating with a known, verified counterparty.
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>The verification process</SectionTitle>
        <StepGrid
          steps={[
            { n: '01', title: 'Register', body: 'A business submits its legal name, registration details and an authorized representative.' },
            { n: '02', title: 'Review', body: 'Identity and registration documents are checked against the submitted details.' },
            { n: '03', title: 'Approve', body: 'Once confirmed, the company is marked verified and becomes discoverable on the network.' },
            { n: '04', title: 'Maintain', body: 'Verification status is tied to the account; misuse can revoke a company\u2019s standing.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>What verification guarantees</SectionTitle>
        <FeatureRows
          items={[
            { title: 'A real legal entity', body: 'Every listed company corresponds to a checked business registration — not an anonymous profile.' },
            { title: 'An accountable representative', body: 'Each account is tied to an authorized person, so there is always a responsible party behind a deal.' },
            { title: 'A fraud-resistant network', body: 'Because verification gates entry, the entire directory stays free of the spam and impersonation that plague open platforms.' },
            { title: 'A visible trust signal', body: 'The verified mark is not decoration — it is the precondition for appearing on NexusB2B at all.' },
          ]}
        />
      </div>

      <CtaBand heading="Get verified" sub="Submit your business for review and join a network where every member is who they say they are." />
    </InfoPage>
  )
}
