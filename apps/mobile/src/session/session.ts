import { readSetting, writeSetting } from '../db/settings'
import type { Database } from '../db/sqlite'
import type { SecretStore } from './secrets'

/**
 * The credential this device holds and what is kept beside it.
 *
 * The token is a better-auth session sent as a bearer header, good for thirty
 * days and moved forward every time the server answers, so a device in ordinary
 * use never signs in twice. See
 * docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
 */

const TOKEN_KEY = 'session-token'

export type SessionAccount = { id: string; email: string; name: string }

export type StoredSession = {
  address: string
  token: string
  user: SessionAccount
}

export type SessionStores = { db: Database; secrets: SecretStore }

/** Everything the mirrored tables hold about a person, and nothing else. */
const PROGRESS_TABLES = [
  'attempts',
  'review_schedule',
  'topic_progress',
  'track_tier',
  'exercise_progress',
  'daily_activity',
]

export async function signIn(
  { db, secrets }: SessionStores,
  { address, session }: { address: string; session: { token: string; user: SessionAccount } },
): Promise<void> {
  // There is one account, so this should never differ. If it ever does, the
  // rows on this device belong to somebody else, and a sync would file one
  // person's answers under another's with nothing downstream able to undo it.
  // The archive is not touched: the curriculum is the same whoever is holding
  // the phone, and it is the expensive thing to fetch again.
  const previous = await readSetting(db, 'account-id')
  if (previous && previous !== session.user.id) await clearProgress(db)

  await secrets.set(TOKEN_KEY, session.token)
  await writeSetting(db, 'server-address', address)
  await writeSetting(db, 'account-id', session.user.id)
  await writeSetting(db, 'account-email', session.user.email)
  await writeSetting(db, 'account-name', session.user.name)
}

/**
 * The session from the last launch, or null when there is none to carry on
 * with. It asks the server nothing: a phone opened with everything switched off
 * still has to get past this.
 */
export async function restoreSession({
  db,
  secrets,
}: SessionStores): Promise<StoredSession | null> {
  const token = await secrets.get(TOKEN_KEY)
  if (!token) return null

  const address = await readSetting(db, 'server-address')
  const id = await readSetting(db, 'account-id')
  const email = await readSetting(db, 'account-email')
  const name = await readSetting(db, 'account-name')

  // The keystore outlives the app's storage being cleared, so a token with no
  // account beside it is a real state rather than an impossible one.
  if (!address || !id || !email || !name) return null

  return { address, token, user: { id, email, name } }
}

/**
 * Forgets the credential and nothing else. Attempts answered with the server
 * off have not reached it yet, and signing out is not a request to throw them
 * away.
 */
export async function signOut({ db, secrets }: SessionStores): Promise<void> {
  await secrets.remove(TOKEN_KEY)
  await db.run('delete from settings where key = ?', ['account-id'])
}

async function clearProgress(db: Database): Promise<void> {
  await db.transaction(async () => {
    for (const table of PROGRESS_TABLES) await db.run(`delete from ${table}`)
  })
}
