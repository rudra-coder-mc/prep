import { expect, type Page } from '@playwright/test'

export const optionsList = (page: Page) => page.getByRole('list', { name: 'Answer options' })

/**
 * The current question, once it is actually answerable. A question animates out
 * before the next one mounts, and during that gap the previous question's
 * textarea is still in the document but disabled, so asking which form is on
 * screen too early gets the old answer.
 */
export const checkButton = (page: Page) => page.getByRole('button', { name: 'Check answer' })

export const answerable = (page: Page) =>
  page.locator('ul[aria-label="Answer options"], textarea:not([disabled])').first()

/** Answers whichever form the current question takes, and moves past it. */
export async function answerCurrent(page: Page, index = 0) {
  await expect(answerable(page)).toBeVisible()

  if (await optionsList(page).isVisible()) {
    await optionsList(page).getByRole('button').first().click()
    await expect(page.getByText('Explanation')).toBeVisible()
    await page.getByRole('button', { name: 'Next question' }).click()
    return
  }

  const check = page.getByRole('button', { name: 'Check answer' })
  if (await check.isVisible()) {
    await page.getByLabel('Your answer').fill(`answer ${index}`)
    await check.click()
    await expect(page.getByText('Expected output')).toBeVisible()
    await page.getByRole('button', { name: 'Next question' }).click()
    return
  }

  await page.getByLabel('Your answer').fill(`answer ${index}`)
  await page.getByRole('radio', { name: /^3 —/ }).check()
  await page.getByRole('button', { name: 'Submit and reveal answer' }).click()
  await expect(page.getByText('Expected answer')).toBeVisible()
  await page.getByRole('button', { name: 'Weak' }).click()
}

/**
 * Answers questions until one of the given form is on screen. Each question has
 * to be answerable before its form is read, or the check races the transition
 * and answerCurrent consumes the very question being looked for.
 */
export async function walkToForm(page: Page, form: 'choice' | 'output' | 'written') {
  for (let index = 0; index < 30; index += 1) {
    await expect(answerable(page)).toBeVisible()

    const choice = await optionsList(page).isVisible()
    const output = await checkButton(page).isVisible()
    const found = form === 'choice' ? choice : form === 'output' ? output : !choice && !output
    if (found) return

    await answerCurrent(page, index)
  }

  throw new Error(`No ${form} question appeared in this session`)
}
