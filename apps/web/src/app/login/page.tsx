'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  DURATION_BASE,
  EASE_SOFT,
  usePrefersReducedMotion,
} from '@/components/motion/reduced-motion'
import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'

const FIELD =
  'mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm transition-colors outline-none focus:border-accent'

export default function LoginPage() {
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const raw = email.trim()
    let primaryEmail = raw
    let fallbackEmail: string | null = null

    if (raw.toLowerCase() === 'dev') {
      primaryEmail = 'dev@prep.test'
      fallbackEmail = 'dev@prep.in'
    } else if (raw.toLowerCase() === 'dev@prep.test') {
      fallbackEmail = 'dev@prep.in'
    } else if (raw.toLowerCase() === 'dev@prep.in') {
      fallbackEmail = 'dev@prep.test'
    } else if (raw.toLowerCase() === 'atul') {
      primaryEmail = 'atul@prep.in'
    } else if (!raw.includes('@')) {
      primaryEmail = `${raw}@prep.in`
    }

    let { error: signInError } = await signIn.email({ email: primaryEmail, password })

    if (signInError && fallbackEmail) {
      const fallbackResult = await signIn.email({ email: fallbackEmail, password })
      signInError = fallbackResult.error
    }

    if (signInError) {
      setError('Those credentials were not accepted.')
      setPending(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent-dim to-transparent"
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION_BASE, ease: EASE_SOFT }}
        className="relative w-full max-w-sm"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-accent font-bold text-accent-fg">
            p
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">prep</h1>
            <p className="text-xs text-faint">Sign in to continue.</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-card border border-border bg-surface/60 p-6 backdrop-blur"
        >
          <div>
            <label htmlFor="email" className="block text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="text"
              required
              autoFocus
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
              placeholder="e.g. dev or atul@prep.in"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="block text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
            />
          </div>

          {error ? (
            <motion.p
              role="alert"
              initial={reducedMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg border border-fail/40 bg-fail/10 px-3 py-2 text-sm text-fail"
            >
              {error}
            </motion.p>
          ) : null}

          <Button type="submit" variant="primary" disabled={pending} className="mt-6 w-full">
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="mt-4 rounded-lg border border-border/40 bg-surface/50 p-2.5 text-xs text-muted">
            <div className="font-medium text-fg mb-1">Testing accounts:</div>
            <div className="space-y-0.5 font-mono text-[11px]">
              <div>
                • dev / dev <span className="text-faint">(or dev@prep.test)</span>
              </div>
              <div>
                • atul / atul <span className="text-faint">(or atul@prep.in)</span>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </main>
  )
}
