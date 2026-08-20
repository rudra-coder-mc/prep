import { expect, test } from '@playwright/test'
import { SIGNED_OUT_STATE } from './constants'
import { speak } from './speaking'

/**
 * The narration engine has unit tests for its parts and an integration test
 * against the real Piper container, but neither of those runs inside the
 * application. This spec is the layer that does: a page in a browser, holding
 * the session it signed in with, asking the running server for audio.
 *
 * There is no player yet - that is the next task - so this is the highest level
 * the feature can be driven at. When the player lands it belongs on top of this
 * rather than instead of it, because everything here is about the endpoint's
 * contract, which the player depends on and cannot itself prove.
 *
 * Every test brings its own script. The suite shares one speech cache for the
 * whole run, the same way it shares one database, so a test that reused another
 * test's words would pass or fail on what ran before it. Synthesis costs about a
 * second of work for three and a half seconds of speech, which is why each of
 * those scripts is one short sentence.
 */
test('a signed-in page can fetch audio it could play', async ({ page }) => {
  await page.goto('/')

  const spoken = await speak(page, 'This is what a lesson sounds like when it is read aloud.')

  expect(spoken.status).toBe(200)
  expect(spoken.contentType).toBe('audio/wav')
  expect(spoken.header).toMatch(/^RIFF.{4}WAVE$/)
  // Roughly 44 KB per second of speech. The floor only has to rule out a header
  // with no recording behind it.
  expect(spoken.byteLength).toBeGreaterThan(44_100)
})

test('the second request for a script is served from the cache', async ({ page }) => {
  await page.goto('/')
  const script = 'The second time these words are asked for, nothing is synthesised.'

  const first = await speak(page, script)
  const second = await speak(page, script)

  expect(first.cache).toBe('miss')
  expect(second.cache).toBe('hit')
  expect(second.key).toBe(first.key)
  expect(second.byteLength).toBe(first.byteLength)
})

test('a script laid out differently is the same recording', async ({ page }) => {
  await page.goto('/')
  const script = 'Line breaks are how a script is written, not how it is spoken.'

  const written = await speak(page, script)
  const reflowed = await speak(page, `\n  ${script.replace(/ /g, '\n  ')}\n`)

  expect(reflowed.key).toBe(written.key)
  expect(reflowed.cache).toBe('hit')
})

test('a different script is a different recording', async ({ page }) => {
  await page.goto('/')

  const one = await speak(page, 'A closure remembers the place it came from.')
  const other = await speak(page, 'A closure forgets the place it came from.')

  expect(one.key).not.toBe(other.key)
  expect(other.cache).toBe('miss')
})

test('an unspeakable script is refused rather than left to hang', async ({ page }) => {
  await page.goto('/')

  expect((await speak(page, '   \n   ')).status).toBe(400)
  expect((await speak(page, 'a'.repeat(3001))).status).toBe(400)
})

test.describe('signed out', () => {
  test.use({ storageState: SIGNED_OUT_STATE })

  test('a request for audio is refused with a status, not a login page', async ({ page }) => {
    await page.goto('/login')

    const spoken = await speak(page, 'Nobody is signed in to hear this.')

    expect(spoken.status).toBe(401)
    expect(spoken.contentType).toContain('application/json')
    // The failure this guards against is not a wrong status. It is the login
    // page arriving with a 200 and being handed to an audio element.
    expect(spoken.header).not.toMatch(/^RIFF/)
  })
})
