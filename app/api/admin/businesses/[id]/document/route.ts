import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface Params { params: Promise<{ id: string }> }

const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const biz = await queryOne<{ verification_doc_s3_key: string | null }>(
    `SELECT verification_doc_s3_key FROM businesses WHERE id = $1`, [id]
  )

  if (!biz?.verification_doc_s3_key) {
    return NextResponse.json({ error: 'No document' }, { status: 404 })
  }

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: biz.verification_doc_s3_key }),
    { expiresIn: 300 }
  )

  return NextResponse.redirect(url)
}
