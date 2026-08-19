'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordAttemptAction, revealAnswerAction } from '@/app/topics/session-actions'
import {
  CONFIDENCE_LABELS,
  RESULT_LABELS,
  type Confidence,
  type Result,
} from '@/lib/interval-ladder'

/** Deliberately excludes the answer, so it cannot reach the browser early. */
export type SessionQuestion = {
  id: string
  topicSlug: string
  topicTitle: string
  type: string
  difficulty: string
  prompt: string
  code?: string
  hints: string[]
}

type Revealed = { expectedAnswer: string; explanation: string }

const CONFIDENCES: Confidence[] = [1, 2, 3, 4, 5]
const RESULTS: Result[] = ['passed', 'weak', 'failed']

export function QuestionSession({ questions }: { questions: SessionQuestion[] }) {
  const router = useRouter()
  const [position, setPosition] = useState(0)
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState<Revealed | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const question = questions[position]

  if (done || !question) {
    return (
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-medium">Session complete</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'} recorded.
        </p>
        <button
          type="button"
          onClick={() => router.push('/topics')}
          className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          Back to topics
        </button>
      </section>
    )
  }

  async function submitAnswer() {
    if (confidence === null || !question) return
    setBusy(true)
    try {
      setRevealed(await revealAnswerAction(question.topicSlug, question.id))
    } finally {
      setBusy(false)
    }
  }

  async function grade(result: Result) {
    if (confidence === null || !question) return
    setBusy(true)
    try {
      await recordAttemptAction({
        topicSlug: question.topicSlug,
        questionId: question.id,
        answer,
        result,
        confidence,
        hintsUsed: hintsShown,
      })

      if (position + 1 >= questions.length) {
        setDone(true)
      } else {
        setPosition(position + 1)
        setAnswer('')
        setConfidence(null)
        setHintsShown(0)
        setRevealed(null)
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <p className="text-xs text-[var(--color-muted)]">
        {position + 1} of {questions.length} · {question.topicTitle} · {question.type} ·{' '}
        {question.difficulty}
      </p>

      <h2 className="mt-3 text-lg leading-relaxed font-medium">{question.prompt}</h2>

      {question.code ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-[var(--color-surface)] p-3 font-mono text-sm leading-6">
          {question.code}
        </pre>
      ) : null}

      {question.hints.length > 0 && !revealed ? (
        <div className="mt-4">
          {question.hints.slice(0, hintsShown).map((hint, i) => (
            <p key={i} className="text-sm text-[var(--color-muted)]">
              Hint {i + 1}: {hint}
            </p>
          ))}
          {hintsShown < question.hints.length ? (
            <button
              type="button"
              onClick={() => setHintsShown(hintsShown + 1)}
              className="mt-1 text-sm text-[var(--color-accent)]"
            >
              Show a hint
            </button>
          ) : null}
        </div>
      ) : null}

      <label className="mt-6 block">
        <span className="text-sm text-[var(--color-muted)]">Your answer</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={revealed !== null}
          rows={6}
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-70"
        />
      </label>

      <fieldset className="mt-5" disabled={revealed !== null}>
        <legend className="text-sm text-[var(--color-muted)]">How confident are you?</legend>
        <div className="mt-2 space-y-1">
          {CONFIDENCES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="confidence"
                value={value}
                checked={confidence === value}
                onChange={() => setConfidence(value)}
                className="accent-[var(--color-accent)]"
              />
              <span>
                {value} — {CONFIDENCE_LABELS[value]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!revealed ? (
        <button
          type="button"
          onClick={submitAnswer}
          disabled={confidence === null || busy}
          className="mt-6 rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-bg)] disabled:opacity-50"
        >
          {busy ? 'Loading...' : 'Submit and reveal answer'}
        </button>
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
              Expected answer
            </h3>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {revealed.expectedAnswer}
            </p>

            <h3 className="mt-5 text-xs tracking-wide text-[var(--color-muted)] uppercase">
              Explanation
            </h3>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {revealed.explanation}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm text-[var(--color-muted)]">How did you do?</p>
            <div className="mt-2 flex gap-2">
              {RESULTS.map((result) => (
                <button
                  key={result}
                  type="button"
                  disabled={busy}
                  onClick={() => grade(result)}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)] disabled:opacity-50"
                >
                  {RESULT_LABELS[result]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
