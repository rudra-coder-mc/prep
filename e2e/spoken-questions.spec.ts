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

async function serveAudio(page: Page, asked: string[]) {
  await page.route('**/api/speech/*', async (route) => {
    asked.push(new URL(route.request().url()).pathname.split('/').pop() ?? '')
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: WAV })
  })
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
