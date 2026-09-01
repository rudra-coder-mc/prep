import type { AttemptRecord, Tier } from '@prep/core'
import type { SyncTierPick } from '../server/client'
import type { Database } from './sqlite'

/**
 * Reading the mirrored progress tables.
 *
 * Every function here hands back the shape @prep/core already takes, with dates
 * as dates, so the phone and the server run the same functions over the same
 * values. Turning a stored string into a Date is the whole of what the device's
 * query layer does that the server's does not, because SQLite has no date type.
 */

export async function readTrackTiers(db: Database): Promise<Map<string, Tier>> {
  const rows = await db.all<{ technology: string; tier: Tier }>(
    'select technology, tier from track_tier',
  )
  return new Map(rows.map((row) => [row.technology, row.tier]))
}

/**
 * The picks with the timestamps a sync merges them by. The map above is what a
 * screen reads; this is what goes on the wire.
 */
export async function readTierPicks(db: Database): Promise<SyncTierPick[]> {
  const rows = await db.all<{ technology: string; tier: Tier; updated_at: string }>(
    'select technology, tier, updated_at from track_tier',
  )
  return rows.map((row) => ({
    technology: row.technology,
    tier: row.tier,
    updatedAt: new Date(row.updated_at),
  }))
}

/**
 * When each topic was marked learned, which is the act that enrols its
 * questions. A topic with a row but no mark has been reviewed and not read, so
 * it is not in here.
 */
export async function readLearnedTopics(db: Database): Promise<Map<string, Date>> {
  const rows = await db.all<{ topic_slug: string; learned_at: string }>(
    'select topic_slug, learned_at from topic_progress where learned_at is not null',
  )
  return new Map(rows.map((row) => [row.topic_slug, new Date(row.learned_at)]))
}

/** Every attempt against the given topics, oldest first, grouped by topic. */
export async function readAttemptsForTopics(
  db: Database,
  topicSlugs: string[],
): Promise<Map<string, AttemptRecord[]>> {
  const byTopic = new Map<string, AttemptRecord[]>()
  if (topicSlugs.length === 0) return byTopic

  const placeholders = topicSlugs.map(() => '?').join(', ')
  const rows = await db.all<{
    topic_slug: string
    question_id: string
    result: AttemptRecord['result']
    attempted_at: string
  }>(
    `select topic_slug, question_id, result, attempted_at from attempts
     where topic_slug in (${placeholders}) order by attempted_at`,
    topicSlugs,
  )

  for (const row of rows) {
    const attempts = byTopic.get(row.topic_slug) ?? []
    attempts.push({
      questionId: row.question_id,
      result: row.result,
      attemptedAt: new Date(row.attempted_at),
    })
    byTopic.set(row.topic_slug, attempts)
  }

  return byTopic
}
