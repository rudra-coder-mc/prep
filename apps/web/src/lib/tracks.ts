import { technologyLabel, type Readiness, type TopicStatus } from '@prep/core'

/** The part of a topic overview a track summary actually needs. */
export type TrackTopic = {
  technology: string
  status: TopicStatus
}

export type TrackSummary = {
  id: string
  label: string
  total: number
  started: number
  /** How ready the track is for the tier picked on it. */
  readiness: Readiness
}

/**
 * Rolls topics up into the tracks they belong to. Nothing here knows which
 * technologies exist; the list is whatever the content directory contains, so a
 * new track appears on the dashboard without a code change.
 *
 * A track with no readiness of its own is dropped rather than shown at zero: it
 * has no topics the picked tier covers, so there is nothing to be ready for.
 */
export function summariseTracks(
  topics: TrackTopic[],
  readiness: Map<string, Readiness>,
): TrackSummary[] {
  const grouped = new Map<string, TrackTopic[]>()

  for (const topic of topics) {
    const existing = grouped.get(topic.technology) ?? []
    existing.push(topic)
    grouped.set(topic.technology, existing)
  }

  return [...grouped.entries()]
    .flatMap(([id, group]) => {
      const ready = readiness.get(id)
      if (!ready) return []

      return [
        {
          id,
          label: technologyLabel(id),
          total: group.length,
          started: group.filter((topic) => topic.status !== 'not_started').length,
          readiness: ready,
        },
      ]
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
