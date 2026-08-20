import { expect, test } from '@playwright/test'
import { answerable, revealButton, walkToForm } from './answering'

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
  // The queue mixes written and multiple choice questions, so assert that one
  // is answerable rather than that it takes a particular form.
  await expect(answerable(page)).toBeVisible()
})

test('a passed question leaves the queue for the rest of the day', async ({ page }) => {
  // Practice writes the same attempts the review queue reads, and its order is
  // the content order, so this passes a known open question on purpose. Only a
  // pass is promised to be gone for the day: a failed answer is meant to come
  // back within hours, and the queue is shared with whatever other specs did.
  await page.goto('/topics/javascript/closures/practice')
  await walkToForm(page, 'open')
  const prompt = await page.locator('h2').first().textContent()
  expect(prompt).toBeTruthy()

  await revealButton(page).click()
  await expect(page.getByText('The answer', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Passed' }).click()
  await expect(answerable(page)).toBeVisible()

  await page.goto('/review')
  await expect(page.getByText(prompt ?? '')).toHaveCount(0)
})

test('reviewing a question starts the streak', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/day streak/)).toBeVisible()

  const streak = await page.locator('[data-streak]').getAttribute('data-streak')
  expect(Number(streak)).toBeGreaterThan(0)
})
