import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { exerciseProgress } from '@/db/schema'
import { exerciseKey } from '@prep/core'

export type ExerciseStatus = 'in_progress' | 'completed'
export type ExerciseProgressRow = typeof exerciseProgress.$inferSelect

export async function getExerciseProgress(
  userId: string,
  topicSlug: string,
): Promise<Map<string, ExerciseProgressRow>> {
  const rows = await db
    .select()
    .from(exerciseProgress)
    .where(and(eq(exerciseProgress.userId, userId), eq(exerciseProgress.topicSlug, topicSlug)))

  return new Map(rows.map((row) => [row.exerciseSlug, row]))
}

export async function setExerciseStatus(
  userId: string,
  topicSlug: string,
  exerciseId: string,
  status: ExerciseStatus,
  notes: string,
  now = new Date(),
) {
  const slug = exerciseKey(topicSlug, exerciseId)
  const completedAt = status === 'completed' ? now : null

  await db
    .insert(exerciseProgress)
    .values({
      userId,
      exerciseSlug: slug,
      topicSlug,
      status,
      notes: notes || null,
      completedAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [exerciseProgress.userId, exerciseProgress.exerciseSlug],
      set: { status, notes: notes || null, completedAt, updatedAt: now },
    })
}
