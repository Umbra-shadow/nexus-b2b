import type { Metadata } from 'next'
import { InfoPage, LegalDoc } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How NexusB2B collects, uses, and protects business and personal data across the verified deal network.',
}

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="/ Trust / Privacy" title="Privacy" accentWord="Policy">
      <LegalDoc
        updated="June 2026"
        intro="This Privacy Policy explains what information NexusB2B collects, how we use it, and the choices you have. NexusB2B is presented as a demonstration build; this policy describes the intended handling of data within the platform."
        clauses={[
          {
            heading: 'Information we collect',
            body: [
              'Account and business information you provide during registration, including your name, work email, company legal name and registration details used for verification.',
              'Content you create on the platform, such as company profiles, session messages and receipts.',
              'Technical data generated automatically, such as authentication session tokens and basic request metadata used to keep the service secure.',
            ],
          },
          {
            heading: 'How we use information',
            body: [
              'To verify the identity of businesses before they join the network.',
              'To operate core features: discovery, deal sessions, AI-mediated introductions and receipts.',
              'To secure the platform, prevent fraud and enforce our terms.',
            ],
          },
          {
            heading: 'How information is shared',
            body: [
              'Verified company profile information is visible to other verified businesses on the network.',
              'Session content and receipts are shared only with the two businesses party to that session.',
              'We do not sell your personal data. Your searches and shortlists are private and are not shared with the companies you view.',
            ],
          },
          {
            heading: 'Data protection',
            body: [
              'Sensitive commercial fields such as banking information are encrypted at rest using authenticated AES-256-GCM encryption.',
              'Passwords are hashed with bcrypt and never stored in plain text.',
              'Access to your data is scoped to your business and authorized through authenticated sessions.',
            ],
          },
          {
            heading: 'Your rights',
            body: [
              'You can update your profile information at any time from account settings.',
              'You can export your receipt history as a consolidated PDF.',
              'You can permanently delete your account and associated data from the account settings page.',
            ],
          },
          {
            heading: 'Contact',
            body: [
              'For privacy questions or data requests, contact legal@nexusb2b.io.',
            ],
          },
        ]}
      />
    </InfoPage>
  )
}
