import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */
/* Owned by better-auth. Shapes follow its documented schema so the Drizzle    */
/* adapter can use them directly.                                             */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */
/* Slugs point at content directories in git and are deliberately not foreign  */
/* keys. See docs/decisions/0002-content-in-git.md.                            */

export const attemptResult = pgEnum('attempt_result', ['passed', 'weak', 'failed'])
export const exerciseStatus = pgEnum('exercise_status', ['in_progress', 'completed'])

/** Written when a topic is marked as learned, which is what enrols its questions. */
export const topicProgress = pgTable(
  'topic_progress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    topicSlug: text('topic_slug').notNull(),
    learnedAt: timestamp('learned_at'),
    lastReviewedAt: timestamp('last_reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique('topic_progress_user_topic').on(table.userId, table.topicSlug)],
)

/** Full history. Rows are never updated, so past self-assessments stay readable. */
export const attempts = pgTable(
  'attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    topicSlug: text('topic_slug').notNull(),
    answer: text('answer').notNull().default(''),
    result: attemptResult('result').notNull(),
    confidence: integer('confidence').notNull(),
    notes: text('notes'),
    hintsUsed: integer('hints_used').notNull().default(0),
    attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  },
  (table) => [
    index('attempts_user_question').on(table.userId, table.questionId),
    index('attempts_user_attempted_at').on(table.userId, table.attemptedAt),
    index('attempts_user_topic').on(table.userId, table.topicSlug),
  ],
)

/** Where each question sits on the interval ladder, and when it is next due. */
export const reviewSchedule = pgTable(
  'review_schedule',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    topicSlug: text('topic_slug').notNull(),
    dueAt: timestamp('due_at').notNull(),
    intervalStep: integer('interval_step').notNull().default(0),
    lastResult: attemptResult('last_result'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    unique('review_schedule_user_question').on(table.userId, table.questionId),
    index('review_schedule_user_due').on(table.userId, table.dueAt),
  ],
)

export const exerciseProgress = pgTable(
  'exercise_progress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    exerciseSlug: text('exercise_slug').notNull(),
    topicSlug: text('topic_slug').notNull(),
    status: exerciseStatus('status').notNull().default('in_progress'),
    notes: text('notes'),
    completedAt: timestamp('completed_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique('exercise_progress_user_exercise').on(table.userId, table.exerciseSlug)],
)

/** One row per user per day. The streak is derived from these, never stored. */
export const dailyActivity = pgTable(
  'daily_activity',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    reviewed: integer('reviewed').notNull().default(0),
    queueCleared: boolean('queue_cleared').notNull().default(false),
  },
  (table) => [unique('daily_activity_user_day').on(table.userId, table.day)],
)

export const userRelations = relations(user, ({ many }) => ({
  topicProgress: many(topicProgress),
  attempts: many(attempts),
  reviewSchedule: many(reviewSchedule),
  exerciseProgress: many(exerciseProgress),
  dailyActivity: many(dailyActivity),
}))
