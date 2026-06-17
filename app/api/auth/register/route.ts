import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, queryOne, transaction } from '@/lib/db/aurora'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendVerificationEmail } from '@/lib/email/ses'
import { uploadFile, buildLogoKey, buildDocKey } from '@/lib/s3/upload'
import { slugify } from '@/lib/utils'
import { RegisterBusinessSchema, RegisterUserServerSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()

    const bizRaw = fd.get('business')
    const userRaw = fd.get('user')

    if (!bizRaw || !userRaw) {
      return NextResponse.json({ error: 'Missing registration data' }, { status: 400 })
    }

    const bizData = RegisterBusinessSchema.safeParse(JSON.parse(bizRaw as string))
    const userData = RegisterUserServerSchema.safeParse(JSON.parse(userRaw as string))

    if (!bizData.success) {
      return NextResponse.json({ error: 'Invalid business data', details: bizData.error.flatten() }, { status: 422 })
    }
    if (!userData.success) {
      return NextResponse.json({ error: 'Invalid user data', details: userData.error.flatten() }, { status: 422 })
    }

    const { businessName, industry, country, city, website, description, services } = bizData.data
    const { name, email, password } = userData.data

    const existingUser = await queryOne(`SELECT id FROM users WHERE email = $1`, [email])
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const baseSlug = slugify(businessName)
    let slug = baseSlug
    let slugSuffix = 0
    while (await queryOne(`SELECT id FROM businesses WHERE slug = $1`, [slug])) {
      slugSuffix++
      slug = `${baseSlug}-${slugSuffix}`
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const logoFile = fd.get('logo') as File | null
    const docFile = fd.get('doc') as File | null

    let logoS3Key: string | null = null
    let docS3Key: string | null = null

    const { businessId, userId, token } = await transaction(async (client) => {
      const bizRes = await client.query(
        `INSERT INTO businesses (name, slug, industry, country, city, website, description, services)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [businessName, slug, industry, country, city ?? null, website ?? null, description ?? null, services ?? []]
      )
      const businessId = bizRes.rows[0].id as string

      const userRes = await client.query(
        `INSERT INTO users (business_id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, 'business_admin')
         RETURNING id`,
        [businessId, email, name, passwordHash]
      )
      const userId = userRes.rows[0].id as string

      const tokenRes = await client.query(
        `INSERT INTO verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'email_verify', NOW() + INTERVAL '48 hours')
         RETURNING token`,
        [userId, require('crypto').randomBytes(32).toString('hex')]
      )

      return { businessId, userId, token: tokenRes.rows[0].token as string }
    })

    // Upload files after DB commit
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split('.').pop() ?? 'jpg'
      const buf = Buffer.from(await logoFile.arrayBuffer())
      logoS3Key = await uploadFile(buildLogoKey(businessId, ext), buf, logoFile.type)
      await query(`UPDATE businesses SET logo_s3_key = $1 WHERE id = $2`, [logoS3Key, businessId])
    }

    if (docFile && docFile.size > 0) {
      const buf = Buffer.from(await docFile.arrayBuffer())
      docS3Key = await uploadFile(buildDocKey(businessId), buf, 'application/pdf')
      await query(`UPDATE businesses SET verification_doc_s3_key = $1 WHERE id = $2`, [docS3Key, businessId])
    }

    // Email send is best-effort — SES may be in sandbox; don't fail registration over it
    try {
      await sendVerificationEmail(email, name, token)
    } catch (emailErr) {
      console.warn('[register] email send failed (SES sandbox?):', emailErr)
    }

    return NextResponse.json({ success: true, message: 'Registration complete. Check your email to verify your account.' })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
