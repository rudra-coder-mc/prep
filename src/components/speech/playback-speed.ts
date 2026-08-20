'use client'

import { useSyncExternalStore } from 'react'

/**
 * Offered speeds. The top of the range is deliberate: past two times, a
 * synthesised voice stops being something you can follow, so a faster setting
 * would only ever be a way to finish without listening.
 */
export const SPEEDS = [1, 1.25, 1.5, 2] as const
export type NarrationSpeed = (typeof SPEEDS)[number]

const DEFAULT_SPEED: NarrationSpeed = 1
const STORAGE_KEY = 'prep:narration-speed'

const listeners = new Set<() => void>()

function isSpeed(value: unknown): value is NarrationSpeed {
  return SPEEDS.some((speed) => speed === value)
}

function read(): NarrationSpeed {
  // Storage is unavailable in a few real browser configurations, and a reader
  // who cannot persist a preference should still be able to listen.
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    return isSpeed(stored) ? stored : DEFAULT_SPEED
  } catch {
    return DEFAULT_SPEED
  }
}

function write(speed: NarrationSpeed) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(speed))
  } catch {
    // Not persisting is a worse experience, not a broken one. The chosen speed
    // still applies for the rest of this session.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // `storage` only fires in other tabs, which is exactly the case the local
  // listener set cannot cover.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/**
 * The playback speed, remembered across topics and across tabs.
 *
 * Read through an external store rather than restored by an effect: the server
 * render has no storage to consult, and correcting the value afterwards would
 * mean setting state from an effect, which this project's lint rules reject and
 * which would show the wrong speed for a frame either way.
 */
export function useNarrationSpeed(): [NarrationSpeed, (speed: NarrationSpeed) => void] {
  // `write` is module level, so it is already stable across renders and does not
  // need wrapping to be safe in a dependency list.
  const speed = useSyncExternalStore(subscribe, read, () => DEFAULT_SPEED)
  return [speed, write]
}

/** The next speed in the cycle, which is what the one speed button does. */
export function nextSpeed(current: NarrationSpeed): NarrationSpeed {
  return SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length] ?? DEFAULT_SPEED
}
