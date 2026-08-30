/**
 * Where the session token is kept. It is the one secret this app holds, so it
 * gets the keystore rather than the settings table.
 *
 * The interface is here for the reason ../db/sqlite.ts has one: `expo-secure-store`
 * is behind it on the phone and a map is behind it in a test.
 */
export type SecretStore = {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
