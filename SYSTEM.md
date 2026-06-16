# NexusB2B — System Overview

## What is it?

NexusB2B is a **verified B2B discovery and deal platform**. It lets businesses find each other, open AI-mediated deal sessions, and exchange receipts — all inside one platform, with every participant identity-verified before they appear.

---

## The Problem It Solves

Finding legitimate B2B partners today means cold emails, LinkedIn spam, and no accountability. There is no trusted, structured channel where verified businesses can discover each other and open a formal deal conversation. NexusB2B fills that gap.

---

## Core Concepts

### 1. Verified Businesses
Every company on the platform goes through a verification process before they appear in search results. No unverified business can be discovered or contacted.

### 2. Discovery
A business logs in and searches for partners using plain language (AI-powered). They can filter by industry, country, or specialty. Results show only verified businesses with public profiles: name, description, industry, city, website.

### 3. Sessions
A "session" is a private deal conversation between two businesses. One business initiates, the other accepts. Inside the session, both parties can chat in real time. The session is closed once the deal is done or either party ends it.

### 4. AI Introduction
When a session is opened, the AI generates a formal introduction message — presenting both companies to each other based on their profiles and the reason for contact. After that, the AI steps back and the humans take over.

### 5. AI Demo Mode
For demonstration purposes, some businesses on the platform are fictional and have no real users. When a session is opened with one of these businesses, the AI automatically replies on their behalf, simulating a real business conversation. A banner makes this clear to the user.

### 6. In-Chat Receipts
Inside a session, either party can create a receipt (an invoice/agreement record) and share it with the other party. The counterparty can acknowledge it. Receipts are stored and linked to the session permanently.

### 7. Payment Details
Businesses store their banking information (IBAN, bank name, SWIFT, account holder name) in their settings. This is shown on receipts so the counterparty knows where to send payment. Bank details are encrypted at rest (AES-256-GCM).

---

## User Roles

| Role | What they can do |
|------|-----------------|
| **Platform Admin** | Manages the entire platform. Approves/rejects business verification requests. Can see all businesses and sessions. |
| **Business Admin** | Controls their company's account. Manages team members. Updates company profile and payment details. Can open and manage sessions. |
| **Business Agent** | An employee of a verified business. Can participate in sessions assigned to them. Cannot change company settings or invite members. |

---

## Pages / Sections

| Page | Purpose |
|------|---------|
| **Landing** | Public homepage. Shows what the platform does, a live preview of verified businesses, and demo credentials for the hackathon judge. |
| **Register** | A business registers: company name, industry, city, website, description, plus the admin's personal details. |
| **Login** | Email + password. JWT session. |
| **Dashboard** | Overview: stats (active sessions, pending sessions, receipts), quick search, recent activity. |
| **Discovery** | Search and filter all verified businesses. Click to open a session. |
| **Sessions** | List of all sessions for the business, grouped by status (active / pending / closed). Click to open a session. |
| **Session Detail** | The live chat interface. Shows messages, AI introduction, demo banner if applicable. Send receipts from here. |
| **Receipts** | List of all receipts (sent and received). |
| **Receipt Detail** | Full receipt view with payment details. Acknowledge button for the counterparty. |
| **Team** | Business admin sees all team members, their roles, and status. Can invite new members, deactivate/reactivate existing ones. |
| **Settings — Account** | Change display name, change password. |
| **Settings — Business** | Edit company profile (name, description, city, website) and payment details (IBAN, bank, SWIFT). |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Auth | NextAuth v5 (JWT, credentials provider) |
| Relational DB | Aurora PostgreSQL Serverless v2 (AWS) |
| Message Store | DynamoDB (chat messages) |
| File Storage | AWS S3 |
| Email | AWS SES |
| AI | Vercel v0 API (OpenAI-compatible) |
| Hosting | Vercel (frontend) |

---

## Data Model (simplified)

```
businesses        — company profiles, industry, city, verification status, encrypted bank details
users             — people, linked to a business, role: platform_admin / business_admin / business_agent
sessions          — deal conversations between two businesses (initiator + receiver)
receipts          — invoice records linked to a session
messages          — stored in DynamoDB, linked to a session_id
invitations       — pending team invites (email + token)
```

---

## Key Rules

- A business must be **verified** to appear in discovery or start sessions.
- Only the **business admin** can edit company settings, payment details, or manage team members.
- Sessions belong to the **business**, not to an individual user. Any agent of the business can participate.
- Receipt payment details are pulled from the **sender's** stored banking info at the time the receipt is created.
- Bank details are **never stored in plain text** — always AES-256-GCM encrypted.
- The `.env` file is **never committed** to version control.
