import { gradeChoice, gradeOrdering, type Result } from '@prep/core'
import { recordAttempt, type AttemptStamp } from '../db/attempts'
import type { Database } from '../db/sqlite'
import type { QueuedItem } from './queue'

/**
 * Answering a question on the device.
 *
 * The grading is @prep/core's, which is the same function the server calls, so
 * an answer is right here exactly when it would be right there. What the server
 * does that this cannot is keep the correct answer away from the client until
 * the question has been answered: the archive carries it, deliberately, because
 * a phone with nothing to connect to has nothing to ask. See
 * docs/decisions/0037-the-mobile-archive-carries-the-answers.md.
 *
 * What survives of that guarantee is the shape of this file. Nothing hands the
 * answer back except in return for an answer, and `revealAnswer` refuses the
 * two forms whose answer would give the question away.
 */

export type Revealed = { answerInFull: string; explanation?: string; answerAudioKey: string }

export type Outcome = Revealed & {
  correct: boolean
  result: Result
  /** When the question comes back, so the screen can say so. */
  dueAt: Date
  /** Whether that answer emptied the day's queue. */
  queueCleared: boolean
}

export type ChoiceOutcome = Outcome & { correctOption: number }
export type OrderingOutcome = Outcome & { correctOrder: number[] }

function revealedFrom(item: QueuedItem): Revealed {
  return {
    answerInFull: item.question.answerInFull,
    explanation: item.question.explanation,
    answerAudioKey: item.question.answerAudioKey,
  }
}

/**
 * The answer to an open question, which is how that form is answered: read it,
 * then mark yourself against what you said.
 *
 * The other two forms are refused. Their answer in full names the option or the
 * sequence, so handing it over before an answer is a way to read the answer
 * without giving one. This is the rule apps/web/src/lib/attempts.ts enforces on
 * the server, kept here because on this device there is no server to enforce it.
 */
export function revealAnswer(item: QueuedItem): Revealed {
  if (item.question.form !== 'open') {
    const gives = item.question.form === 'ordering' ? 'correct sequence' : 'correct option'
    throw new Error(
      `Question ${item.key} is answered rather than revealed, since its answer names the ${gives}`,
    )
  }

  return revealedFrom(item)
}

async function record(
  db: Database,
  item: QueuedItem,
  answer: string,
  result: Result,
  hintsUsed: number,
  stamp: AttemptStamp,
): Promise<{ dueAt: Date; queueCleared: boolean }> {
  const { dueAt, queueCleared } = await recordAttempt(
    db,
    {
      topicSlug: item.topicSlug,
      questionId: item.question.id,
      answer,
      result,
      form: item.question.form,
      hintsUsed,
    },
    stamp,
  )

  return { dueAt, queueCleared }
}

export async function answerChoice(
  db: Database,
  item: QueuedItem,
  chosen: number,
  stamp: AttemptStamp,
): Promise<ChoiceOutcome> {
  const verdict = gradeChoice(item.question, chosen)
  const recorded = await record(db, item, verdict.answer, verdict.result, 0, stamp)

  return {
    ...revealedFrom(item),
    ...recorded,
    correct: verdict.correct,
    correctOption: verdict.correctOption,
    result: verdict.result,
  }
}

export async function answerOrdering(
  db: Database,
  item: QueuedItem,
  submitted: number[],
  hintsUsed: number,
  stamp: AttemptStamp,
): Promise<OrderingOutcome> {
  const verdict = gradeOrdering(item.question, submitted)
  const recorded = await record(db, item, verdict.answer, verdict.result, hintsUsed, stamp)

  return {
    ...revealedFrom(item),
    ...recorded,
    correct: verdict.correct,
    correctOrder: verdict.correctOrder,
    result: verdict.result,
  }
}

/**
 * The self grade on an open question, the one form nothing can grade. Nothing
 * was submitted, so the attempt stores no answer: what happened is the grade.
 */
export async function selfGrade(
  db: Database,
  item: QueuedItem,
  result: Result,
  hintsUsed: number,
  stamp: AttemptStamp,
): Promise<{ dueAt: Date; queueCleared: boolean }> {
  if (item.question.form !== 'open') {
    throw new Error(`Question ${item.key} is graded by the platform, not by hand`)
  }

  return record(db, item, '', result, hintsUsed, stamp)
}
