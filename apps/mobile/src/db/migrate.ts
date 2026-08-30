import type { Database } from './sqlite'

/**
 * The server's progress tables, on the device.
 *
 * Every table here is one from apps/web/src/db/schema.ts with the user column
 * dropped, because a device holds one account and nothing else. The phone
 * mirrors these rather than deriving them when it reads, so both sides run the
 * same functions from @prep/core over the same rows and cannot disagree about
 * what is due. See
 * docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
 *
 * The curriculum is not here. It arrives as one archive that is replaced whole,
 * which is a file rather than a set of tables. See
 * docs/decisions/0043-the-phone-keeps-content-in-a-file-and-progress-in-sqlite.md.
 *
 * Timestamps are ISO-8601 strings in UTC. SQLite has no date type, and strings
 * in that form sort as dates, compare as dates, and are what the sync already
 * puts on the wire.
 */

const MIGRATIONS: string[] = [
  `
  create table settings (
    key   text primary key,
    value text not null
  );

  create table attempts (
    id           text primary key,
    question_id  text not null,
    topic_slug   text not null,
    answer       text not null default '',
    result       text not null,
    confidence   integer not null,
    hints_used   integer not null default 0,
    notes        text,
    attempted_at text not null,
    -- Whether the server has been told. An attempt is never edited, so this is
    -- the whole of what a sync has to track about one.
    synced       integer not null default 0
  );
  create index attempts_question on attempts (question_id);
  create index attempts_topic on attempts (topic_slug);
  create index attempts_unsynced on attempts (synced);

  create table review_schedule (
    question_id   text primary key,
    topic_slug    text not null,
    due_at        text not null,
    interval_step integer not null default 0,
    last_result   text,
    updated_at    text not null
  );
  create index review_schedule_due on review_schedule (due_at);

  create table topic_progress (
    topic_slug       text primary key,
    learned_at       text,
    last_reviewed_at text
  );

  create table track_tier (
    technology text primary key,
    tier       text not null,
    updated_at text not null
  );

  create table exercise_progress (
    exercise_slug text primary key,
    topic_slug    text not null,
    status        text not null default 'in_progress',
    notes         text,
    completed_at  text,
    updated_at    text not null
  );

  create table daily_activity (
    day           text primary key,
    reviewed      integer not null default 0,
    queue_cleared integer not null default 0
  );
  `,
]

/** What a database that has had every migration below reports. */
export const SCHEMA_VERSION = MIGRATIONS.length

/**
 * Brings the database up to the current schema, and does nothing when it is
 * already there. It runs on every launch, so the ordinary case is the one that
 * has to be free.
 *
 * `user_version` is the ledger rather than a table of applied migrations. There
 * is one writer, one device and one schema, so a counter says everything a
 * table would.
 */
export async function migrate(db: Database): Promise<void> {
  const [row] = await db.all<{ user_version: number }>('pragma user_version')
  const current = row?.user_version ?? 0
  if (current >= SCHEMA_VERSION) return

  for (const migration of MIGRATIONS.slice(current)) {
    await db.execute(migration)
  }

  // Interpolated because SQLite will not take a parameter in a pragma. The value
  // is the length of a literal array in this file, so there is nothing to inject.
  await db.execute(`pragma user_version = ${SCHEMA_VERSION}`)
}
