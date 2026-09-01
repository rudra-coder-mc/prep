import { exerciseKey, type ExerciseStatus } from '@prep/core'
import type { Database } from './sqlite'

/**
 * How far along each exercise is, on the device.
 *
 * This is the one part of the loop nothing derives. An exercise is solved in an
 * editor and the platform is only ever told the outcome, so unlike the schedule
 * or the streak it cannot be rebuilt from attempts and has to be carried by a
 * sync as state. It merges by `updated_at`, the way a tier pick does. This
 * mirrors apps/web/src/lib/exercises.ts.
 */

export type ExerciseRow = {
  exerciseSlug: string
  topicSlug: string
  status: ExerciseStatus
  notes: string | null
  completedAt: Date | null
  updatedAt: Date
}

type StoredRow = {
  exercise_slug: string
  topic_slug: string
  status: ExerciseStatus
  notes: string | null
  completed_at: string | null
  updated_at: string
}

const SELECT = `select exercise_slug, topic_slug, status, notes, completed_at, updated_at
                from exercise_progress`

function toRow(row: StoredRow): ExerciseRow {
  return {
    exerciseSlug: row.exercise_slug,
    topicSlug: row.topic_slug,
    status: row.status,
    notes: row.notes,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    updatedAt: new Date(row.updated_at),
  }
}

/** Every row, which is what the dashboard counts and what a sync hands over. */
export async function readExerciseProgress(db: Database): Promise<ExerciseRow[]> {
  return (await db.all<StoredRow>(SELECT)).map(toRow)
}

/** One topic's rows, keyed by the exercise slug the screen looks them up by. */
export async function readTopicExercises(
  db: Database,
  topicSlug: string,
): Promise<Map<string, ExerciseRow>> {
  const rows = await db.all<StoredRow>(`${SELECT} where topic_slug = ?`, [topicSlug])
  return new Map(rows.map((row) => [row.exercise_slug, toRow(row)]))
}

/**
 * Records how an exercise went. An empty note is stored as null rather than as
 * an empty string, which is what the server stores, so the two sides do not
 * disagree about a row that says nothing.
 */
export async function setExerciseStatus(
  db: Database,
  input: { topicSlug: string; exerciseId: string; status: ExerciseStatus; notes: string },
  now: Date,
): Promise<void> {
  const slug = exerciseKey(input.topicSlug, input.exerciseId)
  const completedAt = input.status === 'completed' ? now.toISOString() : null

  await db.run(
    `insert into exercise_progress
       (exercise_slug, topic_slug, status, notes, completed_at, updated_at)
     values (?, ?, ?, ?, ?, ?)
     on conflict (exercise_slug) do update set
       status = excluded.status,
       notes = excluded.notes,
       completed_at = excluded.completed_at,
       updated_at = excluded.updated_at`,
    [slug, input.topicSlug, input.status, input.notes || null, completedAt, now.toISOString()],
  )
}
