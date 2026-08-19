/**
 * The recall interval ladder. Confidence sets how long until a question returns;
 * a failed result drops it to the bottom regardless of how confident the answer felt.
 *
 * See docs/decisions/0005-recall-interval-ladder.md.
 */
export const LADDER_DAYS = [0, 1, 3, 7, 14] as const

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
