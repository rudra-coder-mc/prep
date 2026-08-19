import { expect, test } from '@playwright/test'

test('the topic list is built from the content directory', async ({ page }) => {
  await page.goto('/topics')
  await expect(page.getByRole('heading', { name: 'JavaScript' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Closures/ })).toBeVisible()
})

test('a lesson renders with its animated visuals', async ({ page }) => {
  await page.goto('/topics')
  await page.getByRole('link', { name: /Closures/ }).click()

  await expect(page.getByRole('heading', { name: 'Closures', level: 1 })).toBeVisible()
  await expect(page.getByText('Why this matters')).toBeVisible()

  const walkthrough = page.locator('figure', { hasText: 'Two counters, two scopes' })
  await expect(walkthrough).toBeVisible()
  await expect(walkthrough.getByText('1/5')).toBeVisible()

  await walkthrough.getByLabel('Next step').click()
  await expect(walkthrough.getByText('2/5')).toBeVisible()
})

test('marking a topic learned enrols its questions into recall', async ({ page }) => {
  await page.goto('/topics/javascript/closures')

  // Another spec may already have marked it, so the click is conditional. The
  // assertions below hold either way.
  const markButton = page.getByRole('button', { name: 'Mark as learned' })
  if (await markButton.isVisible()) await markButton.click()

  await expect(page.getByText(/Marked learned/)).toBeVisible()

  // The state is persisted, not just local to the click.
  await page.reload()
  await expect(page.getByText(/Marked learned/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark as learned' })).toHaveCount(0)

  await page.goto('/review')
  await expect(page.getByText('Nothing due')).toHaveCount(0)
})

test('the event loop lesson renders its queue visual', async ({ page }) => {
  await page.goto('/topics/javascript/event-loop')

  await expect(page.getByRole('heading', { name: 'Event loop and microtasks' })).toBeVisible()

  const loop = page.locator('figure', { hasText: 'One turn of the loop' })
  await expect(loop).toBeVisible()
  await expect(loop.getByText('Microtasks')).toBeVisible()
  await expect(loop.getByText('Macrotasks')).toBeVisible()

  await loop.getByLabel('Next step').click()
  await expect(loop.getByText('2/4')).toBeVisible()
})
