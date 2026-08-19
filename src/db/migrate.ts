import { existsSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const MIGRATIONS_FOLDER = './drizzle'

/**
 * Applies pending migrations. Run from the container entrypoint on every start,
 * so it must be safe to run when there is nothing to do.
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  if (!existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) {
    console.log('no migrations to apply')
    return
  }

  const client = postgres(url, { max: 1 })
  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER })
    console.log('migrations up to date')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('migration failed:', error)
  process.exit(1)
})
