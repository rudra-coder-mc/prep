'use server'

import { revalidatePath } from 'next/cache'
import { setExerciseStatus, type ExerciseStatus } from '@/lib/exercises'
import { requireSession } from '@/lib/session'

export async function setExerciseStatusAction(input: {
  technology: string
  directory: string
  exerciseId: string
  status: ExerciseStatus
  notes: string
}) {
  const session = await requireSession()
  const topicSlug = `${input.technology}/${input.directory}`

  await setExerciseStatus(session.user.id, topicSlug, input.exerciseId, input.status, input.notes)
  revalidatePath(`/topics/${input.technology}/${input.directory}/exercises`)
}
