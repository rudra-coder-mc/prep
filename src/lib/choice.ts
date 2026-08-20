import type { Question } from '@/content/schema'
import type { Confidence, Result } from './interval-ladder'

/**
 * Recognising the answer among four is weaker evidence than reconstructing a
 * sequence or producing an explanation, so a correct choice answer buys the
 * least of the three forms. Three days, not fourteen.
 *
 * Nothing asks the user how confident they felt. Speed is the point of this
 * form, and a rating after every answer is what makes it slow.
 */
export const CHOICE_CONFIDENCE: Confidence = 3

export type ChoiceVerdict = {
  correct: boolean
  correctOption: number
  result: Result
  confidence: Confidence
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
    confidence: CHOICE_CONFIDENCE,
    answer,
  }
}
