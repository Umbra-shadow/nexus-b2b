import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API)
const APP_URL = (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const FROM = process.env.RESEND_FROM?.trim() || `NexusB2B <onboarding@resend.dev>`

async function sendEmail(to: string, subject: string, html: string): Promise<string> {
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, headers: { 'X-Entity-Ref-ID': Date.now().toString() } })
  if (error) throw new Error(error.message)
  console.log(`[email] sent to=${to} subject="${subject}" resend_id=${data?.id ?? 'unknown'}`)
  return data?.id ?? ''
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/auth/verify-email/${token}`
  await sendEmail(
    to,
    'Verify your NexusB2B account',
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#111;margin-bottom:4px;font-size:22px">Verify your email</h2>
      <p style="color:#555">Hi ${name}, welcome to NexusB2B.</p>
      <p style="color:#555">Click below to verify your email address and activate your account:</p>
      <a href="${link}" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
        Verify Email →
      </a>
      <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 48 hours. If you didn't register, ignore this email.</p>
    </div>`
  )
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${APP_URL}/auth/reset-password/${token}`
  await sendEmail(
    to,
    'Reset your NexusB2B password',
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#111;margin-bottom:4px;font-size:22px">Reset your password</h2>
      <p style="color:#555">Hi ${name},</p>
      <p style="color:#555">Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${link}" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
        Reset Password →
      </a>
      <p style="color:#999;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
    </div>`
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
    `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;margin-bottom:24px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase">NexusB2B — The Verified B2B Exchange</p>
      <h2 style="color:#111;margin-bottom:8px;font-size:22px">New connection request</h2>
      <p style="color:#555"><strong>${params.inviterBusinessName}</strong> is reaching out to <strong>${params.receiverBusinessName}</strong>.</p>
      ${params.inviterDescription ? `<p style="color:#666">${params.inviterDescription}</p>` : ''}
      ${params.searchContext ? `<p style="color:#555"><em>They are looking for: ${params.searchContext}</em></p>` : ''}
      <p style="color:#555">Accept to open a private, AI-assisted deal session.</p>
      <a href="${link}" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:16px 0">
        Accept &amp; Open Session →
      </a>
      <p style="color:#999;font-size:13px;margin-top:24px">This invitation expires in 48 hours.</p>
    </div>`
  )
}

export async function sendTeamInvite(to: string, inviterName: string, businessName: string, token: string): Promise<void> {
  const link = `${APP_URL}/auth/accept-invite/${token}`
  await sendEmail(
    to,
    `You've been invited to join ${businessName} on NexusB2B`,
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <h2 style="color:#111;margin-bottom:8px;font-size:22px">Team invitation</h2>
      <p style="color:#555"><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> on NexusB2B.</p>
      <p style="color:#555">Click below to set up your account and join the team:</p>
      <a href="${link}" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
        Accept Invitation →
      </a>
      <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 48 hours.</p>
    </div>`
  )
}

export async function sendTestEmail(to: string): Promise<{ id: string; from: string; to: string }> {
  const id = await sendEmail(
    to,
    'NexusB2B — email delivery test',
    `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px">NexusB2B — Admin Diagnostic</p>
      <h2 style="color:#111;font-size:20px;margin-bottom:8px">Email delivery test</h2>
      <p style="color:#555">If you received this, Resend is delivering emails correctly from <strong>${FROM}</strong>.</p>
    </div>`
  )
  return { id, from: FROM, to }
}

export async function sendNewBusinessNotification(params: {
  businessId: string
  businessName: string
  industry: string
  country: string
  city: string | null
  website: string | null
  contactEmail: string
  adminName: string
  adminEmail: string
}): Promise<void> {
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL
  if (!adminEmail) return

  const reviewLink = `${APP_URL}/admin/businesses/${params.businessId}`

  await sendEmail(
    adminEmail,
    `New registration: ${params.businessName} is awaiting verification`,
    `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;margin-bottom:24px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase">NexusB2B — Platform Admin</p>
      <h2 style="color:#111;margin-bottom:4px;font-size:22px">New business registration</h2>
      <p style="color:#555">A new business has submitted a registration request and is waiting for verification.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace;width:140px">Business</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px;font-weight:600">${params.businessName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace">Industry</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px">${params.industry}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace">Location</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px">${params.city ? `${params.city}, ` : ''}${params.country}</td></tr>
        ${params.website ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace">Website</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px"><a href="${params.website}" style="color:#c44b1b">${params.website}</a></td></tr>` : ''}
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace">Contact email</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px">${params.contactEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;font-family:monospace">Admin account</td><td style="padding:8px 0;color:#111;font-size:13px">${params.adminName} &lt;${params.adminEmail}&gt;</td></tr>
      </table>
      <a href="${reviewLink}" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:8px 0">
        Review &amp; Verify →
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px">Go to Admin → Businesses to approve or reject this registration.</p>
    </div>`
  )
}

export async function sendInfoRequest(to: string, adminName: string, businessName: string, message: string): Promise<void> {
  await sendEmail(
    to,
    `Action required: additional information needed for ${businessName}`,
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;margin-bottom:24px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase">NexusB2B — Platform Admin</p>
      <h2 style="color:#111;margin-bottom:8px;font-size:22px">Additional information required</h2>
      <p style="color:#555">Hi ${adminName},</p>
      <p style="color:#555">We are reviewing your registration for <strong>${businessName}</strong> and need a bit more information before we can proceed:</p>
      <blockquote style="border-left:3px solid #c44b1b;margin:16px 0;padding:12px 16px;color:#333;font-style:italic">${message}</blockquote>
      <p style="color:#555">Please log in and update your business profile or reply to this email with the requested details.</p>
      <a href="${APP_URL}/settings/business" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
        Update Profile →
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px">NexusB2B Team</p>
    </div>`
  )
}

export async function sendVerificationResult(to: string, businessName: string, approved: boolean, reason?: string): Promise<void> {
  const subject = approved
    ? `✅ ${businessName} is now verified on NexusB2B`
    : `Action required: ${businessName} verification update`

  const html = approved
    ? `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#16a34a;font-size:22px">Your business is verified!</h2>
        <p style="color:#555"><strong>${businessName}</strong> is now verified on NexusB2B. You appear in search results and can receive connection requests.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
          Go to Dashboard →
        </a>
      </div>`
    : `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#dc2626;font-size:22px">Verification requires attention</h2>
        <p style="color:#555">Your verification for <strong>${businessName}</strong> could not be completed.${reason ? ` Reason: ${reason}` : ''}</p>
        <p style="color:#555">Please log in and resubmit your business documentation.</p>
        <a href="${APP_URL}/settings/business" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
          Update Documentation →
        </a>
      </div>`

  await sendEmail(to, subject, html)
}
