'use client'

import type { Route } from 'next'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { usePrefersReducedMotion } from '@/components/motion/reduced-motion'
import { cx } from '@/lib/cx'
import { AppLink } from './app-link'
import { activeTopicTab, topicTabItems } from './topic-tabs'

/**
 * Breadcrumb and tabs for one topic. It sits directly under the top bar and is
 * the reason the lesson, its questions and its exercises feel like one place
 * rather than three unrelated URLs.
 */
export function TopicNav({
  technology,
  directory,
  title,
}: {
  technology: string
  directory: string
  title: string
}) {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()
  const items = topicTabItems(technology, directory)
  const base = `/topics/${technology}/${directory}`
  const active = activeTopicTab(pathname, base)

  return (
    <div className="sticky top-14 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-3 text-xs text-faint">
          <AppLink href="/topics" className="rounded transition-colors hover:text-fg">
            Topics
          </AppLink>
          <span aria-hidden>/</span>
          <span className="truncate text-muted">{title}</span>
        </nav>

        <nav aria-label={`${title} sections`} className="-mb-px flex gap-1">
          {items.map((item) => {
            const isActive = item.tab === active

            return (
              <AppLink
                key={item.tab}
                href={item.href as Route}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'relative px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'text-fg' : 'text-muted hover:text-fg',
                )}
              >
                {item.label}
                {isActive ? (
                  <motion.span
                    layoutId="topic-tab"
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 34 }
                    }
                  />
                ) : null}
              </AppLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
