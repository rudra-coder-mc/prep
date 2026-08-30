import type { ArchiveContent } from '@prep/content/archive/types'
import { questionKey, questionsUpTo, type Tier } from '@prep/core'
import { enrol } from '../db/schedule'
import type { Database } from '../db/sqlite'

/**
 * Marking a topic learned, which is what enrols its questions into recall.
 *
 * Only the questions at or below the track's tier are enrolled, which is the
 * server's rule in apps/web/src/lib/progress.ts. Doing it twice is free: the
 * mark moves to now, and every question already climbing stays where it is.
 */
export async function markTopicLearned(
  db: Database,
  content: ArchiveContent,
  topicSlug: string,
  tier: Tier,
  now: Date,
): Promise<void> {
  const topic = content.topics.find((candidate) => candidate.slug === topicSlug)
  if (!topic) throw new Error(`This device holds no copy of ${topicSlug}`)

  const at = now.toISOString()

  // Reading a topic says nothing about when it was last reviewed, so the
  // column the queue writes is left alone.
  await db.run(
    `insert into topic_progress (topic_slug, learned_at) values (?, ?)
     on conflict (topic_slug) do update set learned_at = excluded.learned_at`,
    [topicSlug, at],
  )

  await enrol(
    db,
    questionsUpTo(topic.questions, tier).map((question) => ({
      questionId: questionKey(topicSlug, question.id),
      topicSlug,
    })),
    now,
  )
}
