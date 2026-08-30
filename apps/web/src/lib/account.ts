import { createLocalAccountIssuer } from 'better-auth'
import { auth } from '@/lib/auth'

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
