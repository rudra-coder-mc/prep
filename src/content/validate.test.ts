import { describe, expect, it } from 'vitest'
import { validateTopic, type RawTopic } from './validate'

const BASE = 'content/javascript/closures'

const validMeta = {
  slug: 'closures',
  title: 'Closures',
  summary: 'x',
  order: 1,
  difficulty: 'medium',
}
const validQuestion = {
  id: 'q1',
  type: 'concept',
  difficulty: 'easy',
  prompt: 'p',
  expectedAnswer: 'a',
  explanation: 'e',
}
const validExercise = {
  id: 'e1',
  title: 't',
  difficulty: 'easy',
  prompt: 'p',
  requirements: ['r'],
}

function raw(overrides: Partial<RawTopic> = {}): RawTopic {
  return {
    meta: validMeta,
    questions: [validQuestion],
    exercises: [validExercise],
    ...overrides,
  }
}

describe('validateTopic', () => {
  it('accepts well-formed content', () => {
    const result = validateTopic(raw(), 'closures', BASE)
    expect(result.meta.title).toBe('Closures')
    expect(result.questions).toHaveLength(1)
  })

  it('names the file and the field when a question is malformed', () => {
    expect(() =>
      validateTopic(raw({ questions: [{ ...validQuestion, type: 'trivia' }] }), 'closures', BASE),
    ).toThrow(/content\/javascript\/closures\/questions\.ts[\s\S]*0\.type/)
  })

  it('names the file and the field when the topic metadata is malformed', () => {
    expect(() =>
      validateTopic(raw({ meta: { ...validMeta, order: -1 } }), 'closures', BASE),
    ).toThrow(/content\/javascript\/closures\/meta\.ts[\s\S]*order/)
  })

  it('rejects a slug that disagrees with its directory', () => {
    expect(() => validateTopic(raw(), 'event-loop', BASE)).toThrow(
      /slug: must match the directory name, which is "event-loop"/,
    )
  })

  it('rejects duplicate question ids, which would collide in attempt history', () => {
    expect(() =>
      validateTopic(raw({ questions: [validQuestion, validQuestion] }), 'closures', BASE),
    ).toThrow(/id: duplicated \(q1\)/)
  })

  it('rejects an exercise with no requirements, since nothing would define done', () => {
    expect(() =>
      validateTopic(raw({ exercises: [{ ...validExercise, requirements: [] }] }), 'closures', BASE),
    ).toThrow(/exercises\.ts[\s\S]*requirements/)
  })

  describe('narration', () => {
    const section = { title: 'Why this matters', script: 'Something worth hearing.' }

    it('is optional, and a topic without one simply shows no player', () => {
      expect(validateTopic(raw(), 'closures', BASE).narration).toBeNull()
    })

    it('is kept when a topic has one', () => {
      const result = validateTopic(raw({ narration: [section] }), 'closures', BASE)
      expect(result.narration).toEqual([section])
    })

    it('rejects a section with a title and nothing to say', () => {
      expect(() =>
        validateTopic(raw({ narration: [{ ...section, script: '   \n  ' }] }), 'closures', BASE),
      ).toThrow(/narration\.ts[\s\S]*nothing to say/)
    })

    it('rejects a narration with no sections at all', () => {
      expect(() => validateTopic(raw({ narration: [] }), 'closures', BASE)).toThrow(
        /narration\.ts[\s\S]*no sections/,
      )
    })

    it('rejects a section too long for the engine to speak in one request', () => {
      expect(() =>
        validateTopic(
          raw({ narration: [{ ...section, script: 'a'.repeat(3001) }] }),
          'closures',
          BASE,
        ),
      ).toThrow(/narration\.ts[\s\S]*at most 3000 characters/)
    })

    it('measures a section after collapsing the whitespace it was written with', () => {
      const script = `${'a'.repeat(3000)}\n\n   `
      expect(() =>
        validateTopic(raw({ narration: [{ ...section, script }] }), 'closures', BASE),
      ).not.toThrow()
    })
  })
})
