import type { LadderStep, Result, ScheduledQuestion } from '@prep/core'
import type { Database } from './sqlite'

/**
 * The interval ladder, on the device.
 *
 * `review_schedule` is stored rather than derived, the way the server stores it,
 * because a question enrolled and never answered has no attempts to derive
 * anything from: it is put on the bottom rung by the act of marking its topic
 * learned. Both sides therefore write the same rows by the same rules, and a
 * sync rebuilds them from the attempts it receives.
 */

export type Enrolment = { questionId: string; topicSlug: string }

export async function readSchedule(db: Database): Promise<ScheduledQuestion[]> {
  const rows = await db.all<{
    question_id: string
    topic_slug: string
    due_at: string
    interval_step: number
    last_result: Result | null
  }>('select question_id, topic_slug, due_at, interval_step, last_result from review_schedule')

  return rows.map((row) => ({
    questionId: row.question_id,
    topicSlug: row.topic_slug,
    dueAt: new Date(row.due_at),
    intervalStep: row.interval_step,
    lastResult: row.last_result,
  }))
}

/**
 * Puts questions on the bottom rung, due immediately, so the first review
 * happens while the lesson is still fresh.
 *
 * A question already scheduled is left exactly as it is. That is what makes
 * re-reading a topic free and stepping up a tier safe: the newly in-scope
 * questions arrive at the bottom and nothing in rotation moves. This mirrors
 * `enrol` in apps/web/src/lib/progress.ts.
 */
export async function enrol(db: Database, questions: Enrolment[], now: Date): Promise<void> {
  if (questions.length === 0) return

  const at = now.toISOString()

  await db.transaction(async () => {
    for (const question of questions) {
      await db.run(
        `insert into review_schedule (question_id, topic_slug, due_at, interval_step, updated_at)
         values (?, ?, ?, 0, ?) on conflict (question_id) do nothing`,
        [question.questionId, question.topicSlug, at, at],
      )
    }
  })
}

/** Where a question sits now. One with no row has never been answered. */
export async function currentRung(db: Database, questionId: string): Promise<LadderStep> {
  const rows = await db.all<{ interval_step: number }>(
    'select interval_step from review_schedule where question_id = ?',
    [questionId],
  )
  return (rows[0]?.interval_step ?? 0) as LadderStep
}
