import type { Question } from '@/content/schema'
import type { Result } from './interval-ladder'

export type ChoiceVerdict = {
  correct: boolean
  correctOption: number
  result: Result
  /** The chosen option's text, stored on the attempt so history stays readable. */
  answer: string
}

/**
 * Grades a choice. Pure, and deliberately server side only in practice: the
 * correct option never reaches the browser before an answer is submitted.
 */
export function gradeChoice(question: Question, chosen: number): ChoiceVerdict {
  const { options, correctOption } = question

  if (question.form !== 'choice' || options === undefined || correctOption === undefined) {
    throw new Error(`Question ${question.id} is not answered by choosing an option`)
  }

  const answer = options[chosen]
  if (answer === undefined) {
    throw new Error(`Option ${chosen} is out of range for question ${question.id}`)
  }

  const correct = chosen === correctOption

  return {
    correct,
    correctOption,
    // There is no half-right answer to a choice question, so "weak" never
    // applies and the ladder only ever sees a pass or a reset.
    result: correct ? 'passed' : 'failed',
    answer,
  }
}
