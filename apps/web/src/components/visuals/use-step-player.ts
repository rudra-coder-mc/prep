'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/components/motion/reduced-motion'

// Re-exported so every visual keeps importing its motion helpers from one place.
export { usePrefersReducedMotion }

/** Playback rates offered by the transport, cycled in this order. */
export const SPEEDS = [1, 1.5, 2, 0.5] as const
export type Speed = (typeof SPEEDS)[number]

/** How much of a visual has to be on screen before it starts itself. */
const AUTOPLAY_VISIBILITY = 0.55

export type StepPlayer = {
  index: number
  count: number
  isPlaying: boolean
  isFirst: boolean
  isLast: boolean
  /** +1 when the last move was forward, -1 when it was backward. */
  direction: 1 | -1
  speed: Speed
  cycleSpeed: () => void
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  previous: () => void
  reset: () => void
  goTo: (index: number) => void
}

/** Where the player is, and which way it last moved to get there. */
type Position = { index: number; direction: 1 | -1 }

/**
 * Drives every visual in the library. Playback is a timer over a fixed list of
 * steps rather than an animation, so stepping by hand and playing through are
 * the same code path. What the steps animate between is the visual's business.
 */
export function useStepPlayer(count: number, intervalMs = 1800): StepPlayer {
  // The index and the direction travel together, so every move sets both in one
  // update and no effect has to correct one after the other.
  const [position, setPosition] = useState<Position>({ index: 0, direction: 1 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const last = Math.max(count - 1, 0)
  // Clamped during render rather than corrected by an effect, so shrinking the
  // step list can never leave the player pointing past the end.
  const index = Math.min(position.index, last)

  useEffect(() => {
    if (!isPlaying) return

    timer.current = setInterval(() => {
      setPosition((current) => {
        if (current.index >= last) {
          setIsPlaying(false)
          return current
        }
        // Playing only ever moves forward.
        return { index: current.index + 1, direction: 1 }
      })
    }, intervalMs / speed)

    return () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [isPlaying, last, intervalMs, speed])

  const pause = useCallback(() => setIsPlaying(false), [])

  const play = useCallback(() => {
    if (count === 0) return
    // Playing from the end restarts, which is what a second press of play means.
    setPosition((current) => (current.index >= last ? { index: 0, direction: 1 } : current))
    setIsPlaying(true)
  }, [count, last])

  const goTo = useCallback(
    (value: number) => {
      const target = Math.min(Math.max(value, 0), last)
      setIsPlaying(false)
      setPosition((current) => ({
        index: target,
        direction: target < current.index ? -1 : 1,
      }))
    },
    [last],
  )

  const cycleSpeed = useCallback(() => {
    setSpeed((current) => SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length] ?? 1)
  }, [])

  return {
    index,
    count,
    isPlaying,
    isFirst: index === 0,
    isLast: index >= last,
    direction: position.direction,
    speed,
    cycleSpeed,
    play,
    pause,
    toggle: () => (isPlaying ? pause() : play()),
    next: () => goTo(index + 1),
    previous: () => goTo(index - 1),
    reset: () => goTo(0),
    goTo,
  }
}

/**
 * Starts a visual the first time it is properly on screen, once. A reader
 * scrolling through a lesson should see the animation run, not a still frame
 * with a play button on it. Only the first time, though, so scrolling back
 * does not restart something they have already watched.
 */
export function useAutoPlayInView(onVisible: () => void, enabled = true) {
  const target = useRef<HTMLElement | null>(null)
  const hasPlayed = useRef(false)
  const callback = useRef(onVisible)

  useEffect(() => {
    callback.current = onVisible
  }, [onVisible])

  useEffect(() => {
    const node = target.current
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.intersectionRatio >= AUTOPLAY_VISIBILITY)
        if (!visible || hasPlayed.current) return
        hasPlayed.current = true
        observer.disconnect()
        callback.current()
      },
      { threshold: [AUTOPLAY_VISIBILITY] },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return target
}
