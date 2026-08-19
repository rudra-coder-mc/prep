import { expect, test } from '@playwright/test'

test('signing in lands on interview prep, not on the placeholder', async ({ page }) => {
  await page.goto('/')

  const modes = page.getByRole('group', { name: 'Mode' })
  await expect(modes.getByRole('link', { name: 'Interview' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
})

test('learning is reachable and says it is unbuilt rather than 404ing', async ({ page }) => {
  await page.goto('/')
  const modes = page.getByRole('group', { name: 'Mode' })

  await modes.getByRole('link', { name: 'Learning' }).click()
  await expect(page).toHaveURL(/\/learn$/)
  await expect(page.getByRole('heading', { name: 'Learning', level: 1 })).toBeVisible()
  await expect(page.getByText('Coming soon')).toBeVisible()

  // The interview navigation belongs to a mode this page is not in.
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()

  // The switch is derived from the URL, so a reload cannot desynchronise it.
  await page.reload()
  await expect(modes.getByRole('link', { name: 'Learning' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await modes.getByRole('link', { name: 'Interview' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
})
