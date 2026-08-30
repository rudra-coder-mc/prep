'use client'

import { motion } from 'motion/react'
import { DURATION_BASE, EASE_SOFT, usePrefersReducedMotion } from './reduced-motion'

/**
 * The one entrance animation the app uses. Content lifts into place instead of
 * appearing, which is what makes a server-rendered page feel navigated to
 * rather than swapped in.
 */
export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_BASE, ease: EASE_SOFT, delay: reducedMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}
