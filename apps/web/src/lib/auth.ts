import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
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
