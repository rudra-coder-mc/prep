import { describe, expect, it } from 'vitest'
import type { Question } from '@/content/schema'
import { CHOICE_CONFIDENCE, gradeChoice } from './choice'

const question: Question = {
  id: 'typeof-null',
  type: 'output',
  form: 'choice',
  difficulty: 'easy',
  prompt: 'What does typeof null return?',
  options: ["'object'", "'null'", "'undefined'", "'number'"],
  correctOption: 0,
  answerInFull: "'object'. A bug kept for compatibility with the first version of JavaScript.",
  hints: [],
  tags: [],
}

describe('gradeChoice', () => {
  it('passes the correct option and records what was chosen', () => {
    expect(gradeChoice(question, 0)).toEqual({
      correct: true,
      correctOption: 0,
      result: 'passed',
      confidence: CHOICE_CONFIDENCE,
      answer: "'object'",
    })
  })

  it('fails a wrong option outright, since there is no half-right choice', () => {
    const verdict = gradeChoice(question, 2)

    expect(verdict.correct).toBe(false)
    expect(verdict.result).toBe('failed')
    expect(verdict.answer).toBe("'undefined'")
  })

  it('reports the right answer either way, so the verdict can name it', () => {
    expect(gradeChoice(question, 3).correctOption).toBe(0)
  })

  it('does not settle for the top of the ladder on a recognised answer', () => {
    expect(CHOICE_CONFIDENCE).toBeLessThan(5)
  })

  it('refuses an option that does not exist rather than scoring it wrong', () => {
    expect(() => gradeChoice(question, 4)).toThrow(/out of range/)
    expect(() => gradeChoice(question, -1)).toThrow(/out of range/)
  })

  it('refuses a question that is not answered by choosing', () => {
    const open: Question = {
      id: 'what-is-a-closure',
      type: 'concept',
      form: 'open',
      difficulty: 'easy',
      prompt: 'What is a closure?',
      answerInFull: 'A function and its lexical environment.',
      hints: [],
      tags: [],
    }

    expect(() => gradeChoice(open, 0)).toThrow(/not answered by choosing/)
  })
})
