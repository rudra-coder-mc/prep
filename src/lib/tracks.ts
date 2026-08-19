import { technologyLabel } from '@/content/technologies'
import type { TopicStatus } from './topic-status'

/** The part of a topic overview a track summary actually needs. */
export type TrackTopic = {
  technology: string
  status: TopicStatus
  progress: number
}

export type TrackSummary = {
  id: string
  label: string
  total: number
  started: number
  /** Mean progress across every topic in the track, including untouched ones. */
  progress: number
}

/**
 * Rolls topics up into the tracks they belong to. Nothing here knows which
 * technologies exist; the list is whatever the content directory contains, so a
 * new track appears on the dashboard without a code change.
 */
export function summariseTracks(topics: TrackTopic[]): TrackSummary[] {
  const grouped = new Map<string, TrackTopic[]>()

  for (const topic of topics) {
    const existing = grouped.get(topic.technology) ?? []
    existing.push(topic)
    grouped.set(topic.technology, existing)
  }

  return [...grouped.entries()]
    .map(([id, group]) => ({
      id,
      label: technologyLabel(id),
      total: group.length,
      started: group.filter((topic) => topic.status !== 'not_started').length,
      progress: Math.round(
        group.reduce((total, topic) => total + topic.progress, 0) / group.length,
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
