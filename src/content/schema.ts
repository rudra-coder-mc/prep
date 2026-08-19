import { z } from 'zod'

export const QUESTION_TYPES = [
  'concept',
  'output',
  'debugging',
  'coding',
  'scenario',
  'architecture',
  'interview',
] as const

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export const topicMetaSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'must be lowercase words separated by hyphens')
    .describe('Directory name. Combined with the technology to form the full slug.'),
  title: z.string().min(1),
  summary: z.string().min(1).describe('One line shown in topic lists.'),
  order: z.number().int().nonnegative(),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
})

export const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'must be lowercase words separated by hyphens'),
  type: z.enum(QUESTION_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  prompt: z.string().min(1),
  code: z
    .string()
    .optional()
    .describe('Shown with the prompt, for output and debugging questions.'),
  expectedAnswer: z.string().min(1),
  explanation: z.string().min(1),
  hints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

export const exerciseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'must be lowercase words separated by hyphens'),
  title: z.string().min(1),
  difficulty: z.enum(DIFFICULTIES),
  prompt: z.string().min(1),
  requirements: z.array(z.string()).min(1),
})

export type TopicMeta = z.infer<typeof topicMetaSchema>
export type Question = z.infer<typeof questionSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type QuestionType = (typeof QUESTION_TYPES)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]

/** A question's identity across the whole platform, stored on attempts. */
export function questionKey(topicSlug: string, questionId: string): string {
  return `${topicSlug}#${questionId}`
}

export function exerciseKey(topicSlug: string, exerciseId: string): string {
  return `${topicSlug}/${exerciseId}`
}
