import { expect, test as setup } from '@playwright/test'
import { STORAGE_STATE } from './constants'

const EMAIL = process.env.SEED_USER_EMAIL ?? 'e2e@prep.test'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'e2e-password'

/**
 * Signs in once for the whole run. Repeating it per test trips better-auth's
 * protection against repeated attempts, and it is wasted time either way.
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText(`Signed in as ${EMAIL}`)).toBeVisible()
  await page.context().storageState({ path: STORAGE_STATE })
})
