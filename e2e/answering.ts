import { expect, type Page } from '@playwright/test'

export const optionsList = (page: Page) => page.getByRole('list', { name: 'Answer options' })

export const revealButton = (page: Page) => page.getByRole('button', { name: 'Reveal the answer' })

export const orderingList = (page: Page) => page.getByRole('list', { name: 'Lines to order' })

/**
 * A question is answerable for as long as its controls still respond. Answering
 * disables them, and a question animates out with its answered controls still in
 * the document, so asking whether a list is on screen finds the question that
 * has just left and then clicks a dead button. Asking for a control the outgoing
 * question no longer has is what separates the two.
 *
 * An open question loses its reveal button outright once it is revealed, so that
 * one needs no such qualifier.
 */
export const answerable = (page: Page) =>
  page
    .locator(
      'ul[aria-label="Answer options"] button:not([disabled]), ul[aria-label="Lines to order"] button:not([disabled]), button:has-text("Reveal the answer")',
    )
    .first()

/**
 * The session has moved past the question that was just answered. That means the
 * next question, or the end of the session when the answered one was the last,
 * and which of the two it is depends on where a topic's content puts the form a
 * spec was driving.
 */
export const movedOn = (page: Page) => page.getByText('Session complete').or(answerable(page))

const liveOptions = (page: Page) => optionsList(page).locator('button:not([disabled])').first()

const livePool = (page: Page) => orderingList(page).locator('button:not([disabled])').first()

/** The form of the question currently waiting for an answer. */
async function formOnScreen(page: Page): Promise<'choice' | 'ordering' | 'open'> {
  await expect(answerable(page)).toBeVisible()

  if (await liveOptions(page).isVisible()) return 'choice'
  if (await livePool(page).isVisible()) return 'ordering'
  return 'open'
}

/** Answers whichever form the current question takes, and moves past it. */
export async function answerCurrent(page: Page) {
  const form = await formOnScreen(page)

  if (form === 'choice') {
    await liveOptions(page).click()
    await page.getByRole('button', { name: 'Next question' }).click()
    return
  }

  if (form === 'ordering') {
    // Any sequence records an attempt, and the point here is to get past the
    // question rather than to get it right.
    await livePool(page).click()
    await page.getByRole('button', { name: 'Check the order' }).click()
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
export async function walkToForm(page: Page, form: 'choice' | 'ordering' | 'open') {
  for (let index = 0; index < 30; index += 1) {
    if ((await formOnScreen(page)) === form) return

    await answerCurrent(page)
  }

  throw new Error(`No ${form} question appeared in this session`)
}
