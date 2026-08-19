import { createLocalAccountIssuer } from 'better-auth'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
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

  // Signup is disabled on the public API, so the account is created through
  // better-auth's internals to get the same password hashing.
  const ctx = await auth.$context
  const created = await ctx.internalAdapter.createUser(
    { email, name: email.split('@')[0] ?? 'user', emailVerified: true },
    { method: 'email-password' },
  )
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: 'credential',
    issuer: createLocalAccountIssuer('credential'),
    accountId: created.id,
    password: await ctx.password.hash(password),
  })

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
