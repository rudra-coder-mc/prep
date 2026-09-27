import type { Database } from './sqlite'

/**
 * The handful of things a device remembers that are not progress: where the
 * server is, what this device calls itself, and which archive it holds.
 *
 * A key and a value rather than columns, because there are five of them, they
 * are unrelated to each other, and a table per setting would be five tables.
 * The token is not here: it is the one secret, and it lives in the keystore.
 */
export type SettingKey =
  | 'server-address'
  | 'device-id'
  | 'device-name'
  /** Written last by an install, so its presence is what says one finished. */
  | 'archive-version'
  /** The `syncedAt` of the last exchange, which the next one asks from. */
  | 'last-synced-at'
  /** Whose progress the tables hold. See ../session/session.ts. */
  | 'account-id'
  | 'account-email'
  | 'account-name'
  /** The default target interview level across tracks (e.g. 'swe-1'). */
  | 'default-tier'

export async function readSetting(db: Database, key: SettingKey): Promise<string | null> {
  const rows = await db.all<{ value: string }>('select value from settings where key = ?', [key])
  return rows[0]?.value ?? null
}

export async function writeSetting(db: Database, key: SettingKey, value: string): Promise<void> {
  await db.run(
    'insert into settings (key, value) values (?, ?) on conflict (key) do update set value = excluded.value',
    [key, value],
  )
}
