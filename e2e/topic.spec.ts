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

  // The page streams in behind a loading state, so wait for the card that owns
  // the button. Another spec may already have marked the topic, so the click is
  // conditional; the assertions below hold either way.
  await expect(page.getByRole('heading', { name: 'Ready to be tested on this?' })).toBeVisible()

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

test.describe('with motion allowed', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('a visual starts playing itself once it is on screen', async ({ page }) => {
    await page.goto('/topics/javascript/closures')

    const walkthrough = page.locator('figure', { hasText: 'Two counters, two scopes' })
    await walkthrough.scrollIntoViewIfNeeded()

    // Nothing is clicked here: the visual is expected to run on its own, which
    // is the difference between an animation and a diagram with buttons.
    await expect(walkthrough.getByText('1/5')).toHaveCount(0, { timeout: 10_000 })
  })
})

test('the event loop lesson renders its queue visual', async ({ page }) => {
  await page.goto('/topics/javascript/event-loop')

  await expect(page.getByRole('heading', { name: 'Event loop and microtasks' })).toBeVisible()

  const loop = page.locator('figure', { hasText: 'One turn of the loop' })
  await expect(loop).toBeVisible()
  // By role, because the phase rail above the lanes also says "microtasks".
  await expect(loop.getByRole('heading', { name: 'Microtasks' })).toBeVisible()
  await expect(loop.getByRole('heading', { name: 'Macrotasks' })).toBeVisible()
  await expect(loop.getByText('Drain microtasks')).toBeVisible()

  await loop.getByLabel('Next step').click()
  await expect(loop.getByText('2/5')).toBeVisible()
})
