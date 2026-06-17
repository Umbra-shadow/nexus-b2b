import type { Metadata } from 'next'
import { InfoPage, LegalDoc } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing use of the NexusB2B verified B2B network, deal sessions and receipts.',
}

export default function TermsPage() {
  return (
    <InfoPage eyebrow="/ Trust / Terms" title="Terms of" accentWord="Service">
      <LegalDoc
        updated="June 2026"
        intro="These Terms of Service govern your access to and use of NexusB2B. By creating an account, you agree to these terms. NexusB2B is presented as a demonstration build; these terms describe the intended rules of the platform."
        clauses={[
          {
            heading: 'Eligibility & verification',
            body: [
              'NexusB2B is a network for businesses. To participate, your company must complete identity verification.',
              'You represent that you are authorized to act on behalf of the business you register, and that the information you provide is accurate.',
            ],
          },
          {
            heading: 'Acceptable use',
            body: [
              'You agree to use the platform only for legitimate business purposes.',
              'You will not impersonate another business, misrepresent your identity, or attempt to circumvent verification.',
              'You will not use the platform to send spam, harass other members, or engage in fraudulent activity.',
            ],
          },
          {
            heading: 'Sessions & receipts',
            body: [
              'Deal sessions are scoped to the two businesses involved. You are responsible for the content you contribute to a session.',
              'Receipts you issue represent commercial records between businesses. You are responsible for the accuracy of the line items, amounts and terms they contain.',
              'Closed sessions and issued receipts are retained as permanent records for audit and compliance.',
            ],
          },
          {
            heading: 'Accounts & termination',
            body: [
              'You are responsible for safeguarding your account credentials.',
              'We may suspend or revoke verification and access for businesses that violate these terms or misuse the platform.',
              'You may delete your account at any time from account settings.',
            ],
          },
          {
            heading: 'Disclaimers',
            body: [
              'NexusB2B is provided on an as-is basis. As a demonstration build, the businesses shown on the network are fictional and data is seeded for evaluation.',
              'We are not a party to the commercial agreements made between businesses on the platform.',
            ],
          },
          {
            heading: 'Contact',
            body: [
              'Questions about these terms can be directed to legal@nexusb2b.io.',
            ],
          },
        ]}
      />
    </InfoPage>
  )
}
