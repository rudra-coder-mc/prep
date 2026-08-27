import { TIERS, type Tier } from '@/content/schema'

/**
 * The rung a question has to reach before it counts toward the promise. Step 3
 * is three correct answers spread over at least four days, which is the
 * difference between recognising an answer and recalling it, and the reason the
 * interval ladder exists at all.
 *
 * One question can arrive here faster. A self graded open question is placed by
 * its grade rather than moved a rung at a time, so one Passed puts it at the
 * top. That is a person's own judgement about their own explanation, which is
 * the strongest evidence this platform has, and there is at most one open
 * question per topic. See
 * docs/decisions/0025-confidence-is-derived-and-the-ladder-climbs.md.
 */
export const READY_STEP = 3

export type Readiness = {
  tier: Tier
  /** Questions the tier covers that have reached READY_STEP. */
  retained: number
  /** Every question the tier covers, whether or not its topic was ever learned. */
  total: number
  percent: number
  /** The tier to offer next, set only when this one is finished. */
  stepUpTo: Tier | null
  /** How many questions accepting that offer would enrol. Zero when there is none. */
  stepUpAdds: number
}

/** The tier above this one, or null at the top of the path. */
export function nextTier(tier: Tier): Tier | null {
  return TIERS[TIERS.indexOf(tier) + 1] ?? null
}

/**
 * How ready somebody is for the level of interview they picked.
 *
 * The denominator is every question the tier covers, not the ones enrolled so
 * far. The promise is about the tier, so a person who has learned one topic
 * perfectly is not ready for the interview, and a readiness that said otherwise
 * would be measuring effort rather than preparedness. It is also why the count
 * is shown beside the share: a tier this bank is thin at would otherwise read as
 * a confident percentage of almost nothing.
 *
 * A finished tier offers the next one and never takes it, and the offer says how
 * many questions accepting it enrols. Stepping up silently would triple the next
 * morning's queue, and an offer that does not say by how much is the same
 * surprise with a button on it. `wouldEnrol` is that number, counted by the
 * caller, because only it knows which topics have been marked learned and
 * stepping up reaches no others.
 */
export function summariseReadiness(
  tier: Tier,
  questionIds: string[],
  ladderSteps: Map<string, number>,
  wouldEnrol = 0,
): Readiness {
  const total = questionIds.length
  const retained = questionIds.filter((id) => (ladderSteps.get(id) ?? -1) >= READY_STEP).length
  const finished = total > 0 && retained === total
  const stepUpTo = finished ? nextTier(tier) : null

  return {
    tier,
    retained,
    total,
    percent: total === 0 ? 0 : Math.round((retained / total) * 100),
    stepUpTo,
    stepUpAdds: stepUpTo ? wouldEnrol : 0,
  }
}
