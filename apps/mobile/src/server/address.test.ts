import { describe, expect, it } from 'vitest'
import { serverAddress } from './address'

/**
 * The address is typed in on a phone keyboard, so the shapes below are the ones
 * a person actually produces rather than the ones a URL parser expects.
 */
describe('reading a server address', () => {
  it('takes a bare tailnet hostname and assumes https', () => {
    expect(serverAddress('work')).toBe('https://work')
  })

  it('keeps a scheme that was typed', () => {
    expect(serverAddress('https://work.tail1234.ts.net')).toBe('https://work.tail1234.ts.net')
  })

  // The tailnet certificate is real, but a laptop serving over plain http on the
  // same network is how this gets developed.
  it('keeps http, which is what a development server is on', () => {
    expect(serverAddress('http://192.168.1.5:3000')).toBe('http://192.168.1.5:3000')
  })

  it('ignores surrounding space and a trailing slash', () => {
    expect(serverAddress('  work/  ')).toBe('https://work')
  })

  it('drops a path, since every endpoint is named relative to the origin', () => {
    expect(serverAddress('work/dashboard')).toBe('https://work')
  })

  it('has no address for an empty box', () => {
    expect(serverAddress('')).toBeNull()
    expect(serverAddress('   ')).toBeNull()
  })

  it('refuses something that is not a web address', () => {
    expect(serverAddress('not a host')).toBeNull()
    expect(serverAddress('ftp://work')).toBeNull()
    expect(serverAddress('https://')).toBeNull()
  })
})
