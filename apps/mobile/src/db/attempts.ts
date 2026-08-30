import {
  nextDueDate,
  nextRung,
  questionKey,
  type AnswerForm,
  type LadderStep,
  type Result,
} from '@prep/core'
import { recordReview } from './activity'
import { currentRung } from './schedule'
import type { Database } from './sqlite'

/**
 * Writing an answer down.
 *
 * The device has nothing to post to, so this is the whole of what answering
 * does: the attempt waits in SQLite until a sync carries it, and the schedule
 * moves here rather than being told where to move. Those are the same writes
 * apps/web/src/lib/attempts.ts makes, so both surfaces put a question on the
 * same rung for the same answer.
 *
 * The day counter goes in with them rather than after them, which is where the
 * server puts it. On the server the two are separate calls a request composes,
 * and a failure between them costs a count somebody can repair. Here there is
 * nobody to repair it and no request to retry, so either an answer is recorded
 * whole or it is not recorded at all, and the screen can offer the question
 * again knowing which.
 */

export type AttemptInput = {
  topicSlug: string
  /** The question's own id. The key both surfaces store is built from it here. */
  questionId: string
  answer: string
  result: Result
  /** Which form was answered. The ladder derives the rest from it. */
  form: AnswerForm
  hintsUsed: number
  notes?: string
}

/**
 * The id is made by the caller because it is the attempt's whole identity in a
 * sync, and the only source of one on the phone is a native module.
 */
export type AttemptStamp = { id: string; now: Date }

export async function recordAttempt(
  db: Database,
  input: AttemptInput,
  { id, now }: AttemptStamp,
): Promise<{ step: LadderStep; dueAt: Date; queueCleared: boolean }> {
  const key = questionKey(input.topicSlug, input.questionId)
  const { step, confidence } = nextRung(input.form, input.result, await currentRung(db, key))
  const dueAt = nextDueDate(step, now)

  const at = now.toISOString()
  let queueCleared = false

  await db.transaction(async () => {
    // Only ever inserted, so the history of how an answer improved stays readable.
    await db.run(
      `insert into attempts
         (id, question_id, topic_slug, answer, result, confidence, hints_used, notes, attempted_at, synced)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        key,
        input.topicSlug,
        input.answer,
        input.result,
        confidence,
        input.hintsUsed,
        input.notes ?? null,
        at,
      ],
    )

    await db.run(
      `insert into review_schedule (question_id, topic_slug, due_at, interval_step, last_result, updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict (question_id) do update set
         due_at = excluded.due_at,
         interval_step = excluded.interval_step,
         last_result = excluded.last_result,
         updated_at = excluded.updated_at`,
      [key, input.topicSlug, dueAt.toISOString(), step, input.result, at],
    )

    // Reviewing a topic says nothing about when it was read, so the mark that
    // enrolled it is left alone.
    await db.run(
      `insert into topic_progress (topic_slug, last_reviewed_at) values (?, ?)
       on conflict (topic_slug) do update set last_reviewed_at = excluded.last_reviewed_at`,
      [input.topicSlug, at],
    )

    // After the schedule has moved, so "cleared" describes the queue as it
    // stands once this answer is counted.
    queueCleared = (await recordReview(db, now)).cleared
  })

  return { step, dueAt, queueCleared }
}
