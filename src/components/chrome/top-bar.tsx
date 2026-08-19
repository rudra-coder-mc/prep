'use client'

import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { usePrefersReducedMotion } from '@/components/motion/reduced-motion'
import { FlameIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { AppLink } from './app-link'
import { isNavItemActive, NAV_ITEMS } from './nav-items'
import { SignOutButton } from './sign-out-button'

function Brand() {
  return (
    <AppLink
      href="/"
      className="rounded-lg px-1 text-base font-semibold tracking-tight"
      aria-label="prep home"
    >
      prep
    </AppLink>
  )
}

function StreakChip({ streak }: { streak: number }) {
  return (
    <span
      role="img"
      aria-label={`Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
      title="Days in a row with a review"
      className={cx(
        // The dashboard carries the streak too, so on a phone the bar drops it.
        'hidden items-center gap-1 rounded-full border px-2 py-1 text-xs tabular-nums sm:flex',
        streak > 0 ? 'border-weak/40 bg-weak/10 text-weak' : 'border-border text-faint',
      )}
    >
      <FlameIcon className="size-3.5" />
      {streak}
    </span>
  )
}

/**
 * Present on every signed-in page. It is the answer to "where am I and how do I
 * get back", and it never unmounts, so navigating never blanks the frame.
 */
export function TopBar({
  email,
  dueToday,
  streak,
}: {
  email: string
  dueToday: number
  streak: number
}) {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-1 px-4 sm:gap-3 sm:px-6">
        <Brand />

        <nav aria-label="Main" className="ml-1 flex items-center gap-0.5 sm:ml-4">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href)

            return (
              <AppLink
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative rounded-lg px-2.5 py-1.5 text-sm transition-colors sm:px-3',
                  active ? 'text-fg' : 'text-muted hover:text-fg',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden
                    className="absolute inset-0 rounded-lg bg-raised"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 34 }
                    }
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  {item.label}
                  {item.href === '/review' && dueToday > 0 ? (
                    <span className="rounded-full bg-accent px-1.5 text-[11px] leading-4 font-semibold text-accent-fg tabular-nums">
                      {dueToday > 99 ? '99+' : dueToday}
                    </span>
                  ) : null}
                </span>
              </AppLink>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <StreakChip streak={streak} />
          <span className="hidden max-w-40 truncate text-xs text-faint md:block">{email}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
