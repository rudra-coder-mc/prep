import { expect, test, type Page } from '@playwright/test'
import { revealButton, walkToForm } from './answering'

/**
 * A question and its answer can be listened to rather than read.
 *
 * This suite runs against a cache the runner empties on purpose, so every
 * recording here would have to be made from scratch. The audio is therefore
 * stubbed in all but the last spec: what is under test is the page asking for
 * the right recording at the right moment, not the engine, which the speech
 * specs cover. The last spec lets the real endpoint answer, because a question
 * nobody has recorded being made on the spot is the whole point of the change.
 */

/**
 * A tenth of a second of silence, built rather than pasted, because the browser
 * really does decode this. A truncated header looks fine in a fixture and makes
 * play() reject, which reads as the button being broken.
 */
function silentWav(): Buffer {
  const rate = 8000
  const samples = rate / 10
  const data = Buffer.alloc(samples * 2)
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)

  return Buffer.concat([header, data])
}

const WAV = silentWav()

/**
 * Stands in for the engine, and records which recordings the page asked to play.
 *
 * Warming is answered and not counted. It goes to the same path and carries no
 * audio, and what these specs are about is the recordings a reader asked to
 * hear: counting the ones the page made ready ahead of them would say nothing.
 */
async function serveAudio(page: Page, asked: string[]) {
  await page.route('**/api/speech/*', async (route) => {
    asked.push(new URL(route.request().url()).pathname.split('/').pop() ?? '')
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: WAV })
  })

  // Added second on purpose: Playwright consults the handler added last first,
  // so this is what takes the warm out of the one above.
  await page.route('**/api/speech/warm', (route) => route.fulfill({ status: 204 }))
}

test('a question can be listened to before it is answered', async ({ page }) => {
  const asked: string[] = []
  await serveAudio(page, asked)

  await page.goto('/topics/javascript/closures/practice')
  await page.getByRole('button', { name: 'Listen to the question' }).click()

  // The button becoming a stop is the page saying the audio is playing.
  await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()
  expect(asked).toHaveLength(1)
})

test('the answer gets its own listen button, and only once it has been given', async ({ page }) => {
  const asked: string[] = []
  await serveAudio(page, asked)

  await page.goto('/topics/javascript/closures/practice')
  await walkToForm(page, 'open')

  const listenToAnswer = page.getByRole('button', { name: 'Listen to the answer' })
  await expect(listenToAnswer).toHaveCount(0)

  await revealButton(page).click()

  await expect(page.getByText('The answer', { exact: true })).toBeVisible()
  await expect(listenToAnswer).toBeVisible()

  await listenToAnswer.click()
  await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()
})

test('a multiple choice question offers its options by ear', async ({ page }) => {
  const asked: string[] = []
  await serveAudio(page, asked)

  await page.goto('/topics/javascript/closures/practice')
  await walkToForm(page, 'choice')

  await page.getByRole('button', { name: 'Listen to the question' }).click()
  await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()

  // One recording holds the prompt and every option, so answering by ear is one
  // request rather than one per option.
  expect(asked).toHaveLength(1)
})

test('a question nobody has recorded is made when it is asked for', async ({ page }) => {
  // No route, so the real endpoint answers, and the cache this runs against is
  // empty by design. The browser sends a key and the server turns it back into
  // the words, so nothing about the question has to travel to be spoken.
  test.setTimeout(90_000)

  await page.goto('/topics/javascript/closures/practice')
  await page.getByRole('button', { name: 'Listen to the question' }).click()

  // Piper runs at about 22 milliseconds per character, so a prompt is several
  // seconds of work and the button says so while it waits.
  await expect(page.getByRole('status')).toContainText('first time')
  await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible({
    timeout: 60_000,
  })
})

test('a question answer is recorded while the question is being answered', async ({ page }) => {
  // No route again, so the recording is really made. Every warm on the way to an
  // open question is real work, and the cache starts empty.
  test.setTimeout(300_000)

  const WARM = '/api/speech/warm'
  let pending = 0

  page.on('request', (request) => {
    if (request.url().endsWith(WARM)) pending += 1
  })
  const settle = (request: { url: () => string }) => {
    if (request.url().endsWith(WARM)) pending -= 1
  }
  page.on('requestfinished', settle)
  page.on('requestfailed', settle)

  await page.goto('/topics/javascript/closures/practice')
  await walkToForm(page, 'open')

  // Reading a question and answering it is the wait, so this stands in for a
  // reader taking their time over it.
  await expect.poll(() => pending, { timeout: 240_000 }).toBe(0)

  await revealButton(page).click()
  await page.getByRole('button', { name: 'Listen to the answer' }).click()

  // An answer is about forty seconds of synthesis, so playing this quickly is
  // only possible because it was recorded while the question was on screen.
  await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByRole('status')).toHaveCount(0)
})
