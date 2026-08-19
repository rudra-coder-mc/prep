import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function connectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return url
}

/** Long-lived pool for the application. */
export const client = postgres(connectionString(), { max: 10 })
export const db = drizzle(client, { schema })

export type Db = typeof db
