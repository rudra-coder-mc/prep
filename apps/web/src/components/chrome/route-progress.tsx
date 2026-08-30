'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { isNavigating, isNavigatingOnServer, subscribeToNavigation } from './navigation-store'

/**
 * Creeps toward the end of the bar while a navigation is in flight and
 * completes when it lands. It never reaches the end on its own, so it cannot
 * claim to have finished before the page has.
 */
export function RouteProgress() {
  const navigating = useSyncExternalStore(subscribeToNavigation, isNavigating, isNavigatingOnServer)

  return (
    <AnimatePresence>
      {navigating ? (
        <motion.div
          key="route-progress"
          aria-hidden
          className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.9 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 6, ease: [0.05, 0.8, 0.2, 1] },
            opacity: { duration: 0.25 },
          }}
        />
      ) : null}
    </AnimatePresence>
  )
}
