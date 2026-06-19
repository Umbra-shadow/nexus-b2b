# NexusB2B — Find. Connect. Deal.

> **The verified B2B discovery and AI-mediated deal platform.**
> Built for the H0 Hackathon · Deployed at [nexus-b2b.vercel.app](https://nexus-b2b.vercel.app)

---

## What problem does this solve?

Business-to-business partnerships are broken. A logistics company in Hamburg looking for a packaging supplier in Spain has to wade through cold emails, LinkedIn requests, trade fairs, and broker middlemen — none of which guarantee the other company is legitimate, available, or even interested.

**NexusB2B replaces that entire friction layer with three things:**

1. **A verified network** — every company is identity-checked before they appear in search. You only see real businesses that have been approved by the platform team.
2. **AI-mediated introductions** — when you initiate a deal session, Lummy (the platform's AI) introduces both parties, summarises each company's profile and the requester's intent, and facilitates the opening of the conversation so neither side has to write a cold opener.
3. **Structured deal sessions with receipts** — conversations happen inside deal sessions. When an agreement is reached, both parties generate a signed receipt that serves as a lightweight contract record.

This solves the three biggest B2B discovery pain points: **trust** (verification), **friction** (AI introductions), and **accountability** (receipts).

---

## Feature overview

### For businesses
| Feature | Description |
|---|---|
| **Discovery** | Plain-language search across verified businesses. "Solar energy partner in Spain" or "AI logistics startup" — the AI parses intent and returns relevant matches across any industry. |
| **Deal sessions** | One click to open a structured session with any verified partner. Lummy introduces both parties and tracks the conversation. |
| **Receipts** | Generate itemised receipts from session outcomes. PDF export. Email delivery to both parties. |
| **Team management** | Business admins can invite and deactivate team members. All activity history is preserved under the business name even after a member leaves. |
| **Request-based profile changes** | Business profiles are immutable after verification. Any change (name, banking details, description) goes through a platform review request — protecting the trust of all parties on the network. |
| **Subscription plans** | Starter (free), Growth, and Enterprise tiers. Tier selection happens at registration. |

### For platform admins
| Feature | Description |
|---|---|
| **Business verification** | Review registration docs, approve or reject businesses, request additional information. |
| **Change requests panel** | All business profile update and deletion requests appear here for review. Approving an update automatically applies the changes to the database. |
| **Session & receipt oversight** | Full visibility into all deal sessions and generated receipts. |
| **Subscription management** | View and change subscription tiers per business. |
| **User management** | Add team members to businesses directly from the admin panel. |

---

## How it works — end to end

```
Register (3 steps) → Platform verifies docs → Business appears in discovery
        ↓
Any verified business searches "compostable packaging in Spain"
        ↓
AI (Gemini) parses intent → matches verified businesses across all industries
        ↓
Click "Start Session" → choose up to 3 services you want to discuss
        ↓
Lummy sends an invitation email to the partner's contact address
        ↓
Partner accepts → deal session opens → both sides chat through Lummy
        ↓
Agreement reached → generate a receipt → both parties receive PDF by email
```

---

## Architecture

```
Browser (Next.js 15 App Router)
    │
    ├── /api/*           — Next.js Route Handlers (Node.js runtime)
    ├── /admin/*         — Platform admin panel (server components)
    └── /dashboard/*     — Business dashboard (client components + server fetches)
         │
         ├── Aurora PostgreSQL (Serverless v2)   — users, businesses, sessions, receipts
         ├── Amazon DynamoDB                      — chat messages (session_id / message_id)
         ├── Amazon S3                            — logos + verification documents
         └── Resend                               — transactional email (all flows)
              │
              └── Lummy (Google Gemini 2.5 Flash)
                       — search parsing, session introductions, deal chat, admin assistant
```

**Auth:** NextAuth.js v5 (JWT strategy). On HTTPS, cookies use the `__Secure-authjs.session-token` prefix — middleware reads these with `secureCookie: true` to match correctly in production.

**AI:** All AI features run on **Google Gemini 2.5 Flash** via the OpenAI-compatible endpoint. The Gemini key is supplied by the user through the admin top bar and sent per-request via `x-gemini-key` header — no key is required at the server level (a server-side fallback key is optional via `GEMINI_API_KEY`).

**Search:** Natural-language queries go through Gemini which extracts industry, country, and capability keywords. A local rule-based parser provides a zero-latency fallback. Keyword matching uses PostgreSQL `~*` regex with `\y` word boundaries to prevent substring false positives (e.g. "ai" matching "retail").

**Banking details** are encrypted at rest using AES-256-GCM with a key stored separately from the data.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.x (App Router) + TypeScript |
| Styling | Inline styles with CSS variables — no Tailwind in production |
| Database (relational) | Amazon Aurora PostgreSQL Serverless v2 |
| Database (messages) | Amazon DynamoDB |
| Auth | NextAuth.js v5 beta |
| AI — all features | Google Gemini 2.5 Flash (search parsing, Lummy introductions, deal sessions, admin assistant) |
| File storage | Amazon S3 |
| Email | Resend |
| Hosting | Vercel |

---

## Design system

- **Accent:** `#c44b1b` (burnt orange)
- **Typography:** Playfair Display (headlines) · Space Grotesk (UI) · JetBrains Mono (data/labels)
- **Themes:** Light and dark mode, toggled per-user via `data-theme` attribute
- **Pattern:** All styling via inline styles + CSS variables. No Tailwind classes on core UI components.
- **Status colours:** `#b48c3c` pending · `#5a9a7a` active/approved · `#c44b1b` closed/rejected

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/Umbra-shadow/nexus-b2b.git
cd nexus-b2b
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all required values (see .env.example for descriptions)

# 3. Initialise the database
# Run lib/db/schema.sql against your Aurora PostgreSQL cluster
# DynamoDB table: nexusb2b_messages  PK: session_id (String)  SK: message_id (String)

# 4. Run migrations (if upgrading an existing install)
node scripts/migrate-requests.mjs

# 5. Start dev server
npm run dev
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✓ | Random 32-byte base64 string |
| `NEXTAUTH_URL` | ✓ | Full public URL e.g. `https://nexus-b2b.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | ✓ | Same as above (used in email links) |
| `PLATFORM_ADMIN_EMAIL` | ✓ | Email address that gets access to `/admin` |
| `DATABASE_URL` | ✓ | Aurora PostgreSQL connection string |
| `AWS_REGION` | ✓ | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | ✓ | IAM user with S3 + DynamoDB access |
| `AWS_SECRET_ACCESS_KEY` | ✓ | — |
| `DYNAMODB_TABLE_MESSAGES` | ✓ | e.g. `nexusb2b_messages` |
| `S3_BUCKET_NAME` | ✓ | S3 bucket for logos and docs |
| `S3_BUCKET_REGION` | ✓ | e.g. `us-east-1` |
| `RESEND_API` | ✓ | Resend API key for transactional email |
| `RESEND_FROM` | ✓ | Verified sender e.g. `NexusB2B <hello@nexusb2b.io>` |
| `ENCRYPTION_KEY` | ✓ | 32-byte hex key for AES-256-GCM (banking details) |
| `GEMINI_API_KEY` | optional | Server-side fallback Gemini key. Users can also supply their own via the key input in the top bar. |

> **Security:** Never commit `.env` to version control. The `.gitignore` excludes it. All secrets live only in Vercel environment variables in production.

---

## Key design decisions

### Why request-based profile changes?
Once a business is verified, other businesses trust its profile. If a company could silently rename itself or change its banking details, it would undermine the whole trust model. Every profile change goes through platform admin review — protecting both the network and the businesses relying on that information.

### Why keep data after a team member leaves?
All deal sessions, messages, and receipts are business records, not personal records. When a salesperson leaves a company, the deals they brokered stay on file under that company's name. Deleting their account only deactivates their login — everything they did is preserved for the business.

### Why AI search instead of filters?
B2B procurement needs are naturally expressed in language: "I'm looking for a cold-chain logistics partner that handles pharmaceutical cargo in the Nordics." Filter-based search can't capture that. The AI parser extracts intent (industry, region, capability keywords) and the results engine handles the matching — giving filter-like precision from a natural query.

### Why Lummy?
Cold B2B introductions have a low response rate because neither party knows what the other wants. Lummy opens every session with a structured introduction: who the initiator is, what they're looking for, and what the receiver offers. Both parties start the conversation already informed, which dramatically increases the quality of the first exchange.

---

## Deployment

The project deploys automatically to Vercel on push to `main`. Set all environment variables in the Vercel dashboard under Project → Settings → Environment Variables.

Aurora Serverless v2 may take 20–30 seconds to wake from a cold start. On Vercel, serverless functions have a default 10-second timeout — set `maxDuration = 30` in `vercel.json` or increase the timeout per route if you see cold-start failures.

---

## License

Private — H0 Hackathon submission. All rights reserved.
