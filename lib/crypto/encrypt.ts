import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? '', 'hex')
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'base64')

  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  return decipher.update(encrypted) + decipher.final('utf8')
}

export function encryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null
  return encrypt(value)
}

export function decryptIfPresent(value: string | null | undefined): string | null {
  if (!value) return null
  return decrypt(value)
}
