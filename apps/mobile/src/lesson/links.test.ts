import { describe, expect, it } from 'vitest'
import { archiveContent, archiveTopic } from '../../test-support/content'
import { resolveLessonLink } from './links'

/**
 * A lesson is authored once for both surfaces, so a link inside one is written
 * as the web's address. What matters here is that the phone reads that address
 * as a topic it holds, and refuses everything it cannot open rather than
 * navigating somewhere that is not there.
 */
const content = archiveContent([
  archiveTopic({ technology: 'javascript', directory: 'closures' }),
  archiveTopic({ technology: 'javascript', directory: 'coercion' }),
])

describe('resolveLessonLink', () => {
  it('reads a topic this device holds', () => {
    expect(resolveLessonLink(content, '/topics/javascript/coercion')).toEqual({
      kind: 'topic',
      technology: 'javascript',
      directory: 'coercion',
    })
  })

  it('reads it with a trailing slash too, which is the same address', () => {
    expect(resolveLessonLink(content, '/topics/javascript/coercion/')).toEqual({
      kind: 'topic',
      technology: 'javascript',
      directory: 'coercion',
    })
  })

  it('refuses a topic the archive on this device has no copy of', () => {
    expect(resolveLessonLink(content, '/topics/typescript/generics')).toEqual({ kind: 'unknown' })
  })

  it('sends a link off this device to the browser', () => {
    expect(resolveLessonLink(content, 'https://developer.mozilla.org/')).toEqual({
      kind: 'external',
      url: 'https://developer.mozilla.org/',
    })
  })

  it('refuses anything it cannot place', () => {
    for (const href of [
      '/topics/javascript/closures/practice',
      '/review',
      'closures.html',
      'javascript:alert(1)',
      '',
    ]) {
      expect(resolveLessonLink(content, href)).toEqual({ kind: 'unknown' })
    }
  })
})
