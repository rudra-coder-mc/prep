import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CodeWalkthrough, type WalkthroughStep } from './code-walkthrough'

const CODE = `let count = 0
count += 1
console.log(count)`

const STEPS: WalkthroughStep[] = [
  { lines: [1], note: 'count is declared and bound to 0.', variables: { count: '0' } },
  { lines: [2], note: 'count is incremented.', variables: { count: '1' } },
  { lines: [3], note: 'The value is printed.', variables: { count: '1' }, output: ['1'] },
]

function highlightedLines(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-active]')].map((el) =>
    el.textContent!.replace(/^\d+/, '').trim(),
  )
}

describe('CodeWalkthrough', () => {
  it('renders every line of the code', () => {
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)
    expect(container.querySelector('code')?.textContent).toContain('console.log(count)')
  })

  it('starts on the first step and highlights only its lines', () => {
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)
    expect(screen.getByText('count is declared and bound to 0.')).toBeDefined()
    expect(highlightedLines(container)).toEqual(['let count = 0'])
  })

  it('moves the highlight and the note when stepping forward', async () => {
    const user = userEvent.setup()
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    await user.click(screen.getByLabelText('Next step'))
    expect(highlightedLines(container)).toEqual(['count += 1'])
    expect(screen.getByText('count is incremented.')).toBeDefined()
  })

  it('steps back to where it was', async () => {
    const user = userEvent.setup()
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    await user.click(screen.getByLabelText('Next step'))
    await user.click(screen.getByLabelText('Previous step'))
    expect(highlightedLines(container)).toEqual(['let count = 0'])
  })

  it('disables stepping past either end', async () => {
    const user = userEvent.setup()
    render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    expect(screen.getByLabelText('Previous step')).toHaveProperty('disabled', true)
    await user.click(screen.getByLabelText('Next step'))
    await user.click(screen.getByLabelText('Next step'))
    expect(screen.getByLabelText('Next step')).toHaveProperty('disabled', true)
  })

  it('shows output only once a step produces it', async () => {
    const user = userEvent.setup()
    render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    expect(screen.queryByText('Output')).toBeNull()
    await user.click(screen.getByLabelText('Next step'))
    await user.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('Output')).toBeDefined()
  })

  it('moves one marker rather than redrawing the highlight', async () => {
    const user = userEvent.setup()
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    const marker = () => container.querySelectorAll('[aria-hidden][class*="border-accent"]')
    expect(marker()).toHaveLength(1)

    await user.click(screen.getByLabelText('Next step'))
    expect(marker()).toHaveLength(1)
  })

  it('bands each run of lines separately when a step points at two places', () => {
    const split: WalkthroughStep[] = [
      { lines: [1, 3], note: 'The call, and the line it lands on.' },
    ]

    const { container } = render(<CodeWalkthrough code={CODE} steps={split} />)
    expect(container.querySelectorAll('[aria-hidden][class*="border-accent"]')).toHaveLength(2)
  })

  it('exposes the timeline as a labelled range for keyboard use', async () => {
    const user = userEvent.setup()
    const { container } = render(<CodeWalkthrough code={CODE} steps={STEPS} />)

    const slider = screen.getByRole('slider')
    expect(slider).toHaveProperty('max', '2')

    await user.click(screen.getByLabelText('Next step'))
    expect(screen.getByText('2/3')).toBeDefined()
    expect(highlightedLines(container)).toEqual(['count += 1'])
  })
})
