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

test('the lesson shows which part of it is being read', async ({ page }) => {
  await page.goto('/topics/javascript/closures')

  const article = page.locator('article')
  await expect(article).not.toHaveAttribute('data-narrated-lesson', 'true')

  await page.getByRole('group', { name: READER }).getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  // The first section of the closures narration is about "Why this matters".
  await expect(article).toHaveAttribute('data-narrated-lesson', 'true')
  await expect(page.locator('h2#why-this-matters')).toHaveAttribute('data-narrated', 'true')
  await expect(page.locator('h2#the-idea')).not.toHaveAttribute('data-narrated', 'true')

  // And the reader was taken to it rather than left at the top of the page.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

test('the controls follow the reader once the player has scrolled away', async ({ page }) => {
  await page.goto('/topics/javascript/closures')

  const following = page.getByRole('group', { name: 'Narration controls' })
  await expect(following).toBeHidden()

  await page.getByRole('group', { name: READER }).getByLabel('Play narration').click()
  await waitUntilPlaying(page)
  await page.mouse.wheel(0, 1200)

  await expect(following).toBeVisible()
  await expect(following.getByText('1 of 6')).toBeVisible()

  await following.getByLabel('Pause narration').click()
  expect((await audioState(page))?.paused).toBe(true)
})

test('a section that has been built is played rather than synthesised again', async ({ page }) => {
  const asked: string[] = []
  await page.route(/\/api\/speech/, async (route) => {
    asked.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`)
    await route.continue()
  })

  // Whether this first play has to synthesise depends on what the rest of the
  // suite has already said out loud, and that is the point: from here on it must
  // not matter.
  await page.goto('/topics/javascript/closures')
  await page.getByRole('group', { name: READER }).getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  asked.length = 0
  await page.reload()
  await page.getByRole('group', { name: READER }).getByLabel('Play narration').click()
  await waitUntilPlaying(page)

  // A recording that exists is a file to fetch, not work to do again.
  expect(asked[0]).toMatch(/^GET \/api\/speech\/[0-9a-f]{64}$/)
  expect(asked).not.toContain('POST /api/speech')
})
