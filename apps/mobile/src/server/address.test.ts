import { describe, expect, it } from 'vitest'
import { serverAddress } from './address'

/**
 * The address is typed in on a phone keyboard, so the shapes below are the ones
 * a person actually produces rather than the ones a URL parser expects.
 */
describe('reading a server address', () => {
  it('takes a bare local IP or localhost and assumes http', () => {
    expect(serverAddress('192.168.1.5:3000')).toBe('http://192.168.1.5:3000')
    expect(serverAddress('localhost:3000')).toBe('http://localhost:3000')
  })

  it('takes a bare remote hostname and assumes https', () => {
    expect(serverAddress('work')).toBe('https://work')
  })

  it('keeps a scheme that was typed', () => {
    expect(serverAddress('https://prep.local')).toBe('https://prep.local')
  })

  it('keeps http, which is what a local desktop server is on', () => {
    expect(serverAddress('http://192.168.1.5:3000')).toBe('http://192.168.1.5:3000')
  })

  it('ignores surrounding space and a trailing slash', () => {
    expect(serverAddress('  192.168.1.5:3000/  ')).toBe('http://192.168.1.5:3000')
  })

  it('drops a path, since every endpoint is named relative to the origin', () => {
    expect(serverAddress('192.168.1.5:3000/dashboard')).toBe('http://192.168.1.5:3000')
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
