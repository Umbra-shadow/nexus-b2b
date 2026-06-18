import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'
import { DeleteBusinessButton } from '@/components/admin/DeleteButton'
import { VerificationActions } from '@/components/admin/VerificationActions'

export const metadata = { title: 'Business Detail — System Admin' }

interface BizDetail {
  id: string
  name: string
  slug: string
  industry: string
  country: string
  city: string | null
  description: string | null
  website: string | null
  verification_status: string
  verification_doc_s3_key: string | null
  contact_email: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_swift: string | null
  created_at: string
}

interface MemberRow {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

interface SessionCount { count: string }
interface ReceiptCount { count: string }

const INDUSTRIES = ['technology', 'finance', 'healthcare', 'manufacturing', 'logistics', 'retail', 'energy', 'agriculture', 'legal', 'other']

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { id } = await params

  const [biz, members, sessionCount, receiptCount] = await Promise.all([
    queryOne<BizDetail>(`SELECT * FROM businesses WHERE id = $1`, [id]),
    query<MemberRow>(`SELECT id, name, email, role, is_active FROM users WHERE business_id = $1 ORDER BY role, name`, [id]),
    query<SessionCount>(`SELECT COUNT(*)::text as count FROM sessions WHERE initiator_business_id = $1 OR receiver_business_id = $1`, [id]),
    query<ReceiptCount>(`SELECT COUNT(*)::text as count FROM receipts WHERE issuer_business_id = $1 OR receiver_business_id = $1`, [id]),
  ])

  if (!biz) redirect('/admin/businesses')

  const sessions = parseInt(sessionCount[0]?.count ?? '0')
  const receipts = parseInt(receiptCount[0]?.count ?? '0')

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 16 }}>
        <Link href="/admin/businesses" style={{ color: '#c44b1b', textDecoration: 'none' }}>← Businesses</Link>
        {' / '}{biz.name}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', textTransform: 'uppercase', marginBottom: 10 }}>
            {biz.name}
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
            {biz.industry} · {biz.country}{biz.city ? `, ${biz.city}` : ''} · {formatDate(biz.created_at)}
          </div>
        </div>
        <DeleteBusinessButton id={biz.id} name={biz.name} />
      </div>

      {/* Verification action strip */}
      <div style={{ border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
        {/* Doc link — always visible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Verification doc</div>
          {biz.verification_doc_s3_key ? (
            <a
              href={`/api/admin/businesses/${biz.id}/document`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none', padding: '7px 14px', border: '1px solid rgba(196,75,27,0.35)', display: 'inline-block', whiteSpace: 'nowrap' }}
            >
              📄 View document ↗
            </a>
          ) : (
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', fontStyle: 'italic' }}>No document uploaded</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--nx-line)', alignSelf: 'stretch' }} />

        {/* Approve / Reject / Request info */}
        <VerificationActions
          businessId={biz.id}
          initialStatus={biz.verification_status as 'pending' | 'verified' | 'rejected'}
        />
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--nx-border)', marginBottom: 32 }}>
        {[
          { label: 'Members', value: members.length },
          { label: 'Sessions', value: sessions },
          { label: 'Receipts', value: receipts },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '20px 24px', borderRight: i < 2 ? '1px solid var(--nx-border)' : undefined }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Edit form */}
        <div style={{ border: '1px solid var(--nx-border)', padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 20 }}>Edit Business</div>
          <form action={`/api/admin/businesses/${biz.id}`} method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="hidden" name="_method" value="PATCH" />

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Name</span>
              <input name="name" defaultValue={biz.name} required style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Business Contact Email</span>
              <input name="contact_email" type="email" defaultValue={biz.contact_email ?? ''} placeholder="info@company.com" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>Session invitations go here (falls back to admin email if blank)</span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Industry</span>
              <select name="industry" defaultValue={biz.industry} className="nx-select" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }}>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Country (2-letter)</span>
                <input name="country" defaultValue={biz.country} maxLength={2} required style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none', textTransform: 'uppercase' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>City</span>
                <input name="city" defaultValue={biz.city ?? ''} style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }} />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Website</span>
              <input name="website" defaultValue={biz.website ?? ''} type="url" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Description</span>
              <textarea name="description" defaultValue={biz.description ?? ''} rows={3} style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none', resize: 'vertical' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Verification Status</span>
              <select name="verification_status" defaultValue={biz.verification_status} className="nx-select" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', outline: 'none' }}>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 20px', border: '1px solid #c44b1b', color: '#fff', background: '#c44b1b', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4 }}>
              Save Changes →
            </button>
          </form>
        </div>

        {/* Right column: members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Members */}
          <div style={{ border: '1px solid var(--nx-border)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)' }}>Members ({members.length})</div>
              <Link href={`/admin/users/${biz.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', textDecoration: 'none', letterSpacing: '0.08em' }}>Manage →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < members.length - 1 ? '1px solid var(--nx-line)' : undefined }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: m.is_active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)' }}>{m.email}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', border: '1px solid var(--nx-border)', color: m.role === 'business_admin' ? '#c44b1b' : 'var(--nx-muted)' }}>
                    {m.role.replace('business_', '')}
                  </span>
                </div>
              ))}
              {members.length === 0 && <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', fontStyle: 'italic' }}>No members.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
