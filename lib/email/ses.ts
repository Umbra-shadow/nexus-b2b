import { Resend } from 'resend'

// Resolved at runtime so missing env vars don't crash the build's static analysis phase
function getClient() {
  return new Resend(process.env.RESEND_API)
}
function getFrom() {
  return process.env.RESEND_FROM?.trim() || 'NexusB2B <onboarding@resend.dev>'
}
function getAppUrl() {
  return (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<string> {
  const { data, error } = await getClient().emails.send({
    from: getFrom(), to, subject, html, text,
    headers: { 'X-Entity-Ref-ID': Date.now().toString() },
  })
  if (error) throw new Error(error.message)
  console.log(`[email] sent to=${to} subject="${subject}" resend_id=${data?.id ?? 'unknown'}`)
  return data?.id ?? ''
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${getAppUrl()}/auth/verify-email/${token}`
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
      <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 7 days. If you didn't register, ignore this email.</p>
    </div>`
  )
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${getAppUrl()}/auth/reset-password/${token}`
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
  const link = `${getAppUrl()}/sessions/accept/${params.token}`
  const subject = `${params.inviterBusinessName} sent you a business session request`

  const contextLine = params.searchContext ? `\nThey are specifically looking for: ${params.searchContext}\n` : ''
  const descLine = params.inviterDescription ? `\nAbout them: ${params.inviterDescription}\n` : ''

  const text = `Hello,

${params.inviterBusinessName} has sent a session request to ${params.receiverBusinessName} on NexusB2B.
${descLine}${contextLine}
To review and accept this request, visit:
${link}

This link expires in 7 days. If you were not expecting this, you can ignore it.

— NexusB2B Team
`

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#222">
    <p style="margin:0 0 16px;font-size:14px;color:#555">NexusB2B · Business session request</p>
    <p style="margin:0 0 12px">Hello,</p>
    <p style="margin:0 0 12px"><strong>${params.inviterBusinessName}</strong> has sent a session request to <strong>${params.receiverBusinessName}</strong>.</p>
    ${params.inviterDescription ? `<p style="margin:0 0 12px;color:#444">${params.inviterDescription}</p>` : ''}
    ${params.searchContext ? `<p style="margin:0 0 12px;color:#444">They are looking for: <em>${params.searchContext}</em></p>` : ''}
    <p style="margin:16px 0">
      <a href="${link}" style="background:#c44b1b;color:#fff;padding:10px 20px;text-decoration:none;font-size:14px;display:inline-block">Accept &amp; Open Session</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#888">This link expires in 7 days. If you were not expecting this, you can ignore it.</p>
  </div>`

  await sendEmail(params.to, subject, html, text)
}

export async function sendTeamInvite(to: string, inviterName: string, businessName: string, token: string): Promise<void> {
  const link = `${getAppUrl()}/auth/accept-invite/${token}`
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
      <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 7 days.</p>
    </div>`
  )
}

export async function sendBusinessWelcome(to: string, businessName: string, adminName: string): Promise<void> {
  await sendEmail(
    to,
    `${businessName} is now registered on NexusB2B`,
    `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;margin-bottom:24px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase">NexusB2B — The Verified B2B Exchange</p>
      <h2 style="color:#111;margin-bottom:8px;font-size:22px">${businessName} is on NexusB2B</h2>
      <p style="color:#555">${adminName} has registered <strong>${businessName}</strong> on NexusB2B.</p>
      <p style="color:#555">This is the contact address on file for your business. Session invitations and partnership requests from other verified businesses will be delivered here.</p>
      <p style="color:#555">Your registration is currently <strong>pending verification</strong>. You will receive another email once the platform team has reviewed your submission.</p>
      <a href="${getAppUrl()}/dashboard" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
        Go to Dashboard →
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px">If your business did not register on NexusB2B, please ignore this email.</p>
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
      <p style="color:#555">If you received this, Resend is delivering emails correctly from <strong>${getFrom()}</strong>.</p>
    </div>`
  )
  return { id, from: getFrom(), to }
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

  const reviewLink = `${getAppUrl()}/admin/businesses/${params.businessId}`

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

export async function sendChangeRequestNotification(params: {
  type: 'update_info' | 'delete_business'
  requestId: string
  businessName: string
  requesterName: string
  requesterEmail: string
}): Promise<void> {
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL
  if (!adminEmail) return

  const reviewLink = `${getAppUrl()}/admin/requests`
  const typeLabel = params.type === 'delete_business' ? 'Business Deletion Request' : 'Profile Update Request'
  const typeColor = params.type === 'delete_business' ? '#8b1c1c' : '#c44b1b'

  await sendEmail(
    adminEmail,
    `[NexusB2B] ${typeLabel} — ${params.businessName}`,
    `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
      <p style="color:#999;font-size:12px;margin-bottom:24px;font-family:monospace;letter-spacing:0.1em;text-transform:uppercase">NexusB2B — Platform Admin</p>
      <h2 style="color:${typeColor};margin-bottom:4px;font-size:22px">${typeLabel}</h2>
      <p style="color:#555">A verified business has submitted a request that requires your review.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0">
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace;width:140px">Business</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px;font-weight:600">${params.businessName}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#999;font-size:13px;font-family:monospace">Submitted by</td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111;font-size:13px">${params.requesterName} &lt;${params.requesterEmail}&gt;</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;font-family:monospace">Request type</td><td style="padding:8px 0;color:${typeColor};font-size:13px;font-family:monospace;text-transform:uppercase;letter-spacing:0.08em">${params.type.replace('_', ' ')}</td></tr>
      </table>
      <a href="${reviewLink}" style="display:inline-block;background:${typeColor};color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:8px 0">
        Review Request →
      </a>
      <p style="color:#999;font-size:12px;margin-top:24px">Go to Admin → Requests to approve or reject this submission.</p>
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
      <a href="${getAppUrl()}/settings/business" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
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
        <a href="${getAppUrl()}/dashboard" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
          Go to Dashboard →
        </a>
      </div>`
    : `<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px">
        <h2 style="color:#dc2626;font-size:22px">Verification requires attention</h2>
        <p style="color:#555">Your verification for <strong>${businessName}</strong> could not be completed.${reason ? ` Reason: ${reason}` : ''}</p>
        <p style="color:#555">Please log in and resubmit your business documentation.</p>
        <a href="${getAppUrl()}/settings/business" style="display:inline-block;background:#c44b1b;color:#fff;padding:14px 28px;text-decoration:none;font-family:monospace;font-size:13px;margin:12px 0">
          Update Documentation →
        </a>
      </div>`

  await sendEmail(to, subject, html)
}
