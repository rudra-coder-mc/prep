import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatic cleanup only registers when Vitest globals are enabled, and they
// are not, so unmounting between tests is explicit.
afterEach(cleanup)

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
