import { describe, expect, it } from 'vitest'
import { matchesExpectedOutput, normaliseOutput, OUTPUT_CONFIDENCE } from './output-answer'

describe('normaliseOutput', () => {
  it('collapses runs of spaces and trims each line', () => {
    expect(normaliseOutput('  1   2    1  ')).toBe('1 2 1')
  })

  it('treats every quote character as the same quote', () => {
    expect(normaliseOutput('"object"')).toBe("'object'")
    expect(normaliseOutput('‘object’')).toBe("'object'")
    expect(normaliseOutput('`object`')).toBe("'object'")
  })

  it('keeps line structure but drops blank lines and trailing newlines', () => {
    expect(normaliseOutput('a\n\n\nb\n\n')).toBe('a\nb')
  })

  it('normalises Windows line endings', () => {
    expect(normaliseOutput('a\r\nb')).toBe('a\nb')
  })
})

describe('matchesExpectedOutput', () => {
  it('accepts an answer that differs only in spacing', () => {
    expect(matchesExpectedOutput('1  2   1', '1 2 1')).toBe(true)
  })

  it('accepts an answer that differs only in quote style', () => {
    expect(matchesExpectedOutput('"object"', "'object'")).toBe(true)
  })

  it('accepts multiline output typed with different indentation', () => {
    expect(matchesExpectedOutput('  a\n    b\n', 'a\nb')).toBe(true)
  })

  it('rejects a different value', () => {
    expect(matchesExpectedOutput('1 2 3', '1 2 1')).toBe(false)
  })

  it('rejects the right lines in the wrong order, since order is the answer', () => {
    expect(matchesExpectedOutput('b\na', 'a\nb')).toBe(false)
  })

  it('stays case sensitive, because JavaScript is', () => {
    expect(matchesExpectedOutput('Undefined', 'undefined')).toBe(false)
  })

  it('rejects an empty answer rather than matching empty expected output', () => {
    expect(matchesExpectedOutput('', '')).toBe(false)
    expect(matchesExpectedOutput('   \n  ', 'a')).toBe(false)
  })
})

describe('OUTPUT_CONFIDENCE', () => {
  it('sits above a recognised answer but below explaining the thing', () => {
    expect(OUTPUT_CONFIDENCE).toBeGreaterThan(3)
    expect(OUTPUT_CONFIDENCE).toBeLessThan(5)
  })
})
