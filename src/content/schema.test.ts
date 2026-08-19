import { describe, expect, it } from 'vitest'
import { exerciseKey, questionKey, questionSchema, topicMetaSchema } from './schema'

describe('question keys', () => {
  it('namespaces a question by its topic', () => {
    expect(questionKey('javascript/closures', 'counter-output')).toBe(
      'javascript/closures#counter-output',
    )
    expect(exerciseKey('javascript/closures', 'counter')).toBe('javascript/closures/counter')
  })
})

describe('validation', () => {
  it('rejects a slug that is not lowercase and hyphenated', () => {
    const result = topicMetaSchema.safeParse({
      slug: 'Event Loop',
      title: 'Event Loop',
      summary: 'x',
      order: 1,
      difficulty: 'hard',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['slug'])
  })

  it('rejects an unknown question type', () => {
    const result = questionSchema.safeParse({
      id: 'q1',
      type: 'trivia',
      difficulty: 'easy',
      prompt: 'x',
      expectedAnswer: 'y',
      explanation: 'z',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['type'])
  })

  it('defaults the optional list fields so content need not spell them out', () => {
    const parsed = questionSchema.parse({
      id: 'q1',
      type: 'concept',
      difficulty: 'easy',
      prompt: 'x',
      expectedAnswer: 'y',
      explanation: 'z',
    })
    expect(parsed.hints).toEqual([])
    expect(parsed.tags).toEqual([])
  })
})

describe('multiple choice validation', () => {
  const mcq = {
    id: 'typeof-null',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'What does typeof null return?',
    options: ["'object'", "'null'", "'undefined'", "'number'"],
    correctOption: 0,
    explanation: 'A bug kept for compatibility.',
  }

  it('accepts a complete multiple choice question', () => {
    expect(questionSchema.safeParse(mcq).success).toBe(true)
  })

  it('rejects a correct option that indexes past the end of the list', () => {
    const result = questionSchema.safeParse({ ...mcq, correctOption: 4 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['correctOption'])
  })

  it('rejects duplicated options, which would make two answers correct', () => {
    const result = questionSchema.safeParse({
      ...mcq,
      options: ["'object'", "'object'", "'undefined'", "'number'"],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('rejects a single option, which is not a choice', () => {
    const result = questionSchema.safeParse({ ...mcq, options: ["'object'"], correctOption: 0 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('rejects an expected answer alongside options, which could drift apart', () => {
    const result = questionSchema.safeParse({ ...mcq, expectedAnswer: "'object'" })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['expectedAnswer'])
  })

  it('still requires an expected answer on a written question', () => {
    const result = questionSchema.safeParse({
      id: 'q1',
      type: 'concept',
      difficulty: 'easy',
      prompt: 'x',
      explanation: 'z',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['expectedAnswer'])
  })

  it('refuses options on a question that is not multiple choice', () => {
    const result = questionSchema.safeParse({
      id: 'q1',
      type: 'concept',
      difficulty: 'easy',
      prompt: 'x',
      expectedAnswer: 'y',
      explanation: 'z',
      options: ['a', 'b'],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })
})
