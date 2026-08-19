import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Verifies the session properly. Middleware only checks that a cookie exists.
 *
 * Cached per request so the shell and the page it wraps share one lookup.
 */
export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  return session
})
