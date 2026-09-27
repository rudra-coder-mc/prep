import { createLocalAccountIssuer } from 'better-auth'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { account } from '@/db/schema'

/**
 * Creates the single account. Signup is disabled on the public API, so this
 * goes through better-auth's internals to get the same password hashing every
 * login is checked against.
 *
 * See docs/decisions/0004-self-hosted-auth.md.
 */
export async function createAccount(email: string, password: string): Promise<string> {
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
  return created.id
}

/**
 * Ensures an existing user has their credential account linked and password
 * set to the specified value. Idempotent for seed and testing accounts.
 */
export async function ensureAccountPassword(userId: string, password: string): Promise<void> {
  const ctx = await auth.$context
  const hashedPassword = await ctx.password.hash(password)
  const [existingAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))
    .limit(1)

  if (existingAccount) {
    await db
      .update(account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(account.id, existingAccount.id))
  } else {
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: 'credential',
      issuer: createLocalAccountIssuer('credential'),
      accountId: userId,
      password: hashedPassword,
    })
  }
}
