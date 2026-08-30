// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getAllTopics, type Topic } from '@prep/content'
import type { Question } from '@prep/core'
import { scriptKey } from './cache'
import { narrate } from './narrate'
import { spokenScriptKeys } from './spoken-content'
import { answerScript, questionScript } from './spoken-question'
import { buildRecordings, plannedRecordings, topicsIn, unrecorded } from './build'

vi.mock('./narrate', () => ({ narrate: vi.fn() }))

const synthesise = vi.mocked(narrate)

const question: Question = {
  id: 'q',
  type: 'concept',
  form: 'open',
  tier: 'swe-1',
  prompt: 'What is a closure?',
  answerInFull: 'A function plus the scope it was defined in.',
  explanation: 'The binding is shared.',
  hints: [],
  tags: [],
}

function topic(directory: string, parts: Partial<Topic> = {}): Topic {
  return {
    slug: `javascript/${directory}`,
    technology: 'javascript',
    directory,
    title: directory,
    summary: 'One line.',
    order: 1,
    tags: [],
    prerequisites: [],
    questions: [],
    exercises: [],
    narration: null,
    ...parts,
  }
}

function section(title: string, script: string) {
  return { title, heading: title, script }
}

describe('plannedRecordings', () => {
  it('covers every narration section and both scripts of every question', () => {
    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('What it is', 'A closure is a function and its scope.')],
        questions: [question],
      }),
    ])

    expect(planned.map((item) => item.script)).toEqual([
      'A closure is a function and its scope.',
      questionScript(question),
      answerScript(question),
    ])
  })

  it('addresses each script the way its recording is named', () => {
    const [first] = plannedRecordings([
      topic('closures', { narration: [section('What it is', 'A closure.')] }),
    ])

    expect(first?.key).toBe(scriptKey('A closure.'))
  })

  it('names the topic in every label, since a whole track is one run', () => {
    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('What it is', 'A closure.')],
        questions: [question],
      }),
    ])

    expect(planned.map((item) => item.what)).toEqual([
      'javascript/closures What it is',
      'javascript/closures#q question',
      'javascript/closures#q answer',
    ])
  })

  it('plans the questions of a topic that has no narration at all', () => {
    expect(plannedRecordings([topic('hoisting', { questions: [question] })])).toHaveLength(2)
  })

  /**
   * A recording is addressed by its script, so two questions that read the same
   * are one recording. Counting it twice would report a total the cache can
   * never reach.
   */
  it('plans one recording for a script that appears twice', () => {
    const shared = section('Shared', 'The same words in two topics.')

    const planned = plannedRecordings([
      topic('closures', { narration: [shared] }),
      topic('scope', { narration: [shared] }),
    ])

    expect(planned).toHaveLength(1)
  })

  /**
   * The keys planned here and the keys `spoken-content` hands out are the same
   * set or this command is a lie: it would report a track fully recorded while
   * a listen button asks for a key nothing ever built.
   */
  it('plans exactly the scripts the app can ask for', async () => {
    const planned = plannedRecordings(await getAllTopics())

    expect(new Set(planned.map((item) => item.key))).toEqual(await spokenScriptKeys())
  })
})

describe('unrecorded', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'prep-build-'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('leaves out what is already on disk', async () => {
    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('One', 'The first section.'), section('Two', 'The second section.')],
      }),
    ])
    await writeFile(join(directory, `${scriptKey('The first section.')}.opus`), 'audio')

    expect(await unrecorded(planned, directory)).toEqual([
      expect.objectContaining({ script: 'The second section.' }),
    ])
  })

  it('counts everything as missing when no recording has ever been made', async () => {
    const planned = plannedRecordings([topic('closures', { questions: [question] })])

    expect(await unrecorded(planned, join(directory, 'never-written'))).toHaveLength(2)
  })
})

describe('buildRecordings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    synthesise.mockResolvedValue({ audio: new Uint8Array(), key: 'k', source: 'engine' })
  })

  it('records every script it is given', async () => {
    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('One', 'The first.'), section('Two', 'The second.')],
      }),
    ])

    expect(await buildRecordings(planned)).toEqual({ recorded: 2, already: 0 })
    expect(synthesise.mock.calls.map(([script]) => script)).toEqual(['The first.', 'The second.'])
  })

  /**
   * The engine is one container doing real work, so a track arriving at once
   * would only make it slower.
   */
  it('waits for each recording before starting the next', async () => {
    let running = 0
    let together = 0
    synthesise.mockImplementation(async () => {
      running += 1
      together = Math.max(together, running)
      await Promise.resolve()
      running -= 1
      return { audio: new Uint8Array(), key: 'k', source: 'engine' as const }
    })

    await buildRecordings(
      plannedRecordings([
        topic('closures', {
          narration: [section('One', 'The first.'), section('Two', 'The second.')],
        }),
      ]),
    )

    expect(together).toBe(1)
  })

  /**
   * Not being able to tell what a run built is the reason this command was
   * widened to a track, so a recording that was already there is counted rather
   * than passed over in silence.
   */
  it('tells a recording it made from one that was already there', async () => {
    synthesise.mockResolvedValueOnce({ audio: new Uint8Array(), key: 'k', source: 'cache' })

    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('One', 'The first.'), section('Two', 'The second.')],
      }),
    ])

    expect(await buildRecordings(planned)).toEqual({ recorded: 1, already: 1 })
  })

  it('reports each recording as it is made, against the total it is working through', async () => {
    const progress: string[] = []
    const planned = plannedRecordings([
      topic('closures', {
        narration: [section('One', 'The first.'), section('Two', 'The second.')],
      }),
    ])

    await buildRecordings(planned, (item, done, total) => {
      progress.push(`${done}/${total} ${item.what}`)
    })

    expect(progress).toEqual(['1/2 javascript/closures One', '2/2 javascript/closures Two'])
  })
})

describe('topicsIn', () => {
  it('takes a whole track', async () => {
    const topics = await topicsIn('javascript')

    expect(topics.length).toBeGreaterThan(1)
    expect(topics.every((found) => found.technology === 'javascript')).toBe(true)
  })

  it('takes one topic, so a single lesson can still be recorded on its own', async () => {
    expect((await topicsIn('javascript/closures')).map((found) => found.slug)).toEqual([
      'javascript/closures',
    ])
  })

  /** Completing a directory name in a shell leaves the slash on the end. */
  it('takes a track named with a trailing slash', async () => {
    expect(await topicsIn('javascript/')).toEqual(await topicsIn('javascript'))
  })

  it('refuses a track that does not exist, naming both forms', async () => {
    await expect(topicsIn('elixir')).rejects.toThrow(/javascript.*javascript\/closures/s)
  })

  it('refuses a topic that does not exist', async () => {
    await expect(topicsIn('javascript/nothing-like-this')).rejects.toThrow(
      /javascript\/nothing-like-this/,
    )
  })
})
