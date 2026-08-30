import { DatabaseSync } from 'node:sqlite'
import type { Database, SqlValue } from '../src/db/sqlite'

/**
 * The same database interface over `node:sqlite`, so the queries the phone runs
 * are the queries a test runs, against real SQLite rather than a stand-in.
 *
 * It is outside src/ because it is the one part of this app that runs on Node,
 * and apps/mobile/tsconfig.json has no Node types precisely so that nothing in
 * src/ can import one by accident and find out in Metro instead of here.
 */
export function createTestDatabase(): Database & { close(): void } {
  const db = new DatabaseSync(':memory:')

  return {
    async execute(sql) {
      db.exec(sql)
    },
    async run(sql, params = []) {
      db.prepare(sql).run(...params)
    },
    async all<T>(sql: string, params: SqlValue[] = []) {
      // node:sqlite hands back null-prototype objects, which compare unequal to
      // the plain ones a test writes out.
      return db
        .prepare(sql)
        .all(...params)
        .map((row) => ({ ...row })) as T[]
    },
    async transaction<T>(work: () => Promise<T>) {
      db.exec('BEGIN')
      try {
        const result = await work()
        db.exec('COMMIT')
        return result
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    close() {
      db.close()
    },
  }
}
