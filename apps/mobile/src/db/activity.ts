import { countDueToday, toDayString, type ActivityDay } from '@prep/core'
import { readSchedule } from './schedule'
import type { Database } from './sqlite'

/**
 * What was done on each day, which is the only thing a streak is derived from.
 *
 * It is counted as the answer is given rather than worked out afterwards,
 * because whether the queue was cleared is true of a moment and stops being
 * recoverable once the day is over. This mirrors `recordReview` in
 * apps/web/src/lib/activity.ts.
 */

export async function readActivity(db: Database): Promise<ActivityDay[]> {
  const rows = await db.all<{ day: string; reviewed: number; queue_cleared: number }>(
    'select day, reviewed, queue_cleared from daily_activity order by day',
  )

  return rows.map((row) => ({
    day: row.day,
    reviewed: row.reviewed,
    queueCleared: row.queue_cleared === 1,
  }))
}

/** Counts one review against today, and says whether that emptied the queue. */
export async function recordReview(
  db: Database,
  now: Date,
): Promise<{ day: string; cleared: boolean }> {
  const day = toDayString(now)
  const cleared = countDueToday(await readSchedule(db), now) === 0

  await db.run(
    `insert into daily_activity (day, reviewed, queue_cleared) values (?, 1, ?)
     on conflict (day) do update set
       reviewed = reviewed + 1,
       queue_cleared = excluded.queue_cleared`,
    [day, cleared ? 1 : 0],
  )

  return { day, cleared }
}
