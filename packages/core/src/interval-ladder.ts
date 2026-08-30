import type { AnswerForm } from './schema'

/**
 * The recall interval ladder: five rungs, and where a question lands decides how
 * long until it comes back.
 *
 * Nobody rates their own confidence any more. The platform works out what an
 * answer was worth from the form it took and how it went, which is the only
 * thing left to work it out from once no question takes typed input.
 *
 * See docs/decisions/0005-recall-interval-ladder.md and
 * docs/decisions/0025-confidence-is-derived-and-the-ladder-climbs.md.
 */
export const LADDER_DAYS = [0, 1, 3, 7, 14] as const

/** The bottom rung means "later today" rather than "immediately again". */
export const SAME_DAY_HOURS = 4

export type Confidence = 1 | 2 | 3 | 4 | 5
export type Result = 'passed' | 'weak' | 'failed'
export type LadderStep = 0 | 1 | 2 | 3 | 4

export const TOP_RUNG: LadderStep = 4

/**
 * What kind of evidence an answer of each form is, recorded on the attempt so
 * the history says how a question was answered rather than only whether it was.
 *
 * On a graded form this is all the number does. It deliberately does not cap the
 * rung: a choice question held at three days because recognising an option is
 * weak evidence would never leave the daily queue.
 */
export const GRADED_CONFIDENCE: Record<'choice' | 'ordering', Confidence> = {
  choice: 3,
  ordering: 4,
}

/**
 * What a self grade is worth. An open question is the only form with a person's
 * judgement behind it, so the grade sets the rung outright: saying you could
 * explain it buys the fortnight a machine-graded answer has to climb to.
 */
export const SELF_GRADE_CONFIDENCE: Record<Result, Confidence> = {
  passed: 5,
  weak: 3,
  failed: 1,
}

export type Rung = { step: LadderStep; confidence: Confidence }

/**
 * Where a question lands after one answer, and what that answer is recorded as.
 *
 * A graded form climbs one rung from wherever the question already sits, so a
 * question answered correctly again and again works its way out to a fortnight
 * instead of returning on the same interval forever. An open question is placed
 * by its self grade rather than moved, because a Weak on something answered
 * correctly four times is real information and should pull it back down.
 *
 * Any wrong answer goes to the bottom, whatever the form and however long the
 * question had been climbing. That is what stands in for the guess a choice
 * question cannot rule out.
 */
export function nextRung(form: AnswerForm, result: Result, from: LadderStep): Rung {
  if (form === 'open') {
    const confidence = SELF_GRADE_CONFIDENCE[result]
    return { step: result === 'failed' ? 0 : ((confidence - 1) as LadderStep), confidence }
  }

  const confidence = GRADED_CONFIDENCE[form]
  if (result !== 'passed') return { step: 0, confidence }

  return { step: Math.min(from + 1, TOP_RUNG) as LadderStep, confidence }
}

export function daysUntilDue(step: LadderStep): number {
  return LADDER_DAYS[step] ?? 0
}

export function nextDueDate(step: LadderStep, from: Date): Date {
  const days = daysUntilDue(step)
  const due = new Date(from)

  if (days === 0) {
    due.setHours(due.getHours() + SAME_DAY_HOURS)
    return due
  }

  due.setDate(due.getDate() + days)
  return due
}

export const RESULT_LABELS: Record<Result, string> = {
  passed: 'Passed',
  weak: 'Weak',
  failed: 'Failed',
}
