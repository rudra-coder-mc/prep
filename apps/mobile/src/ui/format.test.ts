import { describe, expect, it } from 'vitest'
import { formatBytes } from './format'

describe('formatBytes', () => {
  it('reads a recording in kilobytes and a track in megabytes', () => {
    expect(formatBytes(48_000)).toBe('47 kB')
    expect(formatBytes(301 * 1024 * 1024)).toBe('301 MB')
  })

  // The difference between 1.2 MB and 8.9 MB is worth seeing; the difference
  // between 300.4 MB and 301.2 MB is not.
  it('keeps a decimal only while it says something', () => {
    expect(formatBytes(1.25 * 1024 * 1024)).toBe('1.3 MB')
    expect(formatBytes(120.4 * 1024 * 1024)).toBe('120 MB')
  })

  it('says nothing held rather than an empty string', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('goes up to gigabytes, which a whole library reaches', () => {
    expect(formatBytes(3.6 * 1024 * 1024 * 1024)).toBe('3.6 GB')
  })
})
