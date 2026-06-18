import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { getMessages } from '@/lib/db/dynamo'

interface SessionInfo {
  id: string
  status: string
  created_at: string
  accepted_at: string | null
  closed_at: string | null
  initiator_name: string
  initiator_country: string
  receiver_name: string
  receiver_country: string
  search_context: string | null
}

export default async function SessionExportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { id } = await params

  const [info, messages] = await Promise.all([
    queryOne<SessionInfo>(`
      SELECT s.id, s.status, s.created_at, s.accepted_at, s.closed_at, s.search_context,
             ib.name as initiator_name, ib.country as initiator_country,
             rb.name as receiver_name, rb.country as receiver_country
      FROM sessions s
      JOIN businesses ib ON ib.id = s.initiator_business_id
      JOIN businesses rb ON rb.id = s.receiver_business_id
      WHERE s.id = $1
    `, [id]),
    getMessages(id, 500),
  ])

  if (!info) redirect('/admin/sessions')

  const date = new Date(info.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <html lang="en">
      <head>
        <title>{`Session ${id.slice(0, 8).toUpperCase()} — NexusB2B Export`}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; background: #fff; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
          @media print { body { padding: 0; } .no-print { display: none !important; } }
          .mono { font-family: 'Courier New', monospace; }
          .label { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; }
          .msg { padding: 12px 0; border-bottom: 1px solid #eee; }
          .msg-meta { display: flex; align-items: baseline; gap: 10px; margin-bottom: 5px; }
          .sender { font-size: 13px; font-weight: bold; }
          .time { font-family: 'Courier New', monospace; font-size: 10px; color: #888; }
          .content { font-size: 14px; line-height: 1.65; color: #333; }
          .system-msg { font-family: 'Courier New', monospace; font-size: 11px; color: #999; font-style: italic; }
          .print-btn { display: inline-block; margin-top: 32px; padding: 12px 24px; background: #c44b1b; color: #fff; border: none; cursor: pointer; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
            </div>
            <div className="label">Session Transcript — Confidential</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ marginBottom: 4 }}>Session ID</div>
            <div className="mono" style={{ fontSize: 13, letterSpacing: '0.08em' }}>{id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Session meta */}
        <div style={{ padding: '16px 0', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div className="label" style={{ marginBottom: 5 }}>Initiator</div>
            <div style={{ fontSize: 15 }}>{info.initiator_name}</div>
            <div className="label">{info.initiator_country}</div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 5 }}>Receiver</div>
            <div style={{ fontSize: 15 }}>{info.receiver_name}</div>
            <div className="label">{info.receiver_country}</div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 5 }}>Status / Date</div>
            <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase' }}>{info.status}</div>
            <div className="label">{date}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ marginBottom: 40 }}>
          <div className="label" style={{ marginBottom: 16 }}>{messages.length} messages</div>
          {messages.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#888', fontSize: 14 }}>No messages in this session.</div>
          ) : (
            messages.map((msg) => {
              const t = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              const d = new Date(msg.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
              const isSystem = msg.type === 'system' || msg.type === 'ai_response'
              return (
                <div key={msg.message_id} className="msg">
                  {isSystem ? (
                    <div className="system-msg">[{msg.type === 'ai_response' ? 'AI' : 'System'}] {msg.content}</div>
                  ) : (
                    <>
                      <div className="msg-meta">
                        <span className="sender">{msg.sender_name}</span>
                        <span className="mono" style={{ fontSize: 10, color: '#999' }}>{msg.sender_business}</span>
                        <span className="time">{d} {t}</span>
                      </div>
                      <div className="content">{msg.content}</div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 20, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
          <div className="mono" style={{ fontSize: 9, color: '#999', letterSpacing: '0.08em' }}>
            Generated by NexusB2B System Admin · {new Date().toISOString().slice(0, 10)}
          </div>
          <div className="mono" style={{ fontSize: 9, color: '#999', letterSpacing: '0.08em' }}>
            CONFIDENTIAL — For authorised use only
          </div>
        </div>

        <div className="no-print">
          <button id="print-btn" className="print-btn">⬇ Print / Download PDF</button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn').onclick=function(){window.print()}` }} />
      </body>
    </html>
  )
}
