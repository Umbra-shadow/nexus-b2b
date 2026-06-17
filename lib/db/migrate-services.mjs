/**
 * Migration: add services[] to businesses, selected_services[] to sessions
 * Run: node lib/db/migrate-services.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '../../.env')
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

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Add services column to businesses (list of offered services)
    await client.query(`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT '{}'
    `)
    console.log('✓ businesses.services column added')

    // Add selected_services column to sessions (services the initiator is interested in)
    await client.query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS selected_services TEXT[] DEFAULT '{}'
    `)
    console.log('✓ sessions.selected_services column added')

    await client.query('COMMIT')
    console.log('\nMigration complete.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
