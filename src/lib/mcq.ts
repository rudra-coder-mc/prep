import type { Question } from '@/content/schema'
import type { Confidence, Result } from './interval-ladder'

/**
 * Recognising the answer among four is weaker evidence than recalling it
 * unprompted, so a correct multiple choice answer does not earn the top of the
 * ladder that a confident written explanation does. Three days, not fourteen.
 *
 * Nothing asks the user how confident they felt: speed is the point of this
 * question form, and a rating after every answer is what makes it slow.
 */
export const MCQ_CONFIDENCE: Confidence = 3

export type McqVerdict = {
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
export function gradeMcq(question: Question, chosen: number): McqVerdict {
  const { options, correctOption } = question

  if (question.type !== 'mcq' || options === undefined || correctOption === undefined) {
    throw new Error(`Question ${question.id} is not multiple choice`)
  }

  const answer = options[chosen]
  if (answer === undefined) {
    throw new Error(`Option ${chosen} is out of range for question ${question.id}`)
  }

  const correct = chosen === correctOption

  return {
    correct,
    correctOption,
    // There is no half-right answer to a multiple choice question, so "weak"
    // never applies and the ladder only ever sees a pass or a reset.
    result: correct ? 'passed' : 'failed',
    confidence: MCQ_CONFIDENCE,
    answer,
  }
}
