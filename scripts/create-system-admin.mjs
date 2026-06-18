/**
 * Creates the NexusB2B platform business and system admin user.
 * Run: node scripts/create-system-admin.mjs
 */
import pg from 'pg'
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...rest] = l.split('=')
      return [k.trim(), rest.join('=').trim()]
    })
)

const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

const ADMIN_EMAIL = 'admin@nexusb2b.io'
const ADMIN_PASSWORD = 'admin1234'
const ADMIN_NAME = 'System Administrator'

const PLATFORM_BIZ = {
  name: 'NexusB2B Platform',
  slug: 'nexusb2b-platform',
  industry: 'technology',
  country: 'US',
  city: 'Remote',
  website: 'https://nexusb2b.io',
  description: 'NexusB2B platform operations — system administration account.',
}

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Ensure system_admin value exists in the user_role enum
    const enumCheck = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'system_admin'
    `)
    if (enumCheck.rows.length === 0) {
      await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'system_admin'`)
      console.log('✓ system_admin added to user_role enum')
    } else {
      console.log('✓ user_role enum already includes system_admin')
    }

    // Upsert platform business
    const existing = await client.query(
      `SELECT id FROM businesses WHERE slug = $1`,
      [PLATFORM_BIZ.slug]
    )

    let platformBizId
    if (existing.rows.length > 0) {
      platformBizId = existing.rows[0].id
      console.log(`✓ Platform business already exists: ${platformBizId}`)
    } else {
      const res = await client.query(
        `INSERT INTO businesses (name, slug, industry, country, city, website, description, services, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'verified')
         RETURNING id`,
        [
          PLATFORM_BIZ.name,
          PLATFORM_BIZ.slug,
          PLATFORM_BIZ.industry,
          PLATFORM_BIZ.country,
          PLATFORM_BIZ.city,
          PLATFORM_BIZ.website,
          PLATFORM_BIZ.description,
          [],
        ]
      )
      platformBizId = res.rows[0].id
      console.log(`✓ Platform business created: ${platformBizId}`)
    }

    // Upsert system admin user — must commit enum change first for the role to be usable
    await client.query('COMMIT')
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

    await client.query(
      `INSERT INTO users (business_id, email, name, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, 'system_admin', true, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash  = EXCLUDED.password_hash,
             business_id    = EXCLUDED.business_id,
             name           = EXCLUDED.name,
             role           = 'system_admin',
             is_active      = true,
             email_verified = true`,
      [platformBizId, ADMIN_EMAIL, ADMIN_NAME, passwordHash]
    )
    console.log(`✓ System admin upserted: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)

    await client.query('COMMIT')
    console.log('\nDone.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
