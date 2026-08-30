import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { readSetting } from '../db/settings'
import { createTestDatabase } from '../../test-support/database'
import { createMemorySecretStore } from '../../test-support/secrets'
import { restoreSession, signIn, signOut } from './session'

/**
 * Holding the credential, and the one guard around it.
 *
 * Signing in is a network call, so it is the server client's problem and is
 * tested there. What is tested here is what is kept and what is thrown away,
 * because getting that wrong loses a week of answers made with the server off.
 */
let db: ReturnType<typeof createTestDatabase>
let secrets: ReturnType<typeof createMemorySecretStore>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  secrets = createMemorySecretStore()
})

afterEach(() => db?.close())

const ATUL = { id: 'u1', email: 'atul@prep.test', name: 'Atul' }

function session(user = ATUL) {
  return { token: 'a-token', expiresAt: new Date('2026-09-29T10:00:00.000Z'), user }
}

async function attempt(id: string) {
  await db.run(
    `insert into attempts (id, question_id, topic_slug, answer, result, confidence, hints_used, attempted_at)
     values (?, 'javascript/closures#q1', 'javascript/closures', '', 'passed', 3, 0, '2026-08-01T00:00:00.000Z')`,
    [id],
  )
}

const attemptIds = async () =>
  (await db.all<{ id: string }>('select id from attempts')).map((row) => row.id)

describe('signing in', () => {
  it('keeps the token in the keystore and the address in the settings', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })

    expect(await secrets.get('session-token')).toBe('a-token')
    expect(await readSetting(db, 'server-address')).toBe('https://work')
  })

  it('comes back on the next launch without another password', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })

    expect(await restoreSession({ db, secrets })).toEqual({
      address: 'https://work',
      token: 'a-token',
      user: ATUL,
    })
  })

  it('keeps the answers made offline when the same account signs in again', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })
    await attempt('a1')

    await signIn({ db, secrets }, { address: 'https://work', session: session() })

    expect(await attemptIds()).toEqual(['a1'])
  })

  /**
   * There is one account, so this should never happen. If it does, the attempts
   * on this device belong to somebody else and syncing them would file one
   * person's answers under another's, which nothing downstream could undo.
   */
  it('throws away the progress when a different account signs in', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })
    await attempt('a1')

    await signIn(
      { db, secrets },
      {
        address: 'https://work',
        session: session({ ...ATUL, id: 'u2', email: 'someone@prep.test' }),
      },
    )

    expect(await attemptIds()).toEqual([])
  })

  // The curriculum is the same whoever is holding the phone, and it is the
  // expensive thing to fetch again.
  it('keeps the archive when a different account signs in', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })
    await db.run("insert into settings (key, value) values ('archive-version', 'v1')")

    await signIn(
      { db, secrets },
      { address: 'https://work', session: session({ ...ATUL, id: 'u2' }) },
    )

    expect(await readSetting(db, 'archive-version')).toBe('v1')
  })
})

describe('before anything has been signed in to', () => {
  it('has no session to restore', async () => {
    expect(await restoreSession({ db, secrets })).toBeNull()
  })

  // Clearing the app's storage leaves the keystore behind on Android, so a
  // token with no address is a state that actually happens.
  it('has no session when the token survived but the address did not', async () => {
    await secrets.set('session-token', 'a-token')

    expect(await restoreSession({ db, secrets })).toBeNull()
  })
})

describe('signing out', () => {
  /**
   * The token and nothing else. Attempts answered with the server off have not
   * reached it yet, and signing out is not a request to discard them.
   */
  it('forgets the token and keeps everything else', async () => {
    await signIn({ db, secrets }, { address: 'https://work', session: session() })
    await attempt('a1')

    await signOut({ db, secrets })

    expect(await secrets.get('session-token')).toBeNull()
    expect(await restoreSession({ db, secrets })).toBeNull()
    expect(await attemptIds()).toEqual(['a1'])
    expect(await readSetting(db, 'server-address')).toBe('https://work')
  })
})
