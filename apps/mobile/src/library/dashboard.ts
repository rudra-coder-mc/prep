import type { ArchiveContent } from '@prep/content/archive/types'
import { summariseDashboard, type Dashboard } from '@prep/core'
import { readActivity } from '../db/activity'
import { readExerciseProgress } from '../db/exercises'
import { readAllAttempts, readLearnedTopics, readTrackTiers } from '../db/progress'
import { readSchedule } from '../db/schedule'
import type { Database } from '../db/sqlite'

/**
 * The dashboard, from this device's rows.
 *
 * Which rows, and nothing about what they mean. Every number is
 * `summariseDashboard` in @prep/core over the archive and the mirrored tables,
 * which is the same fold the web runs over the same rows in Postgres, so once a
 * sync has run the two surfaces show the same dashboard. This mirrors
 * apps/web/src/lib/dashboard.ts.
 */
export async function readDashboard(
  db: Database,
  content: ArchiveContent,
  now = new Date(),
): Promise<Dashboard> {
  const [tiers, attempts, schedule, learnedAt, exercises, activity] = await Promise.all([
    readTrackTiers(db),
    readAllAttempts(db),
    readSchedule(db),
    readLearnedTopics(db),
    readExerciseProgress(db),
    readActivity(db),
  ])

  return summariseDashboard(
    {
      topics: content.topics,
      tiers,
      attempts,
      learnedAt,
      ladderSteps: new Map(schedule.map((row) => [row.questionId, row.intervalStep])),
      exercises,
      activity,
    },
    now,
  )
}
