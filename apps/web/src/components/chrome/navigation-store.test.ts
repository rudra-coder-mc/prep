import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  endNavigation,
  isNavigating,
  isNavigatingOnServer,
  resetNavigation,
  startNavigation,
  subscribeToNavigation,
} from './navigation-store'

afterEach(() => resetNavigation())

describe('navigation store', () => {
  it('is idle until a navigation starts', () => {
    expect(isNavigating()).toBe(false)
  })

  it('stays busy until every overlapping navigation has ended', () => {
    startNavigation()
    startNavigation()
    endNavigation()
    expect(isNavigating()).toBe(true)

    endNavigation()
    expect(isNavigating()).toBe(false)
  })

  it('cannot be driven negative by a stray end', () => {
    endNavigation()
    expect(isNavigating()).toBe(false)

    startNavigation()
    expect(isNavigating()).toBe(true)
  })

  it('notifies subscribers on both edges and stops after unsubscribing', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToNavigation(listener)

    startNavigation()
    endNavigation()
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    startNavigation()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('reports idle on the server', () => {
    expect(isNavigatingOnServer()).toBe(false)
  })
})
