import type { Question } from '@/content/schema'
import type { Confidence, Result } from './interval-ladder'

/**
 * Reconstructing a sequence and rejecting the distractors cannot be guessed the
 * way one option in four can, so an ordering question buys more of the ladder
 * than a choice question does. It is still short of the top, which is for
 * producing an answer rather than assembling one.
 */
export const ORDERING_CONFIDENCE: Confidence = 4

export type OrderingVerdict = {
  correct: boolean
  correctOrder: number[]
  result: Result
  confidence: Confidence
  /** The sequence as it reads, stored on the attempt so history stays legible. */
  answer: string
}

/**
 * Grades a built sequence. Pure, and server side only in practice: the correct
 * order never reaches the browser before an answer is submitted.
 *
 * Positions travel back from the page rather than text, because a program can
 * print the same line twice and two identical entries have to be told apart.
 * What is compared is still the text, because which of two identical entries was
 * tapped is not something the reader chose.
 */
export function gradeOrdering(question: Question, submitted: number[]): OrderingVerdict {
  const { items, correctOrder } = question

  if (question.form !== 'ordering' || items === undefined || correctOrder === undefined) {
    throw new Error(`Question ${question.id} is not answered by ordering a pool`)
  }

  if (submitted.length === 0) {
    throw new Error(`Nothing was submitted for question ${question.id}`)
  }

  if (new Set(submitted).size !== submitted.length) {
    throw new Error(`Question ${question.id} was answered with the same line placed twice`)
  }

  const outOfRange = submitted.find((position) => items[position] === undefined)
  if (outOfRange !== undefined) {
    throw new Error(`Position ${outOfRange} is out of range for question ${question.id}`)
  }

  const built = submitted.map((position) => items[position])
  const printed = correctOrder.map((position) => items[position])
  const correct = built.length === printed.length && built.every((line, at) => line === printed[at])

  return {
    correct,
    correctOrder,
    // A sequence is right or it is not. Six lines with two of them swapped is
    // not the same as no idea, but scoring that needs a threshold and every
    // threshold is arbitrary.
    result: correct ? 'passed' : 'failed',
    confidence: ORDERING_CONFIDENCE,
    answer: built.join(', '),
  }
}
