import { eq } from 'drizzle-orm'
import { createAccount } from '@/lib/account'
import { closeConnection, db } from '@/db'
import { user } from '@/db/schema'

/**
 * Creates seed accounts. Idempotent, because the container entrypoint runs it
 * on every start.
 */
const DEFAULT_ACCOUNTS = [
  { email: 'dev@prep.test', password: 'dev' },
  { email: 'atul@prep.in', password: 'atul' },
]

async function seedAccount(email: string, password: string) {
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) {
    console.log(`seed user already present: ${email}`)
    return
  }

  await createAccount(email, password)
  console.log(`seed user created: ${email}`)
}

async function main() {
  const accounts = DEFAULT_ACCOUNTS.map((account) => ({ ...account }))

  if (process.env.SEED_USER_EMAIL) {
    const email = process.env.SEED_USER_EMAIL
    const password = process.env.SEED_USER_PASSWORD ?? 'dev'
    const match = accounts.find((a) => a.email === email)
    if (match) {
      match.password = password
    } else {
      accounts.push({ email, password })
    }
  } else if (process.env.SEED_USER_PASSWORD) {
    const devAccount = accounts.find((a) => a.email === 'dev@prep.test')
    if (devAccount) {
      devAccount.password = process.env.SEED_USER_PASSWORD
    }
  }

  for (const account of accounts) {
    if (account.email === 'dev@prep.test' && account.password === 'dev') {
      console.warn(
        'WARNING: the dev account is still using default credentials. Set SEED_USER_EMAIL and SEED_USER_PASSWORD before exposing this beyond localhost.',
      )
    }
    await seedAccount(account.email, account.password)
  }
}

main()
  .catch((error) => {
    console.error('seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeConnection()
  })
