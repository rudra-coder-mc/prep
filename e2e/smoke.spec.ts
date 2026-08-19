import { expect, test } from '@playwright/test'

test('the app serves its landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'prep' })).toBeVisible()
})
