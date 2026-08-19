import { describe, expect, it } from 'vitest'
import { activeMode, MODES } from './modes'

describe('MODES', () => {
  it('offers interview first, because it is what the platform is for', () => {
    expect(MODES.map((mode) => mode.id)).toEqual(['interview', 'learning'])
  })
})

describe('activeMode', () => {
  it('treats the learning subtree as learning', () => {
    expect(activeMode('/learn')).toBe('learning')
    expect(activeMode('/learn/anything')).toBe('learning')
  })

  it('treats everything else as interview, including deep topic routes', () => {
    expect(activeMode('/')).toBe('interview')
    expect(activeMode('/topics')).toBe('interview')
    expect(activeMode('/topics/javascript/closures/practice')).toBe('interview')
    expect(activeMode('/review')).toBe('interview')
  })

  it('does not mistake a route that merely starts with the same letters', () => {
    expect(activeMode('/learners')).toBe('interview')
  })
})
