import { expect, test } from '@playwright/test'
import { answerCurrent } from './answering'

test('the dashboard summarises topics, questions and exercises', async ({ page }) => {
  await page.goto('/')

  // The dashboard is deliberately not headed by a technology; tracks are data.
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'JavaScript', level: 1 })).toHaveCount(0)

  for (const panel of ['Readiness', 'Topics', 'Questions', 'Practical']) {
    await expect(page.getByRole('heading', { name: panel })).toBeVisible()
  }

  await expect(page.getByRole('link', { name: /JavaScript/ })).toBeVisible()

  const topics = page.locator('[data-panel="Topics"]')
  for (const status of ['Mastered', 'Understood', 'Learning', 'Weak', 'Not started']) {
    await expect(topics.getByText(status, { exact: true })).toBeVisible()
  }
})

test('the dashboard says how ready you are for the tier you picked', async ({ page }) => {
  await page.goto('/')
  const track = page.locator('[data-track="javascript"]')

  await expect(track.getByText('Preparing for SWE-1')).toBeVisible()
  // The share and the count it is based on, because a percentage of a tier this
  // thin says nothing on its own.
  await expect(track.getByText(/\d+% ready · \d+ of \d+ questions retained/)).toBeVisible()

  // A tier this unfinished offers nothing, and the offer is never taken by the
  // platform anyway.
  await expect(track.getByRole('button', { name: /Step up/ })).toHaveCount(0)
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

/**
 * The sync reminder, which is the only thing the device_sync table is for.
 *
 * Only the fresh half is reachable from here: a device's row is dated by the
 * server at the moment it syncs, so nothing a spec can do over HTTP makes one
 * look old. What the reminder says once a device has gone quiet is pinned in
 * apps/web/src/components/device-sync-list.test.tsx, and the rule deciding when
 * that is in apps/web/src/lib/device-status.test.ts.
 */
test('the dashboard says when a device last synced, and lets a fresh one be', async ({
  page,
  request,
}) => {
  const synced = await request.post('/api/device/sync', {
    data: {
      device: { id: 'e2e-dashboard-phone', name: 'Dashboard phone' },
      since: null,
      attempts: [],
      topicProgress: [],
      trackTiers: [],
    },
  })
  expect(synced.status()).toBe(200)

  await page.goto('/')

  const device = page.locator('[data-device="e2e-dashboard-phone"]')
  await expect(device).toHaveAttribute('data-stale', 'false')
  await expect(device.getByText('Dashboard phone')).toBeVisible()
  await expect(device.getByText('Last synced today')).toBeVisible()
  await expect(device.getByText(/Open the app on it/)).toHaveCount(0)
})
