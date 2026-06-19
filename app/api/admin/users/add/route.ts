import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

const APP_URL = (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

function getResend() {
  return new Resend(process.env.RESEND_API)
}
function getFrom() {
  return process.env.RESEND_FROM?.trim() || 'NexusB2B <onboarding@resend.dev>'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fd = await req.formData()
  const businessId = fd.get('business_id') as string
  const name = (fd.get('name') as string)?.trim()
  const email = (fd.get('email') as string)?.trim().toLowerCase()
  const role = (fd.get('role') as string) ?? 'business_agent'
  const tempPassword = (fd.get('temp_password') as string)?.trim()

  if (!businessId || !name || !email || !tempPassword) {
    return NextResponse.redirect(new URL(`/admin/users/${businessId}?error=missing`, APP_URL))
  }

  const biz = await queryOne<{ name: string }>(`SELECT name FROM businesses WHERE id = $1`, [businessId])
  if (!biz) return NextResponse.redirect(new URL(`/admin/users?error=notfound`, APP_URL))

  const existing = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email])
  if (existing) {
    return NextResponse.redirect(new URL(`/admin/users/${businessId}?error=exists`, APP_URL))
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12)
  await query(
    `INSERT INTO users (business_id, email, name, password_hash, role, is_active, email_verified)
     VALUES ($1, $2, $3, $4, $5::user_role, true, true)`,
    [businessId, email, name, passwordHash, role]
  )

  // Send welcome email (non-fatal)
  try {
    await getResend().emails.send({
      from: getFrom(),
      to: email,
      subject: `You've been added to ${biz.name} on NexusB2B`,
      html: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#111;margin-bottom:8px">Welcome to NexusB2B</h2>
        <p>You've been added as a <strong>${role.replace('business_', '')}</strong> of <strong>${biz.name}</strong>.</p>
        <p style="margin-top:16px"><strong>Your login credentials:</strong></p>
        <ul style="color:#444;line-height:1.8">
          <li>Email: ${email}</li>
          <li>Temporary password: <code style="background:#f5f5f5;padding:2px 6px">${tempPassword}</code></li>
        </ul>
        <p>Please log in and change your password as soon as possible.</p>
        <a href="${APP_URL}/auth/login" style="display:inline-block;background:#c44b1b;color:#fff;padding:12px 24px;text-decoration:none;margin-top:12px">Log in →</a>
      </div>`,
      text: `You've been added to ${biz.name} on NexusB2B.\nEmail: ${email}\nTemp password: ${tempPassword}\nLogin: ${APP_URL}/auth/login`,
    })
  } catch {
    // swallow — user was still created, email is best-effort
  }

  return NextResponse.redirect(new URL(`/admin/users/${businessId}?added=1`, APP_URL))
}
