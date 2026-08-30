import { expect, test } from '@playwright/test'
import { answerCurrent, movedOn, optionsList, revealButton, walkToForm } from './answering'

test('the answer is not in the page before it is given', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible()

  // The first question's answer must be nowhere in the document.
  const html = await page.content()
  expect(html).not.toContain('A closure is a function together with the lexical environment')
  await expect(page.getByText('The answer', { exact: true })).toHaveCount(0)
})

test('an open question is revealed and marked, with nothing to type', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByText(/^1 of \d+$/)).toBeVisible()
  await walkToForm(page, 'open')

  // Typing an answer nobody grades is the thing this form removed.
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('radio')).toHaveCount(0)

  await revealButton(page).click()

  await expect(page.getByText('The answer', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Passed' }).click()

  await expect(movedOn(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Passed' })).toHaveCount(0)
})

test('hints are opt-in and revealed one at a time', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  await expect(page.getByText(/^Hint 1:/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await expect(page.getByText(/^Hint 1:/)).toBeVisible()
})

test('a choice question grades itself, without a self assessment', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  // Driven from the first closures question, what-is-a-closure, whose correct
  // option is B. Which option is right varies from question to question on
  // purpose, so that is a fact about this one and not a rule to lean on.
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible()

  // Nothing about grading yourself belongs on a question with one right answer.
  await expect(page.getByRole('button', { name: 'Passed' })).toHaveCount(0)

  await optionsList(page).getByRole('button').first().click()

  await expect(page.getByText('Not this time')).toBeVisible()

  // Answering is final: the options stop responding once a choice is recorded.
  await expect(optionsList(page).getByRole('button').first()).toBeDisabled()

  await page.getByRole('button', { name: 'Next question' }).click()
})

test('a choice question shows the full answer once it is answered', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  // Same question, answered right this time, so the correct verdict is covered
  // as well as the wrong one.
  await expect(page.getByText(/^1 of \d+$/)).toBeVisible()
  await optionsList(page).getByRole('button').nth(1).click()

  await expect(page.getByText('Correct')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Listen to the answer' })).toBeVisible()
})

test('the session reports completion after the last question', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  const counter = page.getByText(/^\d+ of \d+$/)
  const total = Number((await counter.textContent())?.split(' of ')[1])
  expect(total).toBeGreaterThan(0)

  for (let i = 0; i < total; i++) await answerCurrent(page)

  await expect(page.getByText('Session complete')).toBeVisible()
  await expect(page.getByText(`${total} questions recorded.`)).toBeVisible()
})

test('a question is chipped with the interview level that asks it', async ({ page }) => {
  await page.goto('/topics/javascript/closures/practice')

  // The tier is stored as a slug and shown as a name, so a chip reading swe-1
  // means the label map was bypassed. Which of the four is content's business,
  // so this asserts on the shape rather than on the closures bank.
  await expect(page.getByText(/^(SWE-1|SWE-2|Senior|Staff)$/)).toBeVisible()
})
