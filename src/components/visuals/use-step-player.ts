'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/components/motion/reduced-motion'

// Re-exported so every visual keeps importing its motion helpers from one place.
export { usePrefersReducedMotion }

export type StepPlayer = {
  index: number
  count: number
  isPlaying: boolean
  isFirst: boolean
  isLast: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  previous: () => void
  reset: () => void
  goTo: (index: number) => void
}

/**
 * Drives every visual in the library. Playback is a timer over a fixed list of
 * steps rather than an animation, so stepping by hand and playing through are
 * the same code path.
 */
export function useStepPlayer(count: number, intervalMs = 1400): StepPlayer {
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const last = Math.max(count - 1, 0)
  // Clamped during render rather than corrected by an effect, so shrinking the
  // step list can never leave the player pointing past the end.
  const index = Math.min(requestedIndex, last)

  useEffect(() => {
    if (!isPlaying) return

    timer.current = setInterval(() => {
      setRequestedIndex((current) => {
        if (current >= last) {
          setIsPlaying(false)
          return current
        }
        return current + 1
      })
    }, intervalMs)

    return () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [isPlaying, last, intervalMs])

  const pause = useCallback(() => setIsPlaying(false), [])

  const play = useCallback(() => {
    if (count === 0) return
    // Playing from the end restarts, which is what a second press of play means.
    setRequestedIndex((current) => (current >= last ? 0 : current))
    setIsPlaying(true)
  }, [count, last])

  const goTo = useCallback(
    (value: number) => {
      setIsPlaying(false)
      setRequestedIndex(Math.min(Math.max(value, 0), last))
    },
    [last],
  )

  return {
    index,
    count,
    isPlaying,
    isFirst: index === 0,
    isLast: index >= last,
    play,
    pause,
    toggle: () => (isPlaying ? pause() : play()),
    next: () => goTo(index + 1),
    previous: () => goTo(index - 1),
    reset: () => goTo(0),
    goTo,
  }
}
