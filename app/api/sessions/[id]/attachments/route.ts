import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { uploadFile, validateDocFile } from '@/lib/s3/upload'
import { putMessage } from '@/lib/db/dynamo'
import { ulid } from 'ulid'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const row = await queryOne<{
    status: string
    initiator_business_id: string
    receiver_business_id: string
    ib_name: string
    rb_name: string
  }>(
    `SELECT s.status, s.initiator_business_id, s.receiver_business_id,
            ib.name as ib_name, rb.name as rb_name
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     WHERE s.id = $1`,
    [id]
  )

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.status === 'closed') return NextResponse.json({ error: 'Session is closed' }, { status: 400 })

  const uid = session.user.businessId
  if (row.initiator_business_id !== uid && row.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const validationError = validateDocFile(file)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 422 })

  const key = `sessions/${id}/attachments/${ulid()}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())
  await uploadFile(key, buffer, 'application/pdf')

  const senderBizName = uid === row.initiator_business_id ? row.ib_name : row.rb_name

  const msg = await putMessage({
    session_id: id,
    sender_id: session.user.id,
    sender_name: session.user.name,
    sender_business: senderBizName,
    content: file.name,
    type: 'attachment',
    attachment_key: key,
    attachment_name: file.name,
    attachment_size: file.size,
  })

  return NextResponse.json({ message: msg }, { status: 201 })
}
