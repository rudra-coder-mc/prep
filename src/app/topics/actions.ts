'use server'

import { revalidatePath } from 'next/cache'
import { markTopicLearned } from '@/lib/progress'
import { requireSession } from '@/lib/session'

export async function markLearnedAction(technology: string, directory: string) {
  const session = await requireSession()
  await markTopicLearned(session.user.id, technology, directory)
  revalidatePath(`/topics/${technology}/${directory}`)
}
