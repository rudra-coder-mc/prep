import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, reviewSchedule, topicProgress } from '@/db/schema'
import { getTopic } from '@prep/content'
import {
  questionKey,
  type AnswerForm,
  nextDueDate,
  nextRung,
  type LadderStep,
  type Result,
  gradeChoice,
  gradeOrdering,
} from '@prep/core'
import { answerAudioKey } from '@/lib/speech'

export type AttemptInput = {
  topicSlug: string
  questionId: string
  answer: string
  result: Result
  /** Which form was answered. The ladder derives the rest from it. */
  form: AnswerForm
  hintsUsed: number
  notes?: string
}

function splitSlug(topicSlug: string): [string, string] {
  const [technology, directory] = topicSlug.split('/')
  if (!technology || !directory) throw new Error(`Malformed topic slug: ${topicSlug}`)
  return [technology, directory]
}

async function loadQuestion(topicSlug: string, questionId: string) {
  const topic = await getTopic(...splitSlug(topicSlug))
  const question = topic?.questions.find((candidate) => candidate.id === questionId)
  if (!question) throw new Error(`No such question: ${topicSlug}#${questionId}`)
  return question
}

/**
 * Loads a question's answer on demand. The session never sends it to the
 * browser up front, so there is nothing to peek at before answering. This is how
 * an open question works: reveal, then mark yourself against what you said.
 */
export async function revealQuestion(
  topicSlug: string,
  questionId: string,
): Promise<{ answerInFull: string; explanation?: string; answerAudioKey: string }> {
  const question = await loadQuestion(topicSlug, questionId)

  // The answer in full names the correct option, so serving it for a choice
  // question would be a way to read the answer without answering. The same is
  // true of an ordering question, whose answer names the sequence. Only an open
  // question is revealed, and only it has a reveal button.
  if (question.form !== 'open') {
    const gives = question.form === 'ordering' ? 'sequence' : 'option'
    throw new Error(
      `Question ${topicSlug}#${questionId} is answered rather than revealed, since its answer names the correct ${gives}`,
    )
  }

  return {
    answerInFull: question.answerInFull,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
  }
}

/**
 * Grades a choice answer on the server and records it in one step. The correct
 * option is never sent to the browser beforehand, so submitting is the only way
 * to find out, and there is nothing to self assess afterwards.
 */
export async function answerChoice(
  userId: string,
  topicSlug: string,
  questionId: string,
  chosen: number,
  now = new Date(),
) {
  const question = await loadQuestion(topicSlug, questionId)
  const verdict = gradeChoice(question, chosen)

  await recordAttempt(
    userId,
    {
      topicSlug,
      questionId,
      answer: verdict.answer,
      result: verdict.result,
      form: 'choice',
      hintsUsed: 0,
    },
    now,
  )

  return {
    correct: verdict.correct,
    correctOption: verdict.correctOption,
    answerInFull: question.answerInFull,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
    result: verdict.result,
  }
}

/**
 * Grades a built sequence on the server and records it in one step. The page
 * receives the pool but never which entries print, so submitting is the only way
 * to find out.
 */
export async function answerOrdering(
  userId: string,
  topicSlug: string,
  questionId: string,
  submitted: number[],
  hintsUsed: number,
  now = new Date(),
) {
  const question = await loadQuestion(topicSlug, questionId)
  const verdict = gradeOrdering(question, submitted)

  await recordAttempt(
    userId,
    {
      topicSlug,
      questionId,
      answer: verdict.answer,
      result: verdict.result,
      form: 'ordering',
      hintsUsed,
    },
    now,
  )

  return {
    correct: verdict.correct,
    correctOrder: verdict.correctOrder,
    answerInFull: question.answerInFull,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
    result: verdict.result,
  }
}

/**
 * Records the self grade on an open question, the one form the platform cannot
 * grade itself. Nothing was submitted, so the attempt stores no answer: what
 * happened is the grade, and the reader already has the answer in front of them.
 */
export async function recordSelfGrade(
  userId: string,
  topicSlug: string,
  questionId: string,
  result: Result,
  hintsUsed: number,
  now = new Date(),
) {
  const question = await loadQuestion(topicSlug, questionId)

  if (question.form !== 'open') {
    throw new Error(`Question ${topicSlug}#${questionId} is graded by the platform, not by hand`)
  }

  return recordAttempt(
    userId,
    {
      topicSlug,
      questionId,
      answer: '',
      result,
      form: 'open',
      hintsUsed,
    },
    now,
  )
}

/**
 * Where the question sits now. A question with no schedule row has never been
 * answered, so it starts at the bottom and one correct answer moves it up one.
 */
async function currentRung(userId: string, key: string): Promise<LadderStep> {
  const [row] = await db
    .select({ intervalStep: reviewSchedule.intervalStep })
    .from(reviewSchedule)
    .where(and(eq(reviewSchedule.userId, userId), eq(reviewSchedule.questionId, key)))
    .limit(1)

  return (row?.intervalStep ?? 0) as LadderStep
}

/**
 * Records one attempt and moves the question along the ladder. Attempts are only
 * ever inserted, so the history of how an explanation improved stays readable.
 */
export async function recordAttempt(userId: string, input: AttemptInput, now = new Date()) {
  const key = questionKey(input.topicSlug, input.questionId)
  const { step, confidence } = nextRung(input.form, input.result, await currentRung(userId, key))
  const dueAt = nextDueDate(step, now)

  await db.insert(attempts).values({
    userId,
    questionId: key,
    topicSlug: input.topicSlug,
    answer: input.answer,
    result: input.result,
    confidence,
    hintsUsed: input.hintsUsed,
    notes: input.notes ?? null,
    attemptedAt: now,
    // An answer given here is learned of here, at the same moment. The column
    // exists for the ones that are not: see @/lib/sync.
    recordedAt: now,
  })

  await db
    .insert(reviewSchedule)
    .values({
      userId,
      questionId: key,
      topicSlug: input.topicSlug,
      dueAt,
      intervalStep: step,
      lastResult: input.result,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [reviewSchedule.userId, reviewSchedule.questionId],
      set: { dueAt, intervalStep: step, lastResult: input.result, updatedAt: now },
    })

  await db
    .insert(topicProgress)
    .values({ userId, topicSlug: input.topicSlug, lastReviewedAt: now })
    .onConflictDoUpdate({
      target: [topicProgress.userId, topicProgress.topicSlug],
      set: { lastReviewedAt: now },
    })

  return { step, dueAt }
}

export async function countAttempts(userId: string, topicSlug: string) {
  const rows = await db
    .select({ result: attempts.result })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.topicSlug, topicSlug)))

  return {
    total: rows.length,
    passed: rows.filter((r) => r.result === 'passed').length,
    weak: rows.filter((r) => r.result === 'weak').length,
    failed: rows.filter((r) => r.result === 'failed').length,
  }
}
