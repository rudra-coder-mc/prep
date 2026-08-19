import { expect, test } from '@playwright/test'

test('the expected answer is not in the page before submitting', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible()

  // The first question's expected answer must be nowhere in the document.
  const html = await page.content()
  expect(html).not.toContain('A closure is a function together with the lexical environment')
  await expect(page.getByText('Expected answer')).toHaveCount(0)
})

test('a full question records an attempt and moves to the next one', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByText('1 of 8')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Submit and reveal answer' })).toBeDisabled()

  await page.getByLabel('Your answer').fill('A function plus the scope it was defined in.')
  await page.getByRole('radio', { name: /^4 —/ }).check()

  await expect(page.getByRole('button', { name: 'Submit and reveal answer' })).toBeEnabled()
  await page.getByRole('button', { name: 'Submit and reveal answer' }).click()

  await expect(page.getByText('Expected answer')).toBeVisible()
  await expect(page.getByText('Explanation')).toBeVisible()

  await page.getByRole('button', { name: 'Passed' }).click()
  await expect(page.getByText('2 of 8')).toBeVisible()
})

test('hints are opt-in and revealed one at a time', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByText(/^Hint 1:/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await expect(page.getByText(/^Hint 1:/)).toBeVisible()
})

test('the session reports completion after the last question', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  for (let i = 0; i < 8; i++) {
    await page.getByLabel('Your answer').fill(`answer ${i}`)
    await page.getByRole('radio', { name: /^3 —/ }).check()
    await page.getByRole('button', { name: 'Submit and reveal answer' }).click()
    await expect(page.getByText('Expected answer')).toBeVisible()
    await page.getByRole('button', { name: 'Weak' }).click()
  }

  await expect(page.getByText('Session complete')).toBeVisible()
  await expect(page.getByText('8 questions recorded.')).toBeVisible()
})
