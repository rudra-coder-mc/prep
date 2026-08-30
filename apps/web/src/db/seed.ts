import { eq } from 'drizzle-orm'
import { createAccount } from '@/lib/account'
import { closeConnection, db } from '@/db'
import { user } from '@/db/schema'

/**
 * Creates the single account from the environment. Idempotent, because the
 * container entrypoint runs it on every start.
 */
const DEFAULTS = { email: 'dev@prep.test', password: 'dev' }

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? DEFAULTS.email
  const password = process.env.SEED_USER_PASSWORD ?? DEFAULTS.password

  if (email === DEFAULTS.email || password === DEFAULTS.password) {
    console.warn(
      'WARNING: the seeded account is still using default credentials. Set SEED_USER_EMAIL and SEED_USER_PASSWORD before exposing this beyond localhost.',
    )
  }

  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) {
    console.log(`seed user already present: ${email}`)
    return
  }

  await createAccount(email, password)

  console.log(`seed user created: ${email}`)
}

main()
  .catch((error) => {
    console.error('seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeConnection()
  })
