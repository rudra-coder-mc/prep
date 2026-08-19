import { expect, type Page } from '@playwright/test'

export const optionsList = (page: Page) => page.getByRole('list', { name: 'Answer options' })

/**
 * The current question, once it is actually answerable. A question animates out
 * before the next one mounts, and during that gap the previous question's
 * textarea is still in the document but disabled, so asking which form is on
 * screen too early gets the old answer.
 */
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

  await page.getByLabel('Your answer').fill(`answer ${index}`)
  await page.getByRole('radio', { name: /^3 —/ }).check()
  await page.getByRole('button', { name: 'Submit and reveal answer' }).click()
  await expect(page.getByText('Expected answer')).toBeVisible()
  await page.getByRole('button', { name: 'Weak' }).click()
}
