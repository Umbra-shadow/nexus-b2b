/**
 * Seed script — fictional demo businesses + demo user account
 * Run: npm run db:seed
 */
import pg from 'pg'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')

// Load .env manually (no dotenv dep required)
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

const DEMO_EMAIL = 'admin@meridian.io'
const DEMO_PASSWORD = 'demo1234'
const DEMO_BUSINESS = 'Meridian Logistics Group'
const DEMO_NAME = 'Admin Meridian'

const BUSINESSES = [
  {
    name: 'Apex Horizons Consulting',
    industry: 'finance',
    country: 'US',
    city: 'New York',
    website: 'https://apexhorizons.example.com',
    description: 'Strategy and financial advisory firm helping mid-market companies scale globally through data-driven investment and restructuring plans.',
  },
  {
    name: 'Meridian Logistics Group',
    industry: 'logistics',
    country: 'DE',
    city: 'Hamburg',
    website: 'https://meridianlogistics.example.com',
    description: 'Pan-European freight and supply chain operator specialising in temperature-controlled cargo and last-mile delivery across 22 countries.',
  },
  {
    name: 'Solara Energy Systems',
    industry: 'energy',
    country: 'AE',
    city: 'Dubai',
    website: 'https://solaraenergy.example.com',
    description: 'Renewable energy developer focused on utility-scale solar and battery storage projects across the MENA region.',
  },
  {
    name: 'Helix BioTech',
    industry: 'healthcare',
    country: 'CH',
    city: 'Basel',
    website: 'https://helixbiotech.example.com',
    description: 'Biotechnology company developing next-generation mRNA therapies and diagnostics for rare genetic diseases.',
  },
  {
    name: 'BlueSky SaaS Labs',
    industry: 'technology',
    country: 'GB',
    city: 'London',
    website: 'https://blueskysaas.example.com',
    description: 'B2B SaaS company building AI-powered revenue intelligence and CRM automation tools for enterprise sales teams.',
  },
  {
    name: 'Cortex Manufacturing',
    industry: 'manufacturing',
    country: 'JP',
    city: 'Osaka',
    website: 'https://cortexmfg.example.com',
    description: 'Precision manufacturer of industrial robotics components and semiconductor parts for global electronics supply chains.',
  },
  {
    name: 'Verdant Farms International',
    industry: 'agriculture',
    country: 'BR',
    city: 'São Paulo',
    website: 'https://verdantfarms.example.com',
    description: 'Agribusiness exporting certified organic soybeans, coffee, and tropical fruits to over 30 countries worldwide.',
  },
  {
    name: 'Ironclad Legal Partners',
    industry: 'legal',
    country: 'SG',
    city: 'Singapore',
    website: 'https://ironcladlegal.example.com',
    description: 'Full-service commercial law firm in Southeast Asia specialising in cross-border M&A, IP licensing, and trade compliance.',
  },
  {
    name: 'NordTech Solutions',
    industry: 'technology',
    country: 'SE',
    city: 'Stockholm',
    website: 'https://nordtech.example.com',
    description: 'Cybersecurity and cloud infrastructure provider offering managed security operations, zero-trust architecture, and compliance automation.',
  },
  {
    name: 'Atlas Retail Group',
    industry: 'retail',
    country: 'FR',
    city: 'Paris',
    website: 'https://atlasretail.example.com',
    description: 'Multi-brand retail holding company operating premium lifestyle and fashion brands across Europe and the Middle East.',
  },
  {
    name: 'Stratos Capital Partners',
    industry: 'finance',
    country: 'CA',
    city: 'Toronto',
    website: 'https://stratoscapital.example.com',
    description: 'Alternative investment manager specialising in private equity, real estate debt, and infrastructure funds for institutional investors.',
  },
  {
    name: 'OmniMed Devices',
    industry: 'healthcare',
    country: 'IL',
    city: 'Tel Aviv',
    website: 'https://omnimeddevices.example.com',
    description: 'Medical device company designing AI-assisted surgical robotics and remote patient monitoring wearables for hospitals.',
  },
  {
    name: 'ClearPath Freight',
    industry: 'logistics',
    country: 'AU',
    city: 'Melbourne',
    website: 'https://clearpathfreight.example.com',
    description: 'Freight broker and 3PL provider connecting shippers across the Asia-Pacific with a real-time digital freight marketplace.',
  },
  {
    name: 'Volta Power Co.',
    industry: 'energy',
    country: 'NG',
    city: 'Lagos',
    website: 'https://voltapower.example.com',
    description: 'Independent power producer developing off-grid mini-grid and hybrid solar-diesel solutions for underserved communities in Sub-Saharan Africa.',
  },
  {
    name: 'Quantum Dynamics Corp',
    industry: 'technology',
    country: 'KR',
    city: 'Seoul',
    website: 'https://quantumdynamics.example.com',
    description: 'Deep-tech company commercialising quantum computing algorithms and photonic chip designs for financial modelling and drug discovery.',
  },
]

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function run() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('Seeding demo businesses...')

    const businessIds = {}

    for (const biz of BUSINESSES) {
      const slug = slugify(biz.name)

      // Upsert: skip if slug already exists
      const existing = await client.query(`SELECT id FROM businesses WHERE slug = $1`, [slug])
      if (existing.rows.length > 0) {
        businessIds[biz.name] = existing.rows[0].id
        console.log(`  skip (exists): ${biz.name}`)
        continue
      }

      const res = await client.query(
        `INSERT INTO businesses (name, slug, industry, country, city, website, description, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified')
         RETURNING id`,
        [biz.name, slug, biz.industry, biz.country, biz.city, biz.website, biz.description]
      )
      businessIds[biz.name] = res.rows[0].id
      console.log(`  created: ${biz.name}`)
    }

    // Demo user — business admin for Meridian Logistics Group
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)
    const demoBizId = businessIds[DEMO_BUSINESS]

    await client.query(
      `INSERT INTO users (business_id, email, name, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, 'business_admin', true, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             business_id   = EXCLUDED.business_id,
             name          = EXCLUDED.name,
             is_active     = true,
             email_verified = true`,
      [demoBizId, DEMO_EMAIL, DEMO_NAME, passwordHash]
    )
    console.log(`Demo user upserted: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)

    await client.query('COMMIT')
    console.log('\nSeed complete.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
