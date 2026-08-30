import postgres from 'postgres'

/**
 * Drops everything and leaves an empty database for the migrations to rebuild.
 *
 * The curriculum is in git and reproducible. Attempt history is not, so this
 * throws away the streak and every answer ever recorded along with the tables.
 * It exists because the question bank changes shape from time to time, and an
 * attempt against a question that has since become a different exercise says
 * nothing useful about whether it is known.
 *
 * Run it through `npm run db:reset`, which brings the database up first and
 * migrates and seeds afterwards.
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const client = postgres(url, { max: 1 })

  try {
    // Dropping the schema rather than the tables takes the enums and indexes
    // with it. The migration journal is not in there: drizzle keeps it in a
    // schema of its own, and leaving it behind makes the next migration decide
    // there is nothing to do and hand back an empty database.
    await client.unsafe('drop schema if exists public cascade')
    await client.unsafe('drop schema if exists drizzle cascade')
    await client.unsafe('create schema public')
    console.log('dropped every table, enum, index and the migration journal')
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
