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
      form: 'open',
      difficulty: 'easy',
      prompt: 'x',
      answerInFull: 'y',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['type'])
  })

  it('defaults the optional list fields so content need not spell them out', () => {
    const parsed = questionSchema.parse({
      id: 'q1',
      type: 'concept',
      form: 'open',
      difficulty: 'easy',
      prompt: 'x',
      answerInFull: 'y',
    })
    expect(parsed.hints).toEqual([])
    expect(parsed.tags).toEqual([])
  })
})

describe('choice validation', () => {
  const choice = {
    id: 'typeof-null',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does typeof null return?',
    options: ["'object'", "'null'", "'undefined'", "'number'"],
    correctOption: 0,
    answerInFull: "'object'. A bug kept for compatibility.",
  }

  it('accepts a complete choice question', () => {
    expect(questionSchema.safeParse(choice).success).toBe(true)
  })

  it('rejects a correct option that indexes past the end of the list', () => {
    const result = questionSchema.safeParse({ ...choice, correctOption: 4 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['correctOption'])
  })

  it('rejects duplicated options, which would make two answers correct', () => {
    const result = questionSchema.safeParse({
      ...choice,
      options: ["'object'", "'object'", "'undefined'", "'number'"],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('rejects a single option, which is not a choice', () => {
    const result = questionSchema.safeParse({ ...choice, options: ["'object'"], correctOption: 0 })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('requires options, since nothing else says what there is to pick from', () => {
    const { options: _options, correctOption: _correctOption, ...withoutOptions } = choice
    const result = questionSchema.safeParse(withoutOptions)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('requires the answer in full on a choice question too', () => {
    const { answerInFull: _answerInFull, ...withoutAnswer } = choice
    const result = questionSchema.safeParse(withoutAnswer)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['answerInFull'])
  })

  it('accepts a question with no explanation, since the answer may say it all', () => {
    expect(questionSchema.safeParse(choice).success).toBe(true)
  })

  it('refuses options on a question that is not answered by choosing', () => {
    const result = questionSchema.safeParse({
      id: 'q1',
      type: 'concept',
      form: 'open',
      difficulty: 'easy',
      prompt: 'x',
      answerInFull: 'y',
      options: ['a', 'b'],
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['options'])
  })

  it('refuses a question that does not say how it is answered', () => {
    const { form: _form, ...withoutForm } = choice
    const result = questionSchema.safeParse(withoutForm)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['form'])
  })
})
