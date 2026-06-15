import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.S3_BUCKET_NAME ?? 'nexusb2b-uploads'

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const ALLOWED_DOC_TYPES = ['application/pdf']
const MAX_LOGO_BYTES = 2 * 1024 * 1024
const MAX_DOC_BYTES = 5 * 1024 * 1024

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) return 'Logo must be PNG, JPG, or WebP'
  if (file.size > MAX_LOGO_BYTES) return 'Logo must be under 2MB'
  return null
}

export function validateDocFile(file: File): string | null {
  if (!ALLOWED_DOC_TYPES.includes(file.type)) return 'Document must be a PDF'
  if (file.size > MAX_DOC_BYTES) return 'Document must be under 5MB'
  return null
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    })
  )
  return key
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  )
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export function buildLogoKey(businessId: string, ext: string): string {
  return `businesses/${businessId}/logo.${ext}`
}

export function buildDocKey(businessId: string): string {
  return `businesses/${businessId}/verification.pdf`
}
