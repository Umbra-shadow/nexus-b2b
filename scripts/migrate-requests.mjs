// Run with: node scripts/migrate-requests.mjs
// Requires DATABASE_URL in .env

import { readFileSync } from 'fs'
import { Pool } from 'pg'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  const client = await pool.connect()
  console.log('Connected to Aurora')

  try {
    const exists = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'business_change_requests'`
    )
    if (exists.rows.length > 0) {
      console.log('Table already exists — migration already applied, skipping')
      return
    }

    await client.query('BEGIN')

    await client.query(`CREATE TYPE change_request_type   AS ENUM ('update_info', 'delete_business')`)
    await client.query(`CREATE TYPE change_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled')`)
    console.log('Created enum types')

    await client.query(`
      CREATE TABLE business_change_requests (
        id            UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id   UUID                  NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        type          change_request_type   NOT NULL,
        status        change_request_status NOT NULL DEFAULT 'pending',
        requested_by  UUID                  NOT NULL REFERENCES users(id),
        requested_at  TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
        reviewed_by   UUID                  REFERENCES users(id),
        reviewed_at   TIMESTAMPTZ,
        admin_note    TEXT,
        payload       JSONB                 NOT NULL DEFAULT '{}'
      )
    `)
    console.log('Created table business_change_requests')

    await client.query(`CREATE INDEX idx_bcr_business_status ON business_change_requests (business_id, status)`)
    await client.query(`CREATE INDEX idx_bcr_status_date     ON business_change_requests (status, requested_at DESC)`)
    console.log('Created indexes')

    await client.query('COMMIT')
    console.log('Migration complete!')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
