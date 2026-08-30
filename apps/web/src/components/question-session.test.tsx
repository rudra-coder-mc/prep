import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuestionSession, type SessionQuestion } from './question-session'

/**
 * What this covers is the one thing the session does that has no button: it
 * asks for a question's answer to be recorded while the question is being
 * answered. Everything else about the forms is covered end to end, where a real
 * server grades a real question.
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/actions/session', () => ({
  answerChoiceAction: vi.fn(),
  answerOrderingAction: vi.fn(),
  revealAnswerAction: vi.fn(async () => ({
    answerInFull: 'The binding, not the value.',
    answerAudioKey: 'a'.repeat(64),
  })),
  selfGradeAction: vi.fn(async () => ({ dueAt: '', queueCleared: false })),
}))

const QUESTIONS: SessionQuestion[] = [
  {
    id: 'q1',
    topicSlug: 'javascript/closures',
    topicTitle: 'Closures',
    type: 'recall',
    tier: 'swe-2',
    prompt: 'What does a closure capture?',
    hints: [],
    form: 'open',
  },
  {
    id: 'q2',
    topicSlug: 'javascript/closures',
    topicTitle: 'Closures',
    type: 'recall',
    tier: 'swe-2',
    prompt: 'When is the captured variable released?',
    hints: [],
    form: 'open',
  },
]

let fetchMock: ReturnType<typeof vi.fn>

/** What the session asked to have recorded, in the order it asked. */
const warmed = () =>
  fetchMock.mock.calls
    .filter(([url]) => String(url) === '/api/speech/warm')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))

beforeEach(() => {
  fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('the question session', () => {
  it('records the answer while the question is being answered', async () => {
    render(<QuestionSession questions={QUESTIONS} />)

    await waitFor(() =>
      expect(warmed()).toEqual([{ answer: { topic: 'javascript/closures', question: 'q1' } }]),
    )
  })

  it('moves the warming on with the question', async () => {
    render(<QuestionSession questions={QUESTIONS} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reveal the answer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Passed' }))

    await waitFor(() =>
      expect(warmed().at(-1)).toEqual({
        answer: { topic: 'javascript/closures', question: 'q2' },
      }),
    )
  })

  it('records nothing once the session is over', async () => {
    render(<QuestionSession questions={[QUESTIONS[0] as SessionQuestion]} />)
    await waitFor(() => expect(warmed()).toHaveLength(1))

    await userEvent.click(screen.getByRole('button', { name: 'Reveal the answer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Passed' }))

    await expect(screen.findByText('Session complete')).resolves.toBeDefined()
    expect(warmed()).toHaveLength(1)
  })
})
