import { expect, test, type Page } from '@playwright/test'

/**
 * The picked tier decides which topics are on the path and how many of a topic's
 * questions marking it learned enrols. Both are asserted as shapes rather than
 * as numbers, because the bank grows every week and a spec that pins its size
 * fails on authoring rather than on a defect.
 *
 * The track is left on SWE-1 at the end. Every spec in this suite shares one
 * seeded user, so a pick left behind would follow the specs that run after it.
 */
const TRACK = '[data-track="javascript"]'

async function pick(page: Page, tier: string) {
  await page.goto('/topics')
  const picker = page.getByRole('group', { name: 'Preparing for JavaScript' })
  await picker.getByRole('button', { name: tier }).click()
  await expect(picker.getByRole('button', { name: tier })).toHaveAttribute('aria-pressed', 'true')
}

async function topicsOnPath(page: Page): Promise<number> {
  const label = page
    .locator(TRACK)
    .getByText(/topics? at (SWE-1|SWE-2|Senior|Staff)/)
    .first()
  const text = (await label.textContent()) ?? ''
  return Number(text.match(/^(\d+)/)?.[1])
}

async function questionsEnrolling(page: Page): Promise<number> {
  await page.goto('/topics/javascript/closures')
  const card = page.getByText(/Marking it learned puts its \d+ questions at/)
  const text = (await card.textContent()) ?? ''
  return Number(text.match(/its (\d+) questions/)?.[1])
}

test('a track starts at the bottom of the path', async ({ page }) => {
  await page.goto('/topics')

  const picker = page.getByRole('group', { name: 'Preparing for JavaScript' })
  await expect(picker.getByRole('button', { name: 'SWE-1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator(TRACK).getByText(/topics at SWE-1/)).toBeVisible()
})

test('the topic list follows the picker, and the topics above it stay reachable', async ({
  page,
}) => {
  await page.goto('/topics')
  const atSweOne = await topicsOnPath(page)

  // A topic with no question at the pick is off the path rather than deleted,
  // so it is still listed as one asked above.
  const above = page.locator(TRACK).getByText(/asked above SWE-1/)
  await expect(above).toBeVisible()

  await pick(page, 'SWE-2')
  await expect(page.locator(TRACK).getByText(/topics at SWE-2/)).toBeVisible()
  expect(await topicsOnPath(page)).toBeGreaterThan(atSweOne)

  await pick(page, 'SWE-1')
  expect(await topicsOnPath(page)).toBe(atSweOne)
})

test('the pick decides how much of a topic marking it learned enrols', async ({ page }) => {
  await pick(page, 'SWE-1')
  const atSweOne = await questionsEnrolling(page)

  await pick(page, 'Senior')
  expect(await questionsEnrolling(page)).toBeGreaterThan(atSweOne)

  await pick(page, 'SWE-1')
  expect(await questionsEnrolling(page)).toBe(atSweOne)
})

async function questionsBehindReadiness(page: Page): Promise<number> {
  await page.goto('/')
  const line = page.locator(TRACK).getByText(/questions retained/)
  const text = (await line.textContent()) ?? ''
  return Number(text.match(/of (\d+) questions retained/)?.[1])
}

test('readiness is measured against the tier that was picked', async ({ page }) => {
  await pick(page, 'SWE-1')
  const atSweOne = await questionsBehindReadiness(page)

  await pick(page, 'Senior')
  expect(await questionsBehindReadiness(page)).toBeGreaterThan(atSweOne)
  await expect(page.locator(TRACK).getByText('Preparing for Senior')).toBeVisible()

  await pick(page, 'SWE-1')
  expect(await questionsBehindReadiness(page)).toBe(atSweOne)
})

test('the pick is per track, so one track does not move another', async ({ page }) => {
  await pick(page, 'Staff')

  const browser = page.getByRole('group', { name: 'Preparing for Browser' })
  await expect(browser.getByRole('button', { name: 'SWE-1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await pick(page, 'SWE-1')
})
