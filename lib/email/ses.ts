import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const FROM = `${process.env.SES_FROM_NAME ?? 'NexusB2B'} <${process.env.SES_FROM_EMAIL ?? 'no-reply@nexusb2b.io'}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function sendEmail(to: string, subject: string, html: string, text: string) {
  await ses.send(
    new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    })
  )
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${APP_URL}/auth/verify-email/${token}`

  await sendEmail(
    to,
    'Verify your NexusB2B account',
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111;margin-bottom:4px">Verify your email</h2>
      <p style="color:#6B6B6B">Hi ${name}, welcome to NexusB2B.</p>
      <p>Click below to verify your email address and activate your account:</p>
      <a href="${link}" style="display:inline-block;background:#7C5C3E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0">Verify Email</a>
      <p style="color:#6B6B6B;font-size:13px;margin-top:20px">This link expires in 48 hours. If you didn't register, ignore this email.</p>
    </div>`,
    `Hi ${name},\n\nVerify your NexusB2B account:\n${link}\n\nExpires in 48 hours.`
  )
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const link = `${APP_URL}/auth/reset-password/${token}`

  await sendEmail(
    to,
    'Reset your NexusB2B password',
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111;margin-bottom:4px">Reset your password</h2>
      <p style="color:#6B6B6B">Hi ${name},</p>
      <p>Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${link}" style="display:inline-block;background:#7C5C3E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0">Reset Password</a>
      <p style="color:#6B6B6B;font-size:13px;margin-top:20px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
    `Hi ${name},\n\nReset your NexusB2B password:\n${link}\n\nExpires in 1 hour.`
  )
}

export async function sendSessionInvitation(params: {
  to: string
  inviterBusinessName: string
  inviterDescription: string
  receiverBusinessName: string
  searchContext?: string
  token: string
}): Promise<void> {
  const link = `${APP_URL}/sessions/accept/${params.token}`

  await sendEmail(
    params.to,
    `${params.inviterBusinessName} wants to connect with you on NexusB2B`,
    `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <p style="color:#6B6B6B;font-size:13px;margin-bottom:20px">NexusB2B — The Verified B2B Exchange</p>
      <h2 style="color:#111;margin-bottom:4px">New connection request</h2>
      <p><strong>${params.inviterBusinessName}</strong> is reaching out to <strong>${params.receiverBusinessName}</strong>.</p>
      ${params.inviterDescription ? `<p style="color:#6B6B6B">${params.inviterDescription}</p>` : ''}
      ${params.searchContext ? `<p><em>They are looking for: ${params.searchContext}</em></p>` : ''}
      <p>Accept to open a private, AI-assisted deal session on the platform.</p>
      <a href="${link}" style="display:inline-block;background:#7C5C3E;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">Accept &amp; Open Session</a>
      <p style="color:#6B6B6B;font-size:13px;margin-top:20px">This invitation expires in 48 hours.</p>
    </div>`,
    `${params.inviterBusinessName} wants to connect with you on NexusB2B.\n\n${params.searchContext ? `They are looking for: ${params.searchContext}\n\n` : ''}Accept here:\n${link}\n\nExpires in 48 hours.`
  )
}

export async function sendTeamInvite(
  to: string,
  inviterName: string,
  businessName: string,
  token: string
): Promise<void> {
  const link = `${APP_URL}/auth/accept-invite/${token}`

  await sendEmail(
    to,
    `You've been invited to join ${businessName} on NexusB2B`,
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111;margin-bottom:4px">Team invitation</h2>
      <p>${inviterName} has invited you to join <strong>${businessName}</strong> on NexusB2B.</p>
      <a href="${link}" style="display:inline-block;background:#7C5C3E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0">Accept Invitation</a>
      <p style="color:#6B6B6B;font-size:13px;margin-top:20px">This link expires in 48 hours.</p>
    </div>`,
    `${inviterName} invited you to join ${businessName} on NexusB2B.\n\nAccept here:\n${link}\n\nExpires in 48 hours.`
  )
}

export async function sendVerificationResult(
  to: string,
  businessName: string,
  approved: boolean,
  reason?: string
): Promise<void> {
  const subject = approved
    ? `✅ ${businessName} is now verified on NexusB2B`
    : `Action required: ${businessName} verification update`

  const html = approved
    ? `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">Your business is verified!</h2>
        <p><strong>${businessName}</strong> has been verified on NexusB2B. You now appear in search results and can receive connection requests.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#7C5C3E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0">Go to Dashboard</a>
      </div>`
    : `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Verification requires attention</h2>
        <p>Your verification for <strong>${businessName}</strong> could not be completed.${reason ? ` Reason: ${reason}` : ''}</p>
        <p>Please log in and resubmit your business documentation.</p>
        <a href="${APP_URL}/settings/business" style="display:inline-block;background:#7C5C3E;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:8px 0">Update Documentation</a>
      </div>`

  await sendEmail(to, subject, html, html.replace(/<[^>]+>/g, ''))
}
