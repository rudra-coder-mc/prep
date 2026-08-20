import { expect, test, type Page } from '@playwright/test'

/**
 * The narration player against the real engine. Audio is the one part of this
 * application that cannot be checked by looking at the DOM: the element can be
 * present, labelled and wired up while nothing ever comes out of it. So these
 * assert on the media element's own state - that it is not paused, and that its
 * position is moving - rather than on the buttons.
 *
 * Each section is synthesised the first time it is asked for, which takes a few
 * seconds, so this spec plays two sections and no more.
 */
const READER = 'Listen to Closures'

/**
 * A section nobody has played before is synthesised on demand, at roughly three
 * and a half times real time, and the suite empties its speech cache at the
 * start of every run. So the first play of any given section is tens of seconds
 * of real work, which the default per-test budget does not cover.
 *
 * That wait is the design, not a slow test. In use, the next section is fetched
 * while the current one plays, so only a listener who skips ahead immediately
 * ever waits for it.
 */
test.describe.configure({ timeout: 120_000 })

const audioState = (page: Page) =>
  page.evaluate(() => {
    const audio = document.querySelector('audio')
    return audio
      ? { paused: audio.paused, currentTime: audio.currentTime, rate: audio.playbackRate }
      : null
  })

async function waitUntilPlaying(page: Page) {
  await page.waitForFunction(
    () => {
      const audio = document.querySelector('audio')
      return Boolean(audio && !audio.paused && audio.currentTime > 0.4)
    },
    undefined,
    { timeout: 60_000 },
  )
}

test('a topic can be listened to', async ({ page }) => {
  await page.goto('/topics/javascript/closures')

  const reader = page.getByRole('group', { name: READER })
  await expect(reader).toBeVisible()
  await expect(reader.getByText('1 of 6')).toBeVisible()

  await reader.getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  expect((await audioState(page))?.paused).toBe(false)
})

test('pausing stops the audio, and playing again resumes it', async ({ page }) => {
  await page.goto('/topics/javascript/closures')
  const reader = page.getByRole('group', { name: READER })

  await reader.getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  await reader.getByLabel('Pause narration').click()
  const paused = await audioState(page)
  expect(paused?.paused).toBe(true)

  await reader.getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  // Resumed rather than restarted: the position is at least where it stopped.
  expect((await audioState(page))?.currentTime).toBeGreaterThanOrEqual(paused?.currentTime ?? 0)
})

test('the next section plays, and the chosen speed follows to the next topic', async ({ page }) => {
  await page.goto('/topics/javascript/closures')
  const reader = page.getByRole('group', { name: READER })

  await reader.getByLabel('Narration speed, currently 1 times').click()
  await reader.getByLabel('Next section').click()

  await expect(reader.getByText('2 of 6')).toBeVisible()
  await waitUntilPlaying(page)
  expect((await audioState(page))?.rate).toBe(1.25)

  await page.goto('/topics/javascript/prototypes')
  await expect(
    page
      .getByRole('group', { name: 'Listen to Prototypes and the prototype chain' })
      .getByLabel('Narration speed, currently 1.25 times'),
  ).toBeVisible()
})
