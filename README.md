# NexusB2B — Find. Connect. Deal.

The verified B2B discovery and AI-mediated deal platform.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Amazon Aurora PostgreSQL (relational) + Amazon DynamoDB (chat messages)
- **AI**: Claude claude-sonnet-4-6 via Anthropic API
- **Auth**: NextAuth.js v5
- **Storage**: AWS S3
- **Email**: AWS SES
- **Hosting**: Vercel

## Setup

```bash
cp .env.example .env.local
# Fill in all env vars

npm install
npm run dev
```

## DB

Run `lib/db/schema.sql` against your Aurora PostgreSQL cluster.

DynamoDB table: `nexusb2b_messages` — PK: `session_id` (String), SK: `message_id` (String)

## Design

- Colors: white/off-white bg, brown accent (#7C5C3E), black text
- Status: orange (pending) · green (active) · red (closed)
- Fonts: Playfair Display (display) · Inter (UI) · JetBrains Mono (receipts)
