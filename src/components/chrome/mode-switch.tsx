'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { usePrefersReducedMotion } from '@/components/motion/reduced-motion'
import { cx } from '@/lib/cx'
import { AppLink } from './app-link'
import { activeMode, MODES } from './modes'

/**
 * Switches between the two ways to use prep. The active mode comes from the
 * URL, so it survives a reload and cannot disagree with the page below it.
 */
export function ModeSwitch() {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()
  const current = activeMode(pathname)

  return (
    <div
      role="group"
      aria-label="Mode"
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
    >
      {MODES.map((mode) => {
        const active = mode.id === current

        return (
          <AppLink
            key={mode.id}
            href={mode.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'relative rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3',
              active ? 'text-accent-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active ? (
              <motion.span
                layoutId="mode-active"
                aria-hidden
                className="absolute inset-0 rounded-full bg-accent"
                transition={
                  reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }
                }
              />
            ) : null}
            <span className="relative">{mode.label}</span>
          </AppLink>
        )
      })}
    </div>
  )
}
