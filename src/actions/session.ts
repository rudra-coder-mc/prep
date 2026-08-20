'use server'

import { recordReview } from '@/lib/activity'
import { answerChoice, answerOrdering, recordSelfGrade, revealQuestion } from '@/lib/attempts'
import type { Result } from '@/lib/interval-ladder'
import { requireSession } from '@/lib/session'

export async function revealAnswerAction(topicSlug: string, questionId: string) {
  await requireSession()
  return revealQuestion(topicSlug, questionId)
}

export async function answerChoiceAction(topicSlug: string, questionId: string, chosen: number) {
  const session = await requireSession()

  const verdict = await answerChoice(session.user.id, topicSlug, questionId, chosen)
  await recordReview(session.user.id)

  return verdict
}

export async function answerOrderingAction(
  topicSlug: string,
  questionId: string,
  submitted: number[],
  hintsUsed: number,
) {
  const session = await requireSession()

  const verdict = await answerOrdering(session.user.id, topicSlug, questionId, submitted, hintsUsed)
  await recordReview(session.user.id)

  return verdict
}

export async function selfGradeAction(
  topicSlug: string,
  questionId: string,
  result: Result,
  hintsUsed: number,
) {
  const session = await requireSession()

  const { dueAt } = await recordSelfGrade(session.user.id, topicSlug, questionId, result, hintsUsed)
  // Activity is written after the schedule moves, so "cleared" reflects the
  // queue as it stands once this answer is counted.
  const { cleared } = await recordReview(session.user.id)

  return { dueAt: dueAt.toISOString(), queueCleared: cleared }
}
