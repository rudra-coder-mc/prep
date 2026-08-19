import { expect, test } from '@playwright/test'
import { answerCurrent, checkButton, optionsList, walkToForm } from './answering'

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

  await expect(page.getByText(/^1 of \d+$/)).toBeVisible()

  await expect(page.getByRole('button', { name: 'Submit and reveal answer' })).toBeDisabled()

  await page.getByLabel('Your answer').fill('A function plus the scope it was defined in.')
  await page.getByRole('radio', { name: /^4 —/ }).check()

  await expect(page.getByRole('button', { name: 'Submit and reveal answer' })).toBeEnabled()
  await page.getByRole('button', { name: 'Submit and reveal answer' }).click()

  await expect(page.getByText('Expected answer')).toBeVisible()
  await expect(page.getByText('Explanation')).toBeVisible()

  await page.getByRole('button', { name: 'Passed' }).click()
  await expect(page.getByText(/^2 of \d+$/)).toBeVisible()
})

test('hints are opt-in and revealed one at a time', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByText(/^Hint 1:/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await expect(page.getByText(/^Hint 1:/)).toBeVisible()
})

test('a multiple choice question grades itself, without a self assessment', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  // Written questions come first in this topic, so walk to the first choice.
  await walkToForm(page, 'choice')

  // Nothing about grading yourself belongs on a question with one right answer.
  await expect(page.getByLabel('Your answer')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Passed' })).toHaveCount(0)

  // The correct option is first in every closures choice question, so this is wrong.
  await optionsList(page).getByRole('button').last().click()

  await expect(page.getByText('Not this time')).toBeVisible()
  await expect(page.getByText('Explanation')).toBeVisible()

  // Answering is final: the options stop responding once a choice is recorded.
  await expect(optionsList(page).getByRole('button').first()).toBeDisabled()

  await page.getByRole('button', { name: 'Next question' }).click()
})

test('the session reports completion after the last question', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  const counter = page.getByText(/^\d+ of \d+$/)
  const total = Number((await counter.textContent())?.split(' of ')[1])
  expect(total).toBeGreaterThan(0)

  for (let i = 0; i < total; i++) await answerCurrent(page, i)

  await expect(page.getByText('Session complete')).toBeVisible()
  await expect(page.getByText(`${total} questions recorded.`)).toBeVisible()
})

test('an output question is checked rather than self graded', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await walkToForm(page, 'output')

  // Nothing here asks how you did, because the answer is exact.
  await expect(page.getByRole('radio', { name: /^3 —/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Passed' })).toHaveCount(0)
  await expect(checkButton(page)).toBeDisabled()

  await page.getByLabel('Your answer').fill('9 9 9')
  await checkButton(page).click()

  await expect(page.getByText('Not this time')).toBeVisible()
  await expect(page.getByText('Expected output')).toBeVisible()
})

test('an output answer matches despite spacing the writer did not intend', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await walkToForm(page, 'output')

  // The first checked output question in this topic prints 1 2 1.
  await page.getByLabel('Your answer').fill('  1   2  1  ')
  await checkButton(page).click()

  await expect(page.getByText('Correct')).toBeVisible()
})
