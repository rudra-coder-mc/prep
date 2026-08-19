'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordAttemptAction, revealAnswerAction } from '@/actions/session'
import {
  DURATION_FAST,
  EASE_SOFT,
  usePrefersReducedMotion,
} from '@/components/motion/reduced-motion'
import { Button, buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { CheckIcon, LightbulbIcon } from '@/components/ui/icons'
import {
  CONFIDENCE_LABELS,
  RESULT_LABELS,
  type Confidence,
  type Result,
} from '@/lib/interval-ladder'
import { cx } from '@/lib/cx'

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
type Tally = Record<Result, number>

const CONFIDENCES: Confidence[] = [1, 2, 3, 4, 5]
const RESULTS: Result[] = ['passed', 'weak', 'failed']

const RESULT_TONES: Record<Result, string> = {
  passed: 'border-pass/50 text-pass hover:bg-pass/10 hover:border-pass',
  weak: 'border-weak/50 text-weak hover:bg-weak/10 hover:border-weak',
  failed: 'border-fail/50 text-fail hover:bg-fail/10 hover:border-fail',
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted capitalize">
      {children}
    </span>
  )
}

/** One filled segment per question answered, so progress is visible at a glance. */
function QueueProgress({ position, total }: { position: number; total: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cx(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            index < position ? 'bg-accent' : index === position ? 'bg-accent/50' : 'bg-raised',
          )}
        />
      ))}
    </div>
  )
}

export function QuestionSession({
  questions,
  returnHref = '/topics',
  returnLabel = 'Back to topics',
}: {
  questions: SessionQuestion[]
  returnHref?: string
  returnLabel?: string
}) {
  const router = useRouter()
  const reducedMotion = usePrefersReducedMotion()
  const container = useRef<HTMLElement>(null)

  const [position, setPosition] = useState(0)
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState<Revealed | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [tally, setTally] = useState<Tally>({ passed: 0, weak: 0, failed: 0 })

  const question = questions[position]

  if (done || !question) {
    return (
      <Card className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-pass/15 text-pass">
          <CheckIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-medium">Session complete</h2>
        <p className="mt-1 text-sm text-muted">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'} recorded.
        </p>
        <dl className="mx-auto mt-5 flex max-w-xs justify-center gap-6 text-sm">
          {RESULTS.map((result) => (
            <div key={result}>
              <dt className="text-xs text-faint">{RESULT_LABELS[result]}</dt>
              <dd className="mt-0.5 text-xl font-semibold tabular-nums">{tally[result]}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => router.push(returnHref as Parameters<typeof router.push>[0])}
          className={buttonClass({ variant: 'secondary', size: 'sm', className: 'mt-6' })}
        >
          {returnLabel}
        </button>
      </Card>
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

      setTally((current) => ({ ...current, [result]: current[result] + 1 }))

      if (position + 1 >= questions.length) {
        setDone(true)
      } else {
        setPosition(position + 1)
        setAnswer('')
        setConfidence(null)
        setHintsShown(0)
        setRevealed(null)
        // A long question can leave the next one starting below the fold.
        container.current?.scrollIntoView({
          block: 'start',
          behavior: reducedMotion ? 'auto' : 'smooth',
        })
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section ref={container} className="scroll-mt-36">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted tabular-nums">
          {position + 1} of {questions.length}
        </span>
        <span className="truncate text-xs text-faint">{question.topicTitle}</span>
      </div>
      <div className="mt-2">
        <QueueProgress position={position} total={questions.length} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${question.topicSlug}#${question.id}`}
          initial={reducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
        >
          <div className="mt-5 flex flex-wrap gap-1.5">
            <Chip>{question.type}</Chip>
            <Chip>{question.difficulty}</Chip>
          </div>

          <h2 className="mt-3 text-xl leading-relaxed font-medium text-pretty">
            {question.prompt}
          </h2>

          {question.code ? (
            <pre className="mt-4 overflow-x-auto rounded-card border border-border bg-surface p-4 font-mono text-sm leading-6">
              {question.code}
            </pre>
          ) : null}

          {question.hints.length > 0 && !revealed ? (
            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {question.hints.slice(0, hintsShown).map((hint, index) => (
                  <motion.p
                    key={index}
                    initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 rounded-lg border border-weak/25 bg-weak/5 px-3 py-2 text-sm text-muted"
                  >
                    <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-weak" />
                    <span>
                      Hint {index + 1}: {hint}
                    </span>
                  </motion.p>
                ))}
              </AnimatePresence>
              {hintsShown < question.hints.length ? (
                <button
                  type="button"
                  onClick={() => setHintsShown(hintsShown + 1)}
                  className={buttonClass({ variant: 'ghost', size: 'sm', className: '-ml-3' })}
                >
                  <LightbulbIcon className="size-4" />
                  Show a hint
                </button>
              ) : null}
            </div>
          ) : null}

          <label className="mt-6 block">
            <span className="text-sm text-muted">Your answer</span>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={revealed !== null}
              rows={6}
              placeholder="Explain it as if to another developer."
              className="mt-1.5 w-full rounded-card border border-border bg-surface p-3.5 font-mono text-sm leading-6 transition-colors outline-none placeholder:text-faint/70 focus:border-accent disabled:opacity-60"
            />
          </label>

          <fieldset className="mt-5" disabled={revealed !== null}>
            <legend className="text-sm text-muted">How confident are you?</legend>
            <div className="mt-2 flex gap-1.5">
              {CONFIDENCES.map((value) => (
                <label key={value} className="relative flex-1">
                  {/* The input covers the pill so the whole target is clickable. */}
                  <input
                    type="radio"
                    name="confidence"
                    value={value}
                    checked={confidence === value}
                    onChange={() => setConfidence(value)}
                    aria-label={`${value} — ${CONFIDENCE_LABELS[value]}`}
                    className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                  />
                  <span
                    className={cx(
                      'block rounded-lg border border-border py-2 text-center text-sm font-medium transition',
                      'hover:border-edge hover:bg-raised',
                      'peer-checked:border-accent peer-checked:bg-accent-dim peer-checked:text-accent',
                      'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                      'peer-disabled:cursor-default peer-disabled:opacity-60',
                    )}
                  >
                    {value}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 h-4 text-xs text-faint">
              {confidence === null
                ? 'Pick a level to reveal the answer.'
                : CONFIDENCE_LABELS[confidence]}
            </p>
          </fieldset>

          {!revealed ? (
            <Button
              variant="primary"
              onClick={submitAnswer}
              disabled={confidence === null || busy}
              className="mt-5"
            >
              {busy ? 'Loading...' : 'Submit and reveal answer'}
            </Button>
          ) : (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
            >
              <Card className="mt-6">
                <SectionLabel>Expected answer</SectionLabel>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {revealed.expectedAnswer}
                </p>

                <div className="mt-5 border-t border-border pt-4">
                  <SectionLabel>Explanation</SectionLabel>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                    {revealed.explanation}
                  </p>
                </div>
              </Card>

              <div className="mt-5">
                <p className="text-sm text-muted">How did you do?</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {RESULTS.map((result) => (
                    <button
                      key={result}
                      type="button"
                      disabled={busy}
                      onClick={() => grade(result)}
                      className={cx(
                        buttonClass({ variant: 'secondary' }),
                        'justify-center bg-transparent',
                        RESULT_TONES[result],
                      )}
                    >
                      {RESULT_LABELS[result]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
