'use server'

import { recordAttempt, revealQuestion, type AttemptInput } from '@/lib/attempts'
import { isConfidence } from '@/lib/interval-ladder'
import { requireSession } from '@/lib/session'

export async function revealAnswerAction(topicSlug: string, questionId: string) {
  await requireSession()
  return revealQuestion(topicSlug, questionId)
}

export async function recordAttemptAction(input: AttemptInput) {
  const session = await requireSession()
  if (!isConfidence(input.confidence)) throw new Error('Confidence must be between 1 and 5')

  const { dueAt } = await recordAttempt(session.user.id, input)
  return { dueAt: dueAt.toISOString() }
}
