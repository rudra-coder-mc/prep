import { describe, expect, it } from 'vitest'
import { TIERS, type Tier } from './schema'
import { DEFAULT_TIER, questionsUpTo, tiersUpTo } from './tiers'

function question(id: string, tier: Tier) {
  return { id, tier }
}

const BANK = [
  question('one-concept', 'swe-1'),
  question('the-common-bug', 'swe-2'),
  question('the-trade-off', 'senior'),
  question('the-failure-mode', 'staff'),
]

describe('tiersUpTo', () => {
  it('covers only the first tier at the bottom of the path', () => {
    expect(tiersUpTo('swe-1')).toEqual(['swe-1'])
  })

  it('covers the tiers below the picked one, since a tier is cumulative', () => {
    expect(tiersUpTo('senior')).toEqual(['swe-1', 'swe-2', 'senior'])
  })

  it('covers every tier at the top', () => {
    expect(tiersUpTo('staff')).toEqual([...TIERS])
  })
})

describe('questionsUpTo', () => {
  it('enrols the picked tier and nothing above it', () => {
    expect(questionsUpTo(BANK, 'swe-2').map((q) => q.id)).toEqual(['one-concept', 'the-common-bug'])
  })

  it('leaves out every question when the topic is asked above the pick', () => {
    const senior = [question('the-trade-off', 'senior'), question('the-failure-mode', 'staff')]
    expect(questionsUpTo(senior, 'swe-1')).toEqual([])
  })

  it('keeps the order the topic authored, since a session reads them in it', () => {
    const shuffled = [
      question('the-failure-mode', 'staff'),
      question('the-common-bug', 'swe-2'),
      question('one-concept', 'swe-1'),
    ]
    expect(questionsUpTo(shuffled, 'swe-2').map((q) => q.id)).toEqual([
      'the-common-bug',
      'one-concept',
    ])
  })
})

describe('the default tier', () => {
  it('is the bottom of the path, so an unpicked track promises nothing yet', () => {
    expect(DEFAULT_TIER).toBe(TIERS[0])
  })
})
