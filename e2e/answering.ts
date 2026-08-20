import { expect, type Page } from '@playwright/test'

export const optionsList = (page: Page) => page.getByRole('list', { name: 'Answer options' })

export const revealButton = (page: Page) => page.getByRole('button', { name: 'Reveal the answer' })

/**
 * The current question, once it is actually answerable. A question animates out
 * before the next one mounts, and during that gap the previous question's
 * controls are still in the document, so asking which form is on screen too
 * early gets the old one.
 */
export const answerable = (page: Page) =>
  page.locator('ul[aria-label="Answer options"], button:has-text("Reveal the answer")').first()

/** Answers whichever form the current question takes, and moves past it. */
export async function answerCurrent(page: Page) {
  await expect(answerable(page)).toBeVisible()

  if (await optionsList(page).isVisible()) {
    await optionsList(page).getByRole('button').first().click()
    await page.getByRole('button', { name: 'Next question' }).click()
    return
  }

  await revealButton(page).click()
  await page.getByRole('button', { name: 'Weak' }).click()
}

/**
 * Answers questions until one of the given form is on screen. Each question has
 * to be answerable before its form is read, or the check races the transition
 * and answerCurrent consumes the very question being looked for.
 */
export async function walkToForm(page: Page, form: 'choice' | 'open') {
  for (let index = 0; index < 30; index += 1) {
    await expect(answerable(page)).toBeVisible()

    const choice = await optionsList(page).isVisible()
    if (choice === (form === 'choice')) return

    await answerCurrent(page)
  }

  throw new Error(`No ${form} question appeared in this session`)
}
