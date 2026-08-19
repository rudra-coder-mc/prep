import { expect, test } from '@playwright/test'

test('exercises list their prompt and requirements', async ({ page }) => {
  await page.goto('/topics/javascript/closures/exercises')

  await expect(page.getByRole('heading', { name: 'Exercises', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Private counter' })).toBeVisible()
  await expect(page.getByText('The counter starts at 0.')).toBeVisible()
})

test('an exercise can be completed with notes, and the state survives a reload', async ({
  page,
}) => {
  await page.goto('/topics/javascript/closures/exercises')

  const card = page.locator('[data-exercise="counter"]')
  await card.getByLabel('Notes for Private counter').fill('Used a factory returning a closure.')
  await card.getByRole('button', { name: 'Mark complete' }).click()

  await expect(card.getByText('Completed')).toBeVisible()

  await page.reload()
  const reloaded = page.locator('[data-exercise="counter"]')
  await expect(reloaded).toHaveAttribute('data-completed', 'true')
  await expect(reloaded.getByLabel('Notes for Private counter')).toHaveValue(
    'Used a factory returning a closure.',
  )
})

test('a completed exercise can be reopened', async ({ page }) => {
  await page.goto('/topics/javascript/closures/exercises')

  const card = page.locator('[data-exercise="counter"]')
  await card.getByRole('button', { name: 'Reopen' }).click()
  await expect(card.getByRole('button', { name: 'Mark complete' })).toBeVisible()
})

test('the dashboard counts completed exercises', async ({ page }) => {
  await page.goto('/topics/javascript/closures/exercises')
  const card = page.locator('[data-exercise="memoize"]')
  await card.getByRole('button', { name: 'Mark complete' }).click()
  await expect(card.getByText('Completed')).toBeVisible()

  await page.goto('/')
  const practical = page.locator('[data-panel="Practical"]')
  await expect(practical).toContainText('Completed')
  expect(await practical.textContent()).not.toMatch(/Completed0/)
})
