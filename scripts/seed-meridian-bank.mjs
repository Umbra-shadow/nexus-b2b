#!/usr/bin/env node
/**
 * One-off script: sets fake bank details for the Meridian Logistics Group demo account.
 * Run with: node scripts/seed-meridian-bank.mjs
 */
import pg from 'pg'
import { createCipheriv, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Load .env ────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

function encrypt(plaintext) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

// ── Fake bank details for Meridian Logistics Group GmbH ──────────────────────
const BANK_DETAILS = {
  account_holder: 'Meridian Logistics Group GmbH',
  bank_name:      'Deutsche Bank AG',
  account_number: 'DE89 3704 0044 0532 0130 00',
  swift:          'DEUTDEDB',
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()

  // Find Meridian's business row
  const bizRes = await client.query(
    `SELECT b.id, b.name FROM businesses b
     JOIN users u ON u.business_id = b.id
     WHERE u.email = 'admin@meridian.io' LIMIT 1`
  )

  if (bizRes.rows.length === 0) {
    console.error('Meridian demo account not found. Run the seed first.')
    process.exit(1)
  }

  const { id, name } = bizRes.rows[0]
  console.log(`Found business: ${name} (${id})`)

  await client.query(
    `UPDATE businesses SET
       bank_account_name   = $1,
       bank_name           = $2,
       bank_account_number = $3,
       bank_swift          = $4
     WHERE id = $5`,
    [
      encrypt(BANK_DETAILS.account_holder),
      encrypt(BANK_DETAILS.bank_name),
      encrypt(BANK_DETAILS.account_number),
      encrypt(BANK_DETAILS.swift),
      id,
    ]
  )

  console.log('Bank details set:')
  console.log('  Account holder:', BANK_DETAILS.account_holder)
  console.log('  Bank:          ', BANK_DETAILS.bank_name)
  console.log('  IBAN:          ', BANK_DETAILS.account_number)
  console.log('  SWIFT/BIC:     ', BANK_DETAILS.swift)
} finally {
  await client.end()
}
