import { expect, test } from '@playwright/test'
import { answerCurrent } from './answering'

test('the dashboard summarises topics, questions and exercises', async ({ page }) => {
  await page.goto('/')

  // The dashboard is deliberately not headed by a technology; tracks are data.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'JavaScript', level: 1 })).toHaveCount(0)

  for (const panel of ['Tracks', 'Topics', 'Questions', 'Practical']) {
    await expect(page.getByRole('heading', { name: panel })).toBeVisible()
  }

  await expect(page.getByRole('link', { name: /JavaScript/ })).toBeVisible()

  const topics = page.locator('[data-panel="Topics"]')
  for (const status of ['Mastered', 'Understood', 'Learning', 'Weak', 'Not started']) {
    await expect(topics.getByText(status, { exact: true })).toBeVisible()
  }
})

test('the actions lead to review and to the topic list', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Browse topics' }).click()
  await expect(page).toHaveURL(/\/topics$/)

  await page.goto('/')
  await page.getByRole('link', { name: 'Start review' }).click()
  await expect(page).toHaveURL(/\/review$/)
})

test('question counts reflect attempts that were actually recorded', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')
  await answerCurrent(page)
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible()

  await page.goto('/')
  const questions = page.locator('[data-panel="Questions"]')
  const attempted = await questions.textContent()
  expect(attempted).toMatch(/Attempted\d+/)
  expect(attempted).not.toMatch(/Attempted0/)
})
