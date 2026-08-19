import { describe, expect, it } from 'vitest'
import { summariseTracks, type TrackTopic } from './tracks'

const topic = (technology: string, overrides: Partial<TrackTopic> = {}): TrackTopic => ({
  technology,
  status: 'not_started',
  progress: 0,
  ...overrides,
})

describe('summariseTracks', () => {
  it('returns nothing when there is no content', () => {
    expect(summariseTracks([])).toEqual([])
  })

  it('groups topics by their technology', () => {
    const tracks = summariseTracks([topic('javascript'), topic('javascript'), topic('react')])

    expect(tracks.map((track) => [track.id, track.total])).toEqual([
      ['javascript', 2],
      ['react', 1],
    ])
  })

  it('counts a topic as started once it is anything but not_started', () => {
    const tracks = summariseTracks([
      topic('javascript', { status: 'learning' }),
      topic('javascript', { status: 'mastered' }),
      topic('javascript'),
    ])

    expect(tracks[0]?.started).toBe(2)
  })

  it('averages progress across the whole track, not just its started topics', () => {
    const tracks = summariseTracks([
      topic('javascript', { progress: 100 }),
      topic('javascript', { progress: 50 }),
      topic('javascript', { progress: 0 }),
    ])

    expect(tracks[0]?.progress).toBe(50)
  })

  it('sorts by label so the list does not reorder as content is added', () => {
    const tracks = summariseTracks([topic('react'), topic('javascript'), topic('mongodb')])

    expect(tracks.map((track) => track.label)).toEqual(['JavaScript', 'MongoDB', 'React'])
  })
})
