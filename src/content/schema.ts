import { z } from 'zod'
import { MAX_SCRIPT_LENGTH, normaliseScript } from '@/lib/speech/script'

/** What a question is about. Independent of how it is answered. */
export const QUESTION_TYPES = [
  'concept',
  'output',
  'debugging',
  'coding',
  'scenario',
  'interview',
] as const

/**
 * How a question is answered. No form takes typed text: an answer nobody grades
 * is a self grade with extra steps, and an exact string comparison fails over
 * quote characters rather than over the answer. See
 * docs/decisions/0023-every-question-is-answered-never-typed.md.
 */
export const ANSWER_FORMS = ['choice', 'open'] as const

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
    type: z.enum(QUESTION_TYPES).describe('What the question is about.'),
    form: z.enum(ANSWER_FORMS).describe('How it is answered.'),
    difficulty: z.enum(DIFFICULTIES),
    prompt: z.string().min(1),
    code: z
      .string()
      .optional()
      .describe('Shown with the prompt, for output and debugging questions.'),
    options: z
      .array(z.string().min(1))
      .optional()
      .describe('Choice answers, in the order they are shown and read aloud.'),
    correctOption: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Which entry in options is right. The answer itself, so it is never sent early.'),
    answerInFull: z
      .string()
      .min(1)
      .describe(
        'What you would say if an interviewer asked. Shown once the question is answered, whatever its form.',
      ),
    explanation: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Only what the answer leaves out: why a wrong option was tempting, the follow up, the consequence. Absent when the answer says everything worth saying.',
      ),
    hints: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  })
  /**
   * Options belong to a choice question and to nothing else. A question with
   * options nobody can pick, or a choice question with no options, is a session
   * that renders wrong rather than a build that fails, so it is caught here.
   */
  .superRefine((question, ctx) => {
    if (question.form === 'choice') {
      const options = question.options ?? []

      if (options.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['options'],
          message: 'a choice question needs at least two options',
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

      return
    }

    if (question.options !== undefined || question.correctOption !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: `only a choice question has options, and this one is answered by "${question.form}"`,
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
export type AnswerForm = (typeof ANSWER_FORMS)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]

/** A question's identity across the whole platform, stored on attempts. */
export function questionKey(topicSlug: string, questionId: string): string {
  return `${topicSlug}#${questionId}`
}

export function exerciseKey(topicSlug: string, exerciseId: string): string {
  return `${topicSlug}/${exerciseId}`
}
