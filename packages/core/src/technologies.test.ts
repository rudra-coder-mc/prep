import { describe, expect, it } from 'vitest'
import { technologyLabel } from './technologies'

describe('technologyLabel', () => {
  it('uses the conventional spelling for a technology it knows', () => {
    expect(technologyLabel('javascript')).toBe('JavaScript')
    expect(technologyLabel('nestjs')).toBe('NestJS')
    expect(technologyLabel('nextjs')).toBe('Next.js')
  })

  it('title cases a directory it has never seen, so a new track reads correctly before it is named', () => {
    expect(technologyLabel('rust')).toBe('Rust')
    expect(technologyLabel('web-apis')).toBe('Web Apis')
  })

  it('leaves an empty id alone rather than inventing a label', () => {
    expect(technologyLabel('')).toBe('')
  })
})
