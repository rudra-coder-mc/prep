import { describe, expect, it } from 'vitest'
import { parseLessonMessage, sectionScript, themeScript } from './bridge'

/**
 * The scripts are asserted against the page in ./lesson-bridge.test.ts, which
 * runs them. What is worth checking here is the two things that test cannot see:
 * that a script is safe to evaluate before the page has mounted, and that a
 * message from the page is never trusted.
 */

describe('sectionScript', () => {
  it('does nothing at all when the page has not opened the bridge yet', () => {
    expect(() => new Function(sectionScript('truthiness'))()).not.toThrow()
  })

  it('ends in a plain value, which is what the WebView wants back', () => {
    expect(sectionScript(null).trimEnd().endsWith('true;')).toBe(true)
    expect(themeScript({ '--color-bg': '#000' }).trimEnd().endsWith('true;')).toBe(true)
  })
})

describe('parseLessonMessage', () => {
  it('reads the two messages the page sends', () => {
    expect(parseLessonMessage('{"type":"ready"}')).toEqual({ type: 'ready' })
    expect(parseLessonMessage('{"type":"link","href":"/topics/javascript/closures"}')).toEqual({
      type: 'link',
      href: '/topics/javascript/closures',
    })
  })

  it('refuses anything else without throwing', () => {
    for (const raw of [
      'not json',
      '"a string"',
      'null',
      '[]',
      '{"type":"unknown"}',
      '{"type":"link"}',
      '{"type":"link","href":""}',
      '{"type":"link","href":42}',
    ]) {
      expect(parseLessonMessage(raw)).toBeNull()
    }
  })
})
