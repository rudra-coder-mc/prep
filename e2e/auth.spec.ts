import { expect, test } from '@playwright/test'

const EMAIL = process.env.SEED_USER_EMAIL ?? 'e2e@prep.test'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'e2e-password'

test('an unauthenticated visitor is sent to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('signing in reaches a protected page, and signing out reverses it', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText(`Signed in as ${EMAIL}`)).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
})

test('bad credentials are rejected without signing in', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Password').fill('definitely-not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Those credentials were not accepted.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})
