-- NexusB2B Aurora PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE industry_type AS ENUM (
  'technology', 'finance', 'healthcare', 'manufacturing',
  'logistics', 'retail', 'energy', 'agriculture', 'legal', 'other'
);

CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE user_role AS ENUM ('business_admin', 'business_agent');
CREATE TYPE session_status AS ENUM ('pending', 'active', 'closed');
CREATE TYPE receipt_status AS ENUM ('draft', 'sent', 'acknowledged');

-- Businesses
CREATE TABLE businesses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  industry              industry_type NOT NULL,
  country               CHAR(2) NOT NULL,
  city                  TEXT,
  description           TEXT CHECK (char_length(description) <= 500),
  website               TEXT,
  logo_s3_key           TEXT,
  verification_status   verification_status DEFAULT 'pending',
  verification_doc_s3_key TEXT,
  bank_account_name     TEXT,
  bank_account_number   TEXT,
  bank_name             TEXT,
  bank_swift            TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_country ON businesses(country);
CREATE INDEX idx_businesses_industry ON businesses(industry);
CREATE INDEX idx_businesses_verification ON businesses(verification_status);
CREATE INDEX idx_businesses_slug ON businesses(slug);

-- Full text search index
ALTER TABLE businesses ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, ''))
  ) STORED;

CREATE INDEX idx_businesses_search ON businesses USING GIN(search_vector);

-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'business_agent',
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_business ON users(business_id);
CREATE INDEX idx_users_email ON users(email);

-- Email verification tokens
CREATE TABLE verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('email_verify', 'password_reset', 'invite')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_token ON verification_tokens(token);
CREATE INDEX idx_tokens_user ON verification_tokens(user_id);

-- Sessions (deal conversations)
CREATE TABLE sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_agent_id    UUID NOT NULL REFERENCES users(id),
  receiver_agent_id     UUID REFERENCES users(id),
  initiator_business_id UUID NOT NULL REFERENCES businesses(id),
  receiver_business_id  UUID NOT NULL REFERENCES businesses(id),
  status                session_status DEFAULT 'pending',
  ai_introduced         BOOLEAN DEFAULT false,
  invitation_token      TEXT UNIQUE NOT NULL,
  search_context        TEXT,
  invitation_sent_at    TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_initiator ON sessions(initiator_agent_id);
CREATE INDEX idx_sessions_receiver ON sessions(receiver_agent_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_token ON sessions(invitation_token);
CREATE INDEX idx_sessions_initiator_business ON sessions(initiator_business_id);
CREATE INDEX idx_sessions_receiver_business ON sessions(receiver_business_id);

-- Receipts
CREATE TABLE receipts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES sessions(id),
  issuer_business_id   UUID NOT NULL REFERENCES businesses(id),
  receiver_business_id UUID NOT NULL REFERENCES businesses(id),
  items                JSONB NOT NULL DEFAULT '[]',
  subtotal             DECIMAL(15,2) NOT NULL,
  tax_rate             DECIMAL(5,4) DEFAULT 0,
  total                DECIMAL(15,2) NOT NULL,
  currency             CHAR(3) DEFAULT 'USD',
  notes                TEXT,
  status               receipt_status DEFAULT 'draft',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipts_session ON receipts(session_id);
CREATE INDEX idx_receipts_issuer ON receipts(issuer_business_id);
CREATE INDEX idx_receipts_receiver ON receipts(receiver_business_id);
