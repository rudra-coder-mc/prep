import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * The connection is created on first use rather than at import time. Next
 * imports route modules during the build, where DATABASE_URL is absent and
 * connecting would be both impossible and pointless.
 */
type Client = ReturnType<typeof postgres>
type Database = ReturnType<typeof drizzle<typeof schema>>

let cachedClient: Client | undefined
let cachedDb: Database | undefined

export function getClient(): Client {
  if (!cachedClient) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    cachedClient = postgres(url, { max: 10 })
  }
  return cachedClient
}

export function getDb(): Database {
  if (!cachedDb) cachedDb = drizzle(getClient(), { schema })
  return cachedDb
}

/** Behaves like the Drizzle instance but defers connecting until first access. */
export const db = new Proxy({} as Database, {
  get: (_target, property, receiver) => Reflect.get(getDb(), property, receiver),
  has: (_target, property) => Reflect.has(getDb(), property),
})

export async function closeConnection() {
  await cachedClient?.end()
  cachedClient = undefined
  cachedDb = undefined
}

export type Db = Database
