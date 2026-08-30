import { TIERS, type Tier } from './schema'

/**
 * The tier somebody is on before they pick one. The bottom of the path, because
 * a tier is a claim about the interview you are ready for and nothing has been
 * answered yet that would support a higher one.
 */
export const DEFAULT_TIER: Tier = 'swe-1'

/**
 * Every tier a pick covers. Tiers are cumulative, so preparing for SWE-2 means
 * the SWE-1 and SWE-2 questions together. See
 * docs/decisions/0028-tiers-are-interview-levels.md.
 */
export function tiersUpTo(tier: Tier): Tier[] {
  return TIERS.slice(0, TIERS.indexOf(tier) + 1)
}

/** The questions a pick enrols: the picked tier and everything below it. */
export function questionsUpTo<T extends { tier: Tier }>(questions: readonly T[], tier: Tier): T[] {
  const covered = new Set<Tier>(tiersUpTo(tier))
  return questions.filter((question) => covered.has(question.tier))
}
