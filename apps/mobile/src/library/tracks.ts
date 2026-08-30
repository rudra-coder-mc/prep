import type { ArchiveContent, ArchiveTopic } from '@prep/content/archive/types'
import {
  DEFAULT_TIER,
  questionsUpTo,
  summariseTopic,
  technologyLabel,
  type AttemptRecord,
  type Tier,
  type TopicStatus,
} from '@prep/core'

/**
 * The archive and the mirrored tables, read together into what a screen shows.
 *
 * Nothing here decides anything. The tier a question belongs to, what a tier
 * covers and how a topic is scored are all @prep/core's, so the phone and the
 * laptop show the same numbers for the same rows. This file only says which
 * rows.
 */

export type TrackSummary = {
  id: string
  label: string
  tier: Tier
  topics: number
  /** How many questions the picked tier covers, which is what there is to prepare. */
  questions: number
}

export type TopicSummary = {
  slug: string
  title: string
  summary: string
  questions: number
  status: TopicStatus
  progress: number
}

export function trackSummaries(content: ArchiveContent, tiers: Map<string, Tier>): TrackSummary[] {
  return content.technologies.map(({ id }) => {
    const tier = tiers.get(id) ?? DEFAULT_TIER
    const topics = topicsIn(content, id)

    return {
      id,
      label: technologyLabel(id),
      tier,
      topics: topics.length,
      questions: topics.reduce(
        (total, topic) => total + questionsUpTo(topic.questions, tier).length,
        0,
      ),
    }
  })
}

export type TopicSummaryOptions = {
  tier: Tier
  learned: Map<string, Date>
  attempts: Map<string, AttemptRecord[]>
}

export function topicSummaries(
  content: ArchiveContent,
  technology: string,
  { tier, learned, attempts }: TopicSummaryOptions,
): TopicSummary[] {
  return topicsIn(content, technology).map((topic) => {
    // Against the tier rather than against everything the topic holds. A topic
    // whose SWE-1 questions are all passing is finished for somebody preparing
    // for SWE-1, and counting the senior ones in would say otherwise forever.
    const questions = questionsUpTo(topic.questions, tier)
    const summary = summariseTopic(
      questions.length,
      attempts.get(topic.slug) ?? [],
      learned.get(topic.slug) ?? null,
    )

    return {
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      questions: questions.length,
      status: summary.status,
      progress: summary.progress,
    }
  })
}

function topicsIn(content: ArchiveContent, technology: string): ArchiveTopic[] {
  return content.topics
    .filter((topic) => topic.technology === technology)
    .sort((a, b) => a.order - b.order)
}
