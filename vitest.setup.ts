import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatic cleanup only registers when Vitest globals are enabled, and they
// are not, so unmounting between tests is explicit.
afterEach(cleanup)

/**
 * Node 26 defines its own `localStorage` global, which is unavailable unless the
 * process was started with `--localstorage-file`, and it shadows the working one
 * jsdom provides. Anything that remembers a preference needs storage that
 * behaves, so this puts a minimal one back.
 */
function hasWorkingStorage(): boolean {
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

if (typeof window !== 'undefined' && !hasWorkingStorage()) {
  const entries = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, String(value)),
      removeItem: (key: string) => entries.delete(key),
      clear: () => entries.clear(),
      key: (index: number) => [...entries.keys()][index] ?? null,
      get length() {
        return entries.size
      },
    } satisfies Storage,
  })
}

// jsdom does not implement matchMedia, which the reduced-motion hook needs.
// The setup file also runs for node-environment tests, hence the guard.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom has no layout, so it implements no scrolling at all. Anything that
// brings part of a page into view needs the method to exist before it can be
// spied on.
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {}
}
