import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustedOrigins: async (request) => {
    const list = ['http://localhost:*', 'http://127.0.0.1:*', 'http://*:*', 'https://*:*', '*']
    if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
      list.push(...process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((s) => s.trim()))
    }
    if (request) {
      const origin = request.headers.get('origin')
      if (origin) list.push(origin)
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
      const proto = request.headers.get('x-forwarded-proto') ?? 'http'
      if (host) {
        list.push(`${proto}://${host}`)
        list.push(`http://${host}`)
        list.push(`https://${host}`)
      }
    }
    return list
  },
  emailAndPassword: {
    enabled: true,
    // The only account is seeded from the environment. See
    // docs/decisions/0004-self-hosted-auth.md.
    disableSignUp: true,
  },
  session: {
    // A device that has not reached the server for thirty days costs one login.
    // Any authenticated request younger than that moves the expiry forward, so
    // a phone in daily use never has to sign in twice.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // Lets a request carry its session in an Authorization header instead of a
  // cookie, which is the whole of what a device needs to authenticate. See
  // docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
  plugins: [bearer()],
})

export type Session = typeof auth.$Infer.Session
