import { describe, expect, it } from 'vitest'
import { isNavItemActive, NAV_ITEMS } from './nav-items'

describe('isNavItemActive', () => {
  it('matches the dashboard only at the root', () => {
    expect(isNavItemActive('/', '/')).toBe(true)
    expect(isNavItemActive('/topics', '/')).toBe(false)
  })

  it('keeps a section active anywhere inside it', () => {
    expect(isNavItemActive('/topics', '/topics')).toBe(true)
    expect(isNavItemActive('/topics/javascript/closures/practice', '/topics')).toBe(true)
  })

  it('does not match a sibling section that merely shares a prefix', () => {
    expect(isNavItemActive('/topics-archive', '/topics')).toBe(false)
  })

  it('covers every item the bar renders', () => {
    for (const item of NAV_ITEMS) {
      expect(isNavItemActive(item.href, item.href)).toBe(true)
    }
  })
})
