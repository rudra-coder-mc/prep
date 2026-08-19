'use server'

import { recordReview } from '@/lib/activity'
import {
  answerMultipleChoice,
  recordAttempt,
  revealQuestion,
  type AttemptInput,
} from '@/lib/attempts'
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
  // Activity is written after the schedule moves, so "cleared" reflects the
  // queue as it stands once this answer is counted.
  const { cleared } = await recordReview(session.user.id)

  return { dueAt: dueAt.toISOString(), queueCleared: cleared }
}

export async function answerMcqAction(topicSlug: string, questionId: string, chosen: number) {
  const session = await requireSession()

  const verdict = await answerMultipleChoice(session.user.id, topicSlug, questionId, chosen)
  await recordReview(session.user.id)

  return verdict
}
