/**
 * The recall interval ladder. Confidence sets how long until a question returns;
 * a failed result drops it to the bottom regardless of how confident the answer
 * felt.
 *
 * See docs/decisions/0005-recall-interval-ladder.md.
 */
export const LADDER_DAYS = [0, 1, 3, 7, 14] as const

/** The bottom rung means "later today" rather than "immediately again". */
export const SAME_DAY_HOURS = 4

export type Confidence = 1 | 2 | 3 | 4 | 5
export type Result = 'passed' | 'weak' | 'failed'
export type LadderStep = 0 | 1 | 2 | 3 | 4

export function nextStep(result: Result, confidence: Confidence): LadderStep {
  if (result === 'failed') return 0
  return (confidence - 1) as LadderStep
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

/**
 * What a self grade is worth on the ladder.
 *
 * An open question is the only form with a person's judgement behind it, so the
 * grade sets the rung outright. A failed result resets whatever this says, so
 * its entry only ever reaches the stored attempt.
 */
export const SELF_GRADE_CONFIDENCE: Record<Result, Confidence> = {
  passed: 5,
  weak: 3,
  failed: 1,
}

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  1: "I don't understand it",
  2: 'I partly understand it',
  3: 'I can explain it with some help',
  4: 'I understand it',
  5: 'I can explain and apply it confidently',
}

export const RESULT_LABELS: Record<Result, string> = {
  passed: 'Passed',
  weak: 'Weak',
  failed: 'Failed',
}
