import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, reviewSchedule, topicProgress } from '@/db/schema'
import { getTopic } from '@/content/loader'
import { questionKey } from '@/content/schema'
import { nextDueDate, nextStep, type Confidence, type Result } from '@/lib/interval-ladder'
import { gradeMcq } from '@/lib/mcq'
import { answerAudioKey } from '@/lib/speech'
import { matchesExpectedOutput, OUTPUT_CONFIDENCE } from '@/lib/output-answer'

export type AttemptInput = {
  topicSlug: string
  questionId: string
  answer: string
  result: Result
  confidence: Confidence
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
 * browser up front, so there is nothing to peek at before submitting.
 */
export async function revealQuestion(
  topicSlug: string,
  questionId: string,
): Promise<{ expectedAnswer: string; explanation: string; answerAudioKey: string }> {
  const question = await loadQuestion(topicSlug, questionId)

  if (question.expectedAnswer === undefined) {
    throw new Error(
      `Question ${topicSlug}#${questionId} is answered by choosing an option, not by revealing text`,
    )
  }

  return {
    expectedAnswer: question.expectedAnswer,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
  }
}

/**
 * Grades a multiple choice answer on the server and records it in one step.
 * The correct option is never sent to the browser beforehand, so submitting is
 * the only way to find out, and there is nothing to self assess afterwards.
 */
export async function answerMultipleChoice(
  userId: string,
  topicSlug: string,
  questionId: string,
  chosen: number,
  now = new Date(),
) {
  const question = await loadQuestion(topicSlug, questionId)
  const verdict = gradeMcq(question, chosen)

  await recordAttempt(
    userId,
    {
      topicSlug,
      questionId,
      answer: verdict.answer,
      result: verdict.result,
      confidence: verdict.confidence,
      hintsUsed: 0,
    },
    now,
  )

  return {
    correct: verdict.correct,
    correctOption: verdict.correctOption,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
    result: verdict.result,
  }
}

/**
 * Records one attempt and moves the question along the ladder. Attempts are only
 * ever inserted, so the history of how an explanation improved stays readable.
 */
export async function recordAttempt(userId: string, input: AttemptInput, now = new Date()) {
  const key = questionKey(input.topicSlug, input.questionId)
  const step = nextStep(input.result, input.confidence)
  const dueAt = nextDueDate(step, now)

  await db.insert(attempts).values({
    userId,
    questionId: key,
    topicSlug: input.topicSlug,
    answer: input.answer,
    result: input.result,
    confidence: input.confidence,
    hintsUsed: input.hintsUsed,
    notes: input.notes ?? null,
    attemptedAt: now,
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

/**
 * Checks a typed output against what the program actually prints, and records
 * the attempt. Nothing is self graded here: the answer is exact, so reading the
 * expected value and then marking yourself correct is the weakest possible way
 * to find out whether you were.
 */
export async function answerOutputQuestion(
  userId: string,
  topicSlug: string,
  questionId: string,
  answer: string,
  hintsUsed: number,
  now = new Date(),
) {
  const question = await loadQuestion(topicSlug, questionId)

  if (question.expectedOutput === undefined) {
    throw new Error(`Question ${topicSlug}#${questionId} is not checked against printed output`)
  }

  const correct = matchesExpectedOutput(answer, question.expectedOutput)
  const result: Result = correct ? 'passed' : 'failed'

  await recordAttempt(
    userId,
    {
      topicSlug,
      questionId,
      answer,
      result,
      confidence: OUTPUT_CONFIDENCE,
      hintsUsed,
    },
    now,
  )

  return {
    correct,
    expectedOutput: question.expectedOutput,
    explanation: question.explanation,
    answerAudioKey: answerAudioKey(question),
    result,
  }
}
