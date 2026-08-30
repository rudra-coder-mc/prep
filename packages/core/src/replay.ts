import type { AnswerForm } from './schema'
import { nextDueDate, nextRung, type LadderStep, type Result } from './interval-ladder'

/**
 * Rebuilding a question's place on the interval ladder from its attempts.
 *
 * The live path moves a question one rung per answer and stores where it landed.
 * That works while every answer arrives in order, which stops being true the
 * moment a phone answers questions offline and hands them over days later. So an
 * ingest rebuilds instead: it folds the whole history from the bottom rung, and
 * because the fold is the same function the live path applies one answer at a
 * time, it reaches the same rung.
 *
 * It is here rather than beside the database because both surfaces run it over
 * their own copy of the same attempts, which is what makes them agree about when
 * a question is next due. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */

export type ReplayedAttempt = { result: Result; attemptedAt: Date }

export type ReplayedSchedule = {
  step: LadderStep
  lastResult: Result
  dueAt: Date
  updatedAt: Date
}

/**
 * Where a question sits after its whole history, or null when it has none.
 *
 * A question nobody has answered is not scheduled by this: it is enrolled by
 * marking its topic learned, which is a different event with a different date.
 */
export function replaySchedule(
  form: AnswerForm,
  attempts: ReplayedAttempt[],
): ReplayedSchedule | null {
  const history = [...attempts].sort((a, b) => a.attemptedAt.getTime() - b.attemptedAt.getTime())

  const last = history.at(-1)
  if (!last) return null

  let step: LadderStep = 0
  for (const attempt of history) {
    step = nextRung(form, attempt.result, step).step
  }

  return {
    step,
    lastResult: last.result,
    dueAt: nextDueDate(step, last.attemptedAt),
    updatedAt: last.attemptedAt,
  }
}
