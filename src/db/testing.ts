import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Integration-test support. Each caller gets its own freshly migrated database
 * so tests never see each other's rows and never touch the development data.
 */
export type TestDatabase = {
  db: ReturnType<typeof drizzle<typeof schema>>
  drop: () => Promise<void>
}

function adminUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. Run integration tests via scripts/with-db.sh')
  return url
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const base = new URL(adminUrl())
  const name = `prep_test_${crypto.randomUUID().replaceAll('-', '')}`

  const admin = postgres(base.toString(), { max: 1 })
  await admin.unsafe(`create database "${name}"`)
  await admin.end()

  const target = new URL(base.toString())
  target.pathname = `/${name}`

  const client = postgres(target.toString(), { max: 1 })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })

  return {
    db,
    drop: async () => {
      await client.end()
      const cleanup = postgres(base.toString(), { max: 1 })
      await cleanup.unsafe(`drop database if exists "${name}" with (force)`)
      await cleanup.end()
    },
  }
}

/** Inserts a user, since every progress row needs one to reference. */
export async function insertTestUser(db: TestDatabase['db'], email = 'test@local') {
  const id = crypto.randomUUID()
  await db.insert(schema.user).values({ id, name: 'Test', email })
  return id
}
