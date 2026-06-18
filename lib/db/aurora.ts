import { Pool, type PoolClient } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // Aurora Serverless can take ~30s to warm from idle
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

// pg-pool wraps connection errors in AggregateError; ETIMEDOUT lives inside .errors[]
function isConnectionError(err: unknown): boolean {
  const codes = ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET']
  if (err instanceof AggregateError) {
    return (err.errors ?? []).some(
      (e: { code?: string }) => codes.includes(e?.code ?? '')
    )
  }
  return codes.includes((err as NodeJS.ErrnoException)?.code ?? '')
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  // Aurora Serverless v2 can take ~20-30s to wake from idle.
  // Retry once: drain the stale pool, wait 10s, then try with a fresh connection.
  for (let attempt = 1; attempt <= 2; attempt++) {
    let client
    try {
      client = await getPool().connect()
      const result = await client.query(text, params)
      return result.rows as T[]
    } catch (err: unknown) {
      if (isConnectionError(err) && attempt === 1) {
        await pool?.end().catch(() => {})
        pool = null
        await new Promise((r) => setTimeout(r, 10000))
        continue
      }
      throw err
    } finally {
      try { client?.release() } catch { /* already released */ }
    }
  }
  throw new Error('Query failed after retry')
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
