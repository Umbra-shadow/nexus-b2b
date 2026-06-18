import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendVerificationResult } from '@/lib/email/ses'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

interface Params { params: Promise<{ id: string }> }

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const FROM = `${process.env.SES_FROM_NAME ?? 'NexusB2B'} <${process.env.SES_FROM_EMAIL ?? 'no-reply@nexusb2b.io'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const fd = await req.formData()
  const action = fd.get('action') as 'approve' | 'reject' | 'request_info'
  const reason = (fd.get('reason') as string) ?? undefined

  const biz = await queryOne<{ name: string; admin_email: string }>(
    `SELECT b.name, u.email as admin_email
     FROM businesses b
     JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
     WHERE b.id = $1`,
    [id]
  )

  if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  if (action === 'request_info') {
    // Send email to business admin requesting more information; don't change status
    try {
      await ses.send(
        new SendEmailCommand({
          Source: FROM,
          Destination: { ToAddresses: [biz.admin_email] },
          Message: {
            Subject: { Data: `Additional information required for ${biz.name} — NexusB2B`, Charset: 'UTF-8' },
            Body: {
              Html: {
                Data: `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
                  <h2 style="color:#111;margin-bottom:4px">Additional information required</h2>
                  <p>Thank you for registering <strong>${biz.name}</strong> on NexusB2B.</p>
                  <p>Our verification team has reviewed your submission and requires additional information before we can complete your business verification.</p>
                  ${reason ? `<div style="background:#fef3ed;border-left:3px solid #c44b1b;padding:12px 16px;margin:16px 0"><p style="margin:0;color:#7a2a0a"><strong>Our team notes:</strong></p><p style="margin:8px 0 0;color:#7a2a0a">${reason}</p></div>` : ''}
                  <p>Please log in and update your business documentation to complete verification.</p>
                  <a href="${APP_URL}/settings/business" style="display:inline-block;background:#c44b1b;color:#fff;padding:12px 24px;text-decoration:none;font-weight:600;margin:8px 0">Update Business Profile</a>
                  <p style="color:#6B6B6B;font-size:13px;margin-top:20px">If you have questions, reply to this email and our team will assist you.</p>
                </div>`,
                Charset: 'UTF-8',
              },
              Text: {
                Data: `Additional information required for ${biz.name} verification on NexusB2B.\n\n${reason ? `Our team notes:\n${reason}\n\n` : ''}Please update your business documentation at: ${APP_URL}/settings/business`,
                Charset: 'UTF-8',
              },
            },
          },
        })
      )
    } catch (err) {
      // SES sandbox may block — log but don't fail the request
      console.error('[admin/verify] Failed to send request_info email:', err)
    }

    return NextResponse.redirect(new URL('/admin/businesses', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // approve or reject
  const status = action === 'approve' ? 'verified' : 'rejected'
  await query(`UPDATE businesses SET verification_status = $1 WHERE id = $2`, [status, id])

  try {
    await sendVerificationResult(biz.admin_email, biz.name, action === 'approve', reason)
  } catch (err) {
    console.error('[admin/verify] Failed to send verification result email:', err)
  }

  return NextResponse.redirect(new URL('/admin/businesses', process.env.NEXT_PUBLIC_APP_URL!))
}
