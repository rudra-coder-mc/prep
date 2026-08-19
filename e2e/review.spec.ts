import { expect, test } from '@playwright/test'

test('an empty queue says so rather than showing a broken session', async ({ page }) => {
  await page.goto('/review')
  // Nothing has been marked learned in this spec's own state, but earlier specs
  // may have. Either outcome must be a coherent page, never an error.
  await expect(
    page.getByRole('heading', { name: /Today.s review/ }).or(page.getByText('Nothing due')),
  ).toBeVisible()
})

test('marking a topic learned puts its questions into the review queue', async ({ page }) => {
  await page.goto('/topics/javascript/closures')

  // The page streams in behind a loading state, so wait for the card that owns
  // the button before asking whether the button is there.
  await expect(page.getByRole('heading', { name: 'Ready to be tested on this?' })).toBeVisible()

  const markButton = page.getByRole('button', { name: 'Mark as learned' })
  if (await markButton.isVisible()) await markButton.click()
  await expect(page.getByText(/Marked learned/)).toBeVisible()

  await page.goto('/review')
  await expect(page.getByText('Nothing due')).toHaveCount(0)
  await expect(page.getByText(/to go\.|showing the first/)).toBeVisible()
  await expect(page.getByLabel('Your answer')).toBeVisible()
})

test('a reviewed question leaves the queue for the rest of the day', async ({ page }) => {
  await page.goto('/review')

  const first = await page.locator('h2').first().textContent()

  await page.getByLabel('Your answer').fill('answer')
  await page.getByRole('radio', { name: /^5 —/ }).check()
  await page.getByRole('button', { name: 'Submit and reveal answer' }).click()
  await page.getByRole('button', { name: 'Passed' }).click()
  // Wait for the attempt to be recorded before reloading the queue.
  await expect(page.getByRole('button', { name: 'Submit and reveal answer' })).toBeVisible()

  await page.goto('/review')
  const nowFirst = await page.locator('h2').first().textContent()
  expect(nowFirst).not.toBe(first)
})

test('reviewing a question starts the streak', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/day streak/)).toBeVisible()

  const streak = await page.locator('[data-streak]').getAttribute('data-streak')
  expect(Number(streak)).toBeGreaterThan(0)
})
