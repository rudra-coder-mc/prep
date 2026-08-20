import { z } from 'zod'
import { MAX_SCRIPT_LENGTH, normaliseScript } from '@/lib/speech/script'

export const QUESTION_TYPES = [
  'concept',
  'output',
  'debugging',
  'coding',
  'scenario',
  'architecture',
  'interview',
  'mcq',
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

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'must be lowercase words separated by hyphens'),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.enum(DIFFICULTIES),
    prompt: z.string().min(1),
    code: z
      .string()
      .optional()
      .describe('Shown with the prompt, for output and debugging questions.'),
    options: z
      .array(z.string().min(1))
      .optional()
      .describe('Multiple choice answers, in the order they are shown and read aloud.'),
    correctOption: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Which entry in options is right. The answer itself, so it is never sent early.'),
    expectedAnswer: z
      .string()
      .min(1)
      .optional()
      .describe('Revealed after answering. Absent on multiple choice, which grades itself.'),
    expectedOutput: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Exactly what the program prints. Present means the answer is checked, not self graded.',
      ),
    explanation: z.string().min(1),
    hints: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  })
  /**
   * A multiple choice question and a written one carry different fields, and
   * mixing them silently is how a question ends up with an answer nobody reads
   * or options nobody can choose. Each shape has to be complete and exclusive.
   */
  .superRefine((question, ctx) => {
    if (question.type === 'mcq') {
      const options = question.options ?? []

      if (options.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'a multiple choice question needs at least two options',
        })
      }

      if (new Set(options).size !== options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'options must be unique, or more than one of them is arguably correct',
        })
      }

      if (question.correctOption === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['correctOption'],
          message: 'required, since nothing else says which option is right',
        })
      } else if (question.correctOption >= options.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['correctOption'],
          message: `must index into options, which has ${options.length}`,
        })
      }

      if (question.expectedAnswer !== undefined || question.expectedOutput !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: question.expectedAnswer !== undefined ? ['expectedAnswer'] : ['expectedOutput'],
          message: 'the correct option is the answer, so this would only drift out of step with it',
        })
      }

      return
    }

    if (question.options !== undefined || question.correctOption !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: `only a multiple choice question has options, and this one is "${question.type}"`,
      })
    }

    if (question.type === 'output') {
      // An output question is either checked against what the program prints or
      // graded by eye against a written answer. Carrying both would mean two
      // answers to keep in step, and no way to say which one is authoritative.
      if (question.expectedAnswer !== undefined && question.expectedOutput !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['expectedOutput'],
          message: 'give either expectedOutput or expectedAnswer, not both',
        })
      }

      if (question.expectedAnswer === undefined && question.expectedOutput === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['expectedOutput'],
          message: 'an output question needs expectedOutput, or expectedAnswer to grade by eye',
        })
      }

      return
    }

    if (question.expectedOutput !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['expectedOutput'],
        message: `only an output question is checked against printed output, and this one is "${question.type}"`,
      })
    }

    if (question.expectedAnswer === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['expectedAnswer'],
        message: 'required for every question that is not multiple choice',
      })
    }
  })

/**
 * One stretch of spoken narration. Sections are what the player moves between,
 * and they are also the unit the engine speaks in one request, which is why the
 * length is bounded here rather than discovered at play time.
 *
 * A narration is not the lesson. A lesson read out loud sounds like a document
 * being read, because it is one: code blocks become nonsense, tables become
 * nothing, and the reader has no idea where they are. The script is separate
 * text, written to be heard.
 *
 * Separate text still has to say where it is, which is what `heading` is for:
 * the lesson heading the section covers, so the page can show the reader the
 * part being talked about.
 */
export const narrationSectionSchema = z.object({
  title: z.string().min(1).describe('Shown in the player, and how a listener finds their place.'),
  heading: z
    .string()
    .min(1)
    .describe(
      'The lesson heading this section is talking about, written exactly as the lesson writes it. The page highlights that part of the lesson while the section plays, and the content check refuses a heading the lesson does not have.',
    ),
  script: z
    .string()
    .refine((value) => normaliseScript(value).length > 0, 'has a title but nothing to say')
    .refine(
      (value) => normaliseScript(value).length <= MAX_SCRIPT_LENGTH,
      `must be at most ${MAX_SCRIPT_LENGTH} characters once whitespace is collapsed, which is what the engine speaks in one request`,
    ),
})

export const narrationSchema = z
  .array(narrationSectionSchema)
  .min(1, 'a narration with no sections would render a player with nothing in it')

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
export type NarrationSection = z.infer<typeof narrationSectionSchema>
export type Narration = z.infer<typeof narrationSchema>
export type QuestionType = (typeof QUESTION_TYPES)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]

/** A question's identity across the whole platform, stored on attempts. */
export function questionKey(topicSlug: string, questionId: string): string {
  return `${topicSlug}#${questionId}`
}

export function exerciseKey(topicSlug: string, exerciseId: string): string {
  return `${topicSlug}/${exerciseId}`
}
