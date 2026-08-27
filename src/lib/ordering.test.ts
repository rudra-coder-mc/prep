import { describe, expect, it } from 'vitest'
import type { Question } from '@/content/schema'
import { gradeOrdering } from './ordering'

/** Prints one, two, three. "caught" is the distractor. */
const question: Question = {
  id: 'drain-order',
  type: 'output',
  form: 'ordering',
  tier: 'swe-2',
  prompt: 'What does this print, in order?',
  items: ['three', 'one', 'caught', 'two'],
  correctOrder: [1, 3, 0],
  answerInFull: 'one, two, three.',
  hints: [],
  tags: [],
}

describe('gradeOrdering', () => {
  it('passes the correct sequence and records what was built', () => {
    expect(gradeOrdering(question, [1, 3, 0])).toEqual({
      correct: true,
      correctOrder: [1, 3, 0],
      result: 'passed',
      answer: 'one, two, three',
    })
  })

  it('fails a sequence with the right lines in the wrong order', () => {
    const verdict = gradeOrdering(question, [3, 1, 0])

    expect(verdict.correct).toBe(false)
    expect(verdict.result).toBe('failed')
    expect(verdict.answer).toBe('two, one, three')
  })

  it('fails a sequence that includes a line the program never prints', () => {
    expect(gradeOrdering(question, [1, 3, 2, 0]).correct).toBe(false)
  })

  it('fails a sequence that leaves a printed line out', () => {
    expect(gradeOrdering(question, [1, 3]).correct).toBe(false)
  })

  it('reports the correct order either way, so a wrong answer can be shown it', () => {
    expect(gradeOrdering(question, [0, 1, 3]).correctOrder).toEqual([1, 3, 0])
  })

  /**
   * A program that prints the same line twice is the reason positions travel
   * back rather than text. Which of the two identical entries was tapped is not
   * something the reader can control, so it cannot be what decides the grade.
   */
  it('grades a repeated line by what it says, not by which entry was tapped', () => {
    const repeats: Question = {
      ...question,
      items: ['hello', 'hello', 'goodbye', 'never'],
      correctOrder: [0, 2, 1],
    }

    expect(gradeOrdering(repeats, [0, 2, 1]).correct).toBe(true)
    expect(gradeOrdering(repeats, [1, 2, 0]).correct).toBe(true)
    expect(gradeOrdering(repeats, [0, 1, 2]).correct).toBe(false)
  })

  it('refuses a question that is not answered by ordering', () => {
    const open: Question = {
      id: 'what-is-a-closure',
      type: 'concept',
      form: 'open',
      tier: 'swe-1',
      prompt: 'What is a closure?',
      answerInFull: 'A function and its lexical environment.',
      hints: [],
      tags: [],
    }

    expect(() => gradeOrdering(open, [0])).toThrow(/not answered by ordering/)
  })

  it('refuses a position the pool does not have rather than scoring it wrong', () => {
    expect(() => gradeOrdering(question, [1, 3, 4])).toThrow(/out of range/)
  })

  it('refuses the same line placed twice, which nothing in the page can produce', () => {
    expect(() => gradeOrdering(question, [1, 1, 3])).toThrow(/twice/)
  })

  it('refuses an empty sequence rather than counting it as an attempt', () => {
    expect(() => gradeOrdering(question, [])).toThrow(/Nothing was submitted/)
  })
})
