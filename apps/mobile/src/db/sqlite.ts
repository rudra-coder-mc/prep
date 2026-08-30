/**
 * The database as the app sees it: four methods, all asynchronous, all
 * parameterised.
 *
 * `expo-sqlite` is behind this on the phone and `node:sqlite` is behind it in a
 * test, which is the only reason the interface exists. The queries above it are
 * the same either way, so what a test proves is what the phone runs. See
 * docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
 */

/** Everything this app stores. Dates are ISO-8601 strings; SQLite has no date type. */
export type SqlValue = string | number | null

export type Database = {
  /** Statements with no parameters, which is schema and pragmas and nothing else. */
  execute(sql: string): Promise<void>
  run(sql: string, params?: SqlValue[]): Promise<void>
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>
  transaction<T>(work: () => Promise<T>): Promise<T>
}
