import type { ArchiveContent, ArchiveTopic } from '@prep/content/archive/types'
import type { Question, Tier } from '@prep/core'
import { describe, expect, it } from 'vitest'
import { topicSummaries, trackSummaries } from './tracks'

/**
 * What the two screens show, worked out from the archive and the mirrored
 * tables together.
 *
 * The counting and the status are @prep/core's, not this app's, so what these
 * check is that the right rows reach them: a track counts the questions its
 * tier covers rather than all of them, and a topic's status is read from its
 * own attempts. See
 * docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
 */

function question(id: string, tier: Tier): Question {
  return {
    id,
    tier,
    type: 'concept',
    form: 'choice',
    prompt: 'why',
    answerInFull: 'because',
    options: ['a', 'b'],
    correctOption: 0,
  } as Question
}

function topic(technology: string, directory: string, questions: Question[]): ArchiveTopic {
  return {
    slug: `${technology}/${directory}`,
    technology,
    directory,
    title: directory,
    summary: 'a summary',
    order: 1,
    tags: [],
    prerequisites: [],
    lesson: `lessons/${technology}/${directory}.html`,
    questions: questions.map((q) => ({ ...q, promptAudioKey: 'k', answerAudioKey: 'k' })),
    exercises: [],
    narration: null,
  }
}

const CONTENT: ArchiveContent = {
  version: 'v1',
  technologies: [
    { id: 'javascript', topics: ['javascript/closures', 'javascript/scope'] },
    { id: 'browser', topics: ['browser/the-dom'] },
  ],
  topics: [
    topic('javascript', 'closures', [question('q1', 'swe-1'), question('q2', 'senior')]),
    topic('javascript', 'scope', [question('q1', 'swe-1')]),
    topic('browser', 'the-dom', [question('q1', 'swe-2')]),
  ],
}

describe('the tracks a device holds', () => {
  it('counts only the questions the picked tier covers', async () => {
    const [javascript] = trackSummaries(CONTENT, new Map())

    // SWE-1 by default, so the senior question in closures is not on the path yet.
    expect(javascript).toMatchObject({ id: 'javascript', tier: 'swe-1', topics: 2, questions: 2 })
  })

  it('follows the tier picked for that track', async () => {
    const [javascript] = trackSummaries(CONTENT, new Map([['javascript', 'senior' as Tier]]))

    expect(javascript).toMatchObject({ tier: 'senior', questions: 3 })
  })

  it('spells the technology the way the platform spells it', async () => {
    expect(trackSummaries(CONTENT, new Map()).map((track) => track.label)).toEqual([
      'JavaScript',
      'Browser',
    ])
  })
})

describe('the topics in a track', () => {
  const learned = new Map([['javascript/closures', new Date('2026-08-01T00:00:00.000Z')]])

  it('is not started until it has been read', async () => {
    const [closures, scope] = topicSummaries(CONTENT, 'javascript', {
      tier: 'swe-1',
      learned,
      attempts: new Map(),
    })

    expect(closures?.status).toBe('learning')
    expect(scope?.status).toBe('not_started')
  })

  it('takes its status from the attempts against it', async () => {
    const attempts = new Map([
      [
        'javascript/closures',
        [
          {
            questionId: 'javascript/closures#q1',
            result: 'failed' as const,
            attemptedAt: new Date('2026-08-02T00:00:00.000Z'),
          },
        ],
      ],
    ])

    const [closures] = topicSummaries(CONTENT, 'javascript', { tier: 'swe-1', learned, attempts })

    expect(closures?.status).toBe('weak')
  })

  /**
   * The status is a share of the topic's questions, so it has to be counted
   * against the tier being prepared for. Counted against every question a topic
   * has, a finished SWE-1 topic would read as half done forever.
   */
  it('counts progress against the tier rather than the whole topic', async () => {
    const attempts = new Map([
      [
        'javascript/closures',
        [
          {
            questionId: 'javascript/closures#q1',
            result: 'passed' as const,
            attemptedAt: new Date('2026-08-02T00:00:00.000Z'),
          },
        ],
      ],
    ])

    const [atSwe1] = topicSummaries(CONTENT, 'javascript', { tier: 'swe-1', learned, attempts })
    const [atSenior] = topicSummaries(CONTENT, 'javascript', { tier: 'senior', learned, attempts })

    expect(atSwe1?.progress).toBe(100)
    expect(atSenior?.progress).toBe(50)
  })

  it('has nothing to show for a track the archive does not hold', async () => {
    expect(
      topicSummaries(CONTENT, 'nestjs', { tier: 'swe-1', learned, attempts: new Map() }),
    ).toEqual([])
  })
})
