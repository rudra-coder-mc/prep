import { describe, expect, it } from 'vitest'
import { checkScript, MAX_SCRIPT_LENGTH, normaliseScript, scriptKey } from './script'

describe('normaliseScript', () => {
  it('collapses the line breaks a script is written with', () => {
    expect(normaliseScript('A closure is\n  a function\n\nplus its scope.')).toBe(
      'A closure is a function plus its scope.',
    )
  })

  it('trims the ends', () => {
    expect(normaliseScript('  spoken  ')).toBe('spoken')
  })

  it('leaves punctuation alone, because the engine phrases on it', () => {
    expect(normaliseScript('First, this. Then that!')).toBe('First, this. Then that!')
  })
})

describe('checkScript', () => {
  it('accepts an ordinary section', () => {
    expect(checkScript('This is what a closure actually is.')).toBeNull()
  })

  it('rejects text that is only whitespace', () => {
    expect(checkScript(' \n\t ')).toBe('empty')
    expect(checkScript('')).toBe('empty')
  })

  it('rejects a section longer than one request should synthesise', () => {
    expect(checkScript('a'.repeat(MAX_SCRIPT_LENGTH))).toBeNull()
    expect(checkScript('a'.repeat(MAX_SCRIPT_LENGTH + 1))).toBe('too-long')
  })

  it('measures the length after normalising, not before', () => {
    const padded = `${'a'.repeat(MAX_SCRIPT_LENGTH)}\n\n\n   `
    expect(checkScript(padded)).toBeNull()
  })
})

describe('scriptKey', () => {
  it('is the same for text that differs only in how it was laid out', () => {
    expect(scriptKey('One thing.\nThen another.')).toBe(scriptKey('One thing. Then another.'))
  })

  it('changes when a word changes', () => {
    expect(scriptKey('One thing.')).not.toBe(scriptKey('One think.'))
  })

  it('is a hex digest, so it is safe as a file name', () => {
    expect(scriptKey('anything')).toMatch(/^[0-9a-f]{64}$/)
  })
})
