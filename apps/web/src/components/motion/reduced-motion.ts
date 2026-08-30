'use client'

import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Every animated component asks this first. Reading the media query through an
 * external store keeps the server render deterministic (motion allowed) and
 * lets a preference change take effect without a reload.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

/** Shared timing, so unrelated components still feel like one product. */
export const EASE_SOFT = [0.22, 1, 0.36, 1] as const
export const DURATION_FAST = 0.16
export const DURATION_BASE = 0.24
