import { expect, test } from '@playwright/test'
import { unzipSync } from 'fflate'
import { SIGNED_OUT_STATE } from './constants'

test.use({ storageState: SIGNED_OUT_STATE })

const EMAIL = process.env.SEED_USER_EMAIL ?? 'e2e@prep.test'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'e2e-password'

/** Well formed, and no script hashes to it, so it stands for a recording nobody has made. */
const ABSENT_KEY = 'a'.repeat(64)

/**
 * A device with nothing: it signs in, asks what the current content is, pulls
 * the archive, and asks for audio.
 *
 * There is no cookie jar anywhere in this file. Everything is a bearer token,
 * which is the only credential a phone has. See
 * docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
 *
 * That the audio endpoint never synthesises is a property of the module rather
 * than of a run, since it does not import the engine at all, and its unit test
 * is where that is pinned. What this file adds is the timing, which is the part
 * that would actually hurt: synthesis is half a minute and a phone asks for
 * hundreds of keys at once.
 */
test('a device reads the version, pulls the archive and asks for audio', async ({ request }) => {
  const login = await request.post('/api/device/session', {
    data: { email: EMAIL, password: PASSWORD },
  })
  expect(login.status()).toBe(200)
  const { token } = await login.json()
  const headers = { authorization: `Bearer ${token}` }

  const versionResponse = await request.get('/api/device/archive/version', { headers })
  expect(versionResponse.status()).toBe(200)
  const version = await versionResponse.json()
  expect(version.version).toEqual(expect.any(String))
  expect(version.topics).toBeGreaterThan(0)
  expect(version.questions).toBeGreaterThan(0)
  // What the device is about to spend, so it can say so before it spends it.
  expect(version.bytes).toBeGreaterThan(0)

  const download = await request.get('/api/device/archive', { headers })
  expect(download.status()).toBe(200)
  expect(download.headers()['content-type']).toBe('application/zip')
  // The URL is the same at every version, so this is the only way a device can
  // tell that what arrived is what it decided to fetch.
  expect(download.headers()['x-content-version']).toBe(version.version)

  const body = await download.body()
  expect(body.byteLength).toBe(version.bytes)

  const unpacked = unzipSync(new Uint8Array(body))
  const content = JSON.parse(new TextDecoder().decode(unpacked['content.json']!))
  expect(content.version).toBe(version.version)
  expect(content.topics).toHaveLength(version.topics)

  // A lesson page the content points at has to be in the same download, or the
  // device holds questions it can read and lessons it cannot.
  const topic = content.topics[0]
  expect(Object.keys(unpacked)).toContain(topic.lesson)

  // A recording that exists: made through the engine's own door, so this does
  // not depend on which specs have run before it.
  const spoken = await request.post('/api/speech', {
    headers,
    data: { text: 'A device asks for this recording once it has been made.' },
  })
  expect(spoken.status()).toBe(200)
  const key = spoken.headers()['x-speech-key']!

  const audio = await request.get(`/api/device/audio/${key}`, { headers })
  expect(audio.status()).toBe(200)
  expect(audio.headers()['content-type']).toBe('audio/ogg')
  expect((await audio.body()).subarray(0, 4).toString()).toBe('OggS')

  // A recording that does not: a clear answer rather than a wait or a guess.
  const missing = await request.get(`/api/device/audio/${ABSENT_KEY}`, { headers })
  expect(missing.status()).toBe(404)
  expect((await missing.json()).error).toMatch(/has not been recorded/i)
})

/**
 * The keys in the archive are the whole track, and most of them have no
 * recording on a fresh machine. Answering one by synthesising it is half a
 * minute of the server's entire attention, so the answer has to come back at the
 * speed of a missing file. The bound is wide because what it rules out is not.
 */
test('a key from the archive is answered at once, recorded or not', async ({ request }) => {
  const login = await request.post('/api/device/session', {
    data: { email: EMAIL, password: PASSWORD },
  })
  const { token } = await login.json()
  const headers = { authorization: `Bearer ${token}` }

  const download = await request.get('/api/device/archive', { headers })
  const unpacked = unzipSync(new Uint8Array(await download.body()))
  const content = JSON.parse(new TextDecoder().decode(unpacked['content.json']!))

  const key = content.topics
    .flatMap((topic: { questions: { promptAudioKey: string }[] }) => topic.questions)
    .map((question: { promptAudioKey: string }) => question.promptAudioKey)[0]
  expect(key).toMatch(/^[0-9a-f]{64}$/)

  const started = Date.now()
  const response = await request.get(`/api/device/audio/${key}`, { headers })
  const elapsed = Date.now() - started

  expect([200, 404]).toContain(response.status())
  expect(elapsed).toBeLessThan(10_000)
})

test('none of it is reachable without a token', async ({ request }) => {
  expect((await request.get('/api/device/archive/version')).status()).toBe(401)
  expect((await request.get('/api/device/archive')).status()).toBe(401)
  expect((await request.get(`/api/device/audio/${ABSENT_KEY}`)).status()).toBe(401)
})
