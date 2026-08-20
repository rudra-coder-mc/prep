import { expect, test } from '@playwright/test'
import { orderingList, walkToForm } from './answering'

const PRACTICE = '/topics/javascript/event-loop/practice'

/**
 * The pool is shown in an authored order, not the printing order, so the first
 * question in the event loop topic reads 3, 1, caught, 2, 4 and prints 1, 4, 3,
 * 2. Tapping in the order below is the right answer.
 */
const CORRECT = [1, 4, 0, 3]

test('the printing order is not in the page before the sequence is submitted', async ({ page }) => {
  await page.goto(PRACTICE)
  await walkToForm(page, 'ordering')

  const html = await page.content()
  expect(html).not.toContain('Nothing prints "caught"')
  await expect(page.getByText('It prints', { exact: true })).toHaveCount(0)
})

test('a line can be taken back out of the sequence', async ({ page }) => {
  await page.goto(PRACTICE)
  await walkToForm(page, 'ordering')

  const lines = orderingList(page).getByRole('button')

  await lines.nth(0).click()
  await expect(lines.nth(0)).toHaveAttribute('aria-pressed', 'true')

  await lines.nth(0).click()
  await expect(lines.nth(0)).toHaveAttribute('aria-pressed', 'false')
})

test('the right sequence passes and shows the answer in full', async ({ page }) => {
  await page.goto(PRACTICE)
  await walkToForm(page, 'ordering')

  const lines = orderingList(page).getByRole('button')
  for (const index of CORRECT) await lines.nth(index).click()

  await page.getByRole('button', { name: 'Check the order' }).click()

  await expect(page.getByText('Correct')).toBeVisible()
  await expect(page.getByText('Nothing prints "caught"')).toBeVisible()

  // A graded sequence is final, the same as a graded choice.
  await expect(lines.first()).toBeDisabled()
})

test('a wrong sequence shows what was built beside what prints', async ({ page }) => {
  await page.goto(PRACTICE)
  await walkToForm(page, 'ordering')

  const lines = orderingList(page).getByRole('button')

  // Includes the distractor, which is wrong however well the rest is ordered.
  for (const index of [1, 4, 2, 0, 3]) await lines.nth(index).click()

  await page.getByRole('button', { name: 'Check the order' }).click()

  await expect(page.getByText('Not this time')).toBeVisible()
  await expect(page.getByText('You said', { exact: true })).toBeVisible()
  await expect(page.getByText('It prints', { exact: true })).toBeVisible()
})

test('the pool is offered by ear, in the order it is shown', async ({ page }) => {
  await page.goto(PRACTICE)
  await walkToForm(page, 'ordering')

  await expect(page.getByRole('button', { name: 'Listen to the question' })).toBeVisible()
})
