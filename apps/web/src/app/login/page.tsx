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

    const { error: signInError } = await signIn.email({ email, password })
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
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
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
        </form>
      </motion.div>
    </main>
  )
}
