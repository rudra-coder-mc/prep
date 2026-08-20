import type { ZodType } from 'zod'
import {
  exerciseSchema,
  narrationSchema,
  questionSchema,
  topicMetaSchema,
  type Exercise,
  type Narration,
  type Question,
  type TopicMeta,
} from './schema'

/** Fails loudly, naming the file and the offending field. */
export function parseContent<T>(schema: ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data

  const problems = result.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid content in ${file}:\n${problems}`)
}

export type RawTopic = {
  meta: unknown
  questions: unknown
  exercises: unknown
  /** Absent when the topic has no narration.ts, which is allowed. */
  narration?: unknown
}
export type ValidatedTopic = {
  meta: TopicMeta
  questions: Question[]
  exercises: Exercise[]
  narration: Narration | null
}

export function validateTopic(raw: RawTopic, directory: string, base: string): ValidatedTopic {
  const meta = parseContent(topicMetaSchema, raw.meta, `${base}/meta.ts`)

  if (meta.slug !== directory) {
    throw new Error(
      `Invalid content in ${base}/meta.ts:\n  slug: must match the directory name, which is "${directory}"`,
    )
  }

  const questions = parseContent(questionSchema.array(), raw.questions, `${base}/questions.ts`)
  const duplicates = [
    ...new Set(questions.map((q) => q.id).filter((id, i, all) => all.indexOf(id) !== i)),
  ]
  if (duplicates.length > 0) {
    throw new Error(
      `Invalid content in ${base}/questions.ts:\n  id: duplicated (${duplicates.join(', ')})`,
    )
  }

  const exercises = parseContent(exerciseSchema.array(), raw.exercises, `${base}/exercises.ts`)

  // A topic without narration shows no player. A topic with a broken one fails
  // here, rather than offering a play button that turns out to say nothing.
  const narration =
    raw.narration === undefined
      ? null
      : parseContent(narrationSchema, raw.narration, `${base}/narration.ts`)

  return { meta, questions, exercises, narration }
}
