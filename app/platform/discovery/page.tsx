import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, StepGrid, FeatureRows, StatStrip, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Discovery',
  description: 'Find verified business partners in plain language. NexusB2B discovery turns natural-language intent into a ranked shortlist of identity-checked companies.',
}

export default function DiscoveryInfoPage() {
  return (
    <InfoPage
      eyebrow="/ Platform / Discovery"
      title="Discovery"
      lede="Stop guessing keywords. Describe the partner you need in plain language and NexusB2B returns a ranked shortlist of identity-verified companies — never a cold list of strangers."
    >
      <StatStrip
        stats={[
          { value: '2,400+', label: 'Verified firms' },
          { value: '38', label: 'Countries' },
          { value: '14', label: 'Industries' },
          { value: '100%', label: 'Identity-checked', accent: true },
        ]}
      />

      <div style={{ marginTop: 64 }}>
        <SectionTitle>Search the way you think</SectionTitle>
        <Prose>
          <p>
            Traditional B2B directories make you reverse-engineer their taxonomy — pick a category, guess a filter, hope the
            tags line up. NexusB2B discovery starts from intent. Type something like <em>&ldquo;sustainable packaging
            supplier in southern Europe that can handle 50k units a month&rdquo;</em> and the platform parses the
            constraints for you: industry, geography, capacity, and certifications.
          </p>
          <p>
            Every result is a company that has already passed identity verification, so the shortlist you act on is the
            shortlist you can trust.
          </p>
        </Prose>
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>How discovery works</SectionTitle>
        <StepGrid
          steps={[
            { n: '01', title: 'Describe intent', body: 'Write what you need in a sentence. No rigid filters or boolean syntax required.' },
            { n: '02', title: 'Intent is parsed', body: 'Industry, region, scale and certifications are extracted into structured criteria.' },
            { n: '03', title: 'Ranked matches', body: 'Verified companies are scored against your criteria and ordered by fit.' },
            { n: '04', title: 'Open a session', body: 'Move from a profile to a structured deal room in a single click.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>What makes it different</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Verified-only results', body: 'Discovery never surfaces an unverified company. If it appears in your results, its legal identity has been checked.' },
            { title: 'Natural-language criteria', body: 'Capacity, geography, niche and compliance needs are understood from how you phrase the request — not from tags you have to memorize.' },
            { title: 'Public profiles, private intent', body: 'You browse rich company profiles, but your searches and shortlists are never shared with the companies you view.' },
            { title: 'One step from a deal', body: 'Discovery is wired directly into sessions — the structured deal room — so there is no copy-paste between tools.' },
          ]}
        />
      </div>

      <CtaBand heading="Find your next partner" sub="Verify your business and start searching the network in plain language today." />
    </InfoPage>
  )
}
