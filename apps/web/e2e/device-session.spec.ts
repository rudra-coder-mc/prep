import { expect, test } from '@playwright/test'
import { SIGNED_OUT_STATE } from './constants'

test.use({ storageState: SIGNED_OUT_STATE })

const EMAIL = process.env.SEED_USER_EMAIL ?? 'e2e@prep.test'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'e2e-password'

/** A well-formed key no script hashes to, so the endpoint answers 404 rather than 401. */
const ABSENT_KEY = 'a'.repeat(64)

/**
 * A device against the running server, with no cookie jar anywhere in it. The
 * unit and integration tests cover the gate and the token separately; this is
 * the one place they are put together in the real runtime.
 *
 * See docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
 */
test('a device signs in and reaches a guarded endpoint on the token alone', async ({ request }) => {
  const login = await request.post('/api/device/session', {
    data: { email: EMAIL, password: PASSWORD },
  })
  expect(login.status()).toBe(200)

  const { token, expiresAt } = await login.json()
  expect(Date.parse(expiresAt)).toBeGreaterThan(Date.now())

  const refused = await request.get(`/api/speech/${ABSENT_KEY}`)
  expect(refused.status()).toBe(401)

  // Past the gate and past the endpoint's own check: only the key is wrong.
  const allowed = await request.get(`/api/speech/${ABSENT_KEY}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  expect(allowed.status()).toBe(404)
})

test('a device holding a token nothing issued is refused', async ({ request }) => {
  const response = await request.get('/api/device/session', {
    headers: { authorization: 'Bearer not-a-token' },
  })

  expect(response.status()).toBe(401)
})
