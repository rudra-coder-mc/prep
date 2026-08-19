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
