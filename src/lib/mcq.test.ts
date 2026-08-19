import { describe, expect, it } from 'vitest'
import type { Question } from '@/content/schema'
import { gradeMcq, MCQ_CONFIDENCE } from './mcq'

const question: Question = {
  id: 'typeof-null',
  type: 'mcq',
  difficulty: 'easy',
  prompt: 'What does typeof null return?',
  options: ["'object'", "'null'", "'undefined'", "'number'"],
  correctOption: 0,
  explanation: 'A bug kept for compatibility.',
  hints: [],
  tags: [],
}

describe('gradeMcq', () => {
  it('passes the correct option and records what was chosen', () => {
    expect(gradeMcq(question, 0)).toEqual({
      correct: true,
      correctOption: 0,
      result: 'passed',
      confidence: MCQ_CONFIDENCE,
      answer: "'object'",
    })
  })

  it('fails a wrong option outright, since there is no half-right choice', () => {
    const verdict = gradeMcq(question, 2)

    expect(verdict.correct).toBe(false)
    expect(verdict.result).toBe('failed')
    expect(verdict.answer).toBe("'undefined'")
  })

  it('reports the right answer either way, so the explanation can name it', () => {
    expect(gradeMcq(question, 3).correctOption).toBe(0)
  })

  it('does not settle for the top of the ladder on a recognised answer', () => {
    expect(MCQ_CONFIDENCE).toBeLessThan(5)
  })

  it('refuses an option that does not exist rather than scoring it wrong', () => {
    expect(() => gradeMcq(question, 4)).toThrow(/out of range/)
    expect(() => gradeMcq(question, -1)).toThrow(/out of range/)
  })

  it('refuses a question that is not multiple choice', () => {
    const written: Question = {
      id: 'what-is-a-closure',
      type: 'concept',
      difficulty: 'easy',
      prompt: 'What is a closure?',
      expectedAnswer: 'A function and its lexical environment.',
      explanation: 'x',
      hints: [],
      tags: [],
    }

    expect(() => gradeMcq(written, 0)).toThrow(/not multiple choice/)
  })
})
