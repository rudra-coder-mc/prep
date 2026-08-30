import { describe, expect, it } from 'vitest'
import type { Readiness } from '@prep/core'
import { summariseTracks, type TrackTopic } from './tracks'

const topic = (technology: string, overrides: Partial<TrackTopic> = {}): TrackTopic => ({
  technology,
  status: 'not_started',
  ...overrides,
})

const readiness = (overrides: Partial<Readiness> = {}): Readiness => ({
  tier: 'swe-1',
  retained: 0,
  total: 10,
  percent: 0,
  stepUpTo: null,
  stepUpAdds: 0,
  ...overrides,
})

const READY = new Map([
  ['javascript', readiness()],
  ['react', readiness()],
  ['mongodb', readiness()],
])

const READY_FOR_JAVASCRIPT = new Map([['javascript', readiness()]])

describe('summariseTracks', () => {
  it('returns nothing when there is no content', () => {
    expect(summariseTracks([], READY)).toEqual([])
  })

  it('groups topics by their technology', () => {
    const tracks = summariseTracks(
      [topic('javascript'), topic('javascript'), topic('react')],
      READY,
    )

    expect(tracks.map((track) => [track.id, track.total])).toEqual([
      ['javascript', 2],
      ['react', 1],
    ])
  })

  it('counts a topic as started once it is anything but not_started', () => {
    const tracks = summariseTracks(
      [
        topic('javascript', { status: 'learning' }),
        topic('javascript', { status: 'mastered' }),
        topic('javascript'),
      ],
      READY,
    )

    expect(tracks[0]?.started).toBe(2)
  })

  it('carries the readiness of the tier picked on the track', () => {
    const tracks = summariseTracks(
      [topic('javascript')],
      new Map([['javascript', readiness({ tier: 'swe-2', retained: 5, percent: 50 })]]),
    )

    expect(tracks[0]?.readiness.tier).toBe('swe-2')
    expect(tracks[0]?.readiness.percent).toBe(50)
  })

  it('drops a track the picked tier covers nothing of', () => {
    const tracks = summariseTracks([topic('javascript'), topic('react')], READY_FOR_JAVASCRIPT)

    expect(tracks.map((track) => track.id)).toEqual(['javascript'])
  })

  it('sorts by label so the list does not reorder as content is added', () => {
    const tracks = summariseTracks([topic('react'), topic('javascript'), topic('mongodb')], READY)

    expect(tracks.map((track) => track.label)).toEqual(['JavaScript', 'MongoDB', 'React'])
  })
})
