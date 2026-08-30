import * as SQLite from 'expo-sqlite'
import type { Database, SqlValue } from './sqlite'

/**
 * The device's database, which is `expo-sqlite` behind ./sqlite.ts.
 *
 * Nothing above this line knows which SQLite it is talking to, which is what
 * lets the queries and the migration be tested against a real database off the
 * phone. See ./testing.ts for the other side of that.
 */

/** One file, in the app's own storage, deleted only by uninstalling the app. */
const DATABASE_FILE = 'prep.db'

export async function openDatabase(): Promise<Database> {
  const db = await SQLite.openDatabaseAsync(DATABASE_FILE)

  // Off by default, and every table here has a slug or an id that another one
  // refers to by name. Turning it on costs nothing and catches a wrong join.
  await db.execAsync('pragma foreign_keys = on')

  return {
    async execute(sql) {
      await db.execAsync(sql)
    },
    async run(sql, params = []) {
      await db.runAsync(sql, params)
    },
    all<T>(sql: string, params: SqlValue[] = []) {
      return db.getAllAsync<T>(sql, params)
    },
    async transaction<T>(work: () => Promise<T>) {
      let result: T
      await db.withTransactionAsync(async () => {
        result = await work()
      })
      // Assigned above or the transaction threw, in which case this is never
      // reached. TypeScript cannot see through the callback to know that.
      return result!
    },
  }
}
