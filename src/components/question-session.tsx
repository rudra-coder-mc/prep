'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  answerMcqAction,
  answerOutputAction,
  recordAttemptAction,
  revealAnswerAction,
} from '@/actions/session'
import {
  DURATION_FAST,
  EASE_SOFT,
  usePrefersReducedMotion,
} from '@/components/motion/reduced-motion'
import { Button, buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { CheckIcon, LightbulbIcon } from '@/components/ui/icons'
import { SpeakButton } from '@/components/speech/speak-button'
import {
  CONFIDENCE_LABELS,
  RESULT_LABELS,
  type Confidence,
  type Result,
} from '@/lib/interval-ladder'
import { cx } from '@/lib/cx'

/**
 * Deliberately excludes the answer, so it cannot reach the browser early. For a
 * multiple choice question that means the options are here but which one is
 * correct is not.
 */
export type SessionQuestion = {
  id: string
  topicSlug: string
  topicTitle: string
  type: string
  difficulty: string
  prompt: string
  code?: string
  hints: string[]
  options?: string[]
  /** Whether this question is checked against printed output rather than self graded. */
  checksOutput?: boolean
  /**
   * Where the recording of the prompt and, for a multiple choice question, its
   * options lives. Built by `npm run narration:build`, so this is a key and not
   * a script: there is no synthesis to fall back to.
   */
  questionAudioKey?: string
}

type Revealed = { expectedAnswer: string; explanation: string; answerAudioKey: string }
type Tally = Record<Result, number>

const CONFIDENCES: Confidence[] = [1, 2, 3, 4, 5]
const RESULTS: Result[] = ['passed', 'weak', 'failed']
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

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

function QuestionPrompt({ question }: { question: SessionQuestion }) {
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-1.5">
        <Chip>{question.type}</Chip>
        <Chip>{question.difficulty}</Chip>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <h2 className="text-xl leading-relaxed font-medium text-pretty">{question.prompt}</h2>
        <SpeakButton
          audioKey={question.questionAudioKey}
          label="Listen to the question"
          className="mt-1 shrink-0"
        />
      </div>

      {question.code ? (
        <pre className="mt-4 overflow-x-auto rounded-card border border-border bg-surface p-4 font-mono text-sm leading-6">
          {question.code}
        </pre>
      ) : null}
    </>
  )
}

function Hints({
  hints,
  shown,
  onShow,
  reducedMotion,
}: {
  hints: string[]
  shown: number
  onShow: () => void
  reducedMotion: boolean
}) {
  if (hints.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      <AnimatePresence initial={false}>
        {hints.slice(0, shown).map((hint, index) => (
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
      {shown < hints.length ? (
        <button
          type="button"
          onClick={onShow}
          className={buttonClass({ variant: 'ghost', size: 'sm', className: '-ml-3' })}
        >
          <LightbulbIcon className="size-4" />
          Show a hint
        </button>
      ) : null}
    </div>
  )
}

/**
 * The written form: answer from memory, reveal, then grade yourself. Grading
 * free text reliably is harder than the rest of the platform combined, so the
 * honest self assessment stays.
 */
function WrittenQuestion({
  question,
  onGraded,
  reducedMotion,
}: {
  question: SessionQuestion
  onGraded: (result: Result) => Promise<void>
  reducedMotion: boolean
}) {
  const [answer, setAnswer] = useState('')
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState<Revealed | null>(null)
  const [busy, setBusy] = useState(false)

  async function submitAnswer() {
    if (confidence === null) return
    setBusy(true)
    try {
      setRevealed(await revealAnswerAction(question.topicSlug, question.id))
    } finally {
      setBusy(false)
    }
  }

  async function grade(result: Result) {
    if (confidence === null) return
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
      await onGraded(result)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!revealed ? (
        <Hints
          hints={question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
          reducedMotion={reducedMotion}
        />
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
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Expected answer</SectionLabel>
              <SpeakButton
                audioKey={revealed.answerAudioKey}
                label="Listen to the answer and explanation"
              />
            </div>
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
    </>
  )
}

type OutputVerdict = {
  correct: boolean
  expectedOutput: string
  explanation: string
  answerAudioKey: string
}

/**
 * The output form: type what the program prints and have it checked. The answer
 * is exact, so reading the expected value and then marking yourself correct is
 * the weakest possible way to find out whether you were.
 */
function OutputQuestion({
  question,
  onGraded,
  reducedMotion,
}: {
  question: SessionQuestion
  onGraded: (result: Result) => Promise<void>
  reducedMotion: boolean
}) {
  const [answer, setAnswer] = useState('')
  const [hintsShown, setHintsShown] = useState(0)
  const [verdict, setVerdict] = useState<OutputVerdict | null>(null)
  const [busy, setBusy] = useState(false)

  async function check() {
    if (answer.trim().length === 0) return
    setBusy(true)
    try {
      setVerdict(await answerOutputAction(question.topicSlug, question.id, answer, hintsShown))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!verdict ? (
        <Hints
          hints={question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
          reducedMotion={reducedMotion}
        />
      ) : null}

      <label className="mt-6 block">
        <span className="text-sm text-muted">Your answer</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={verdict !== null}
          rows={4}
          placeholder="Exactly what it prints, one line per line of output."
          className="mt-1.5 w-full rounded-card border border-border bg-surface p-3.5 font-mono text-sm leading-6 transition-colors outline-none placeholder:text-faint/70 focus:border-accent disabled:opacity-60"
        />
      </label>

      {!verdict ? (
        <Button
          variant="primary"
          onClick={check}
          disabled={answer.trim().length === 0 || busy}
          className="mt-5"
        >
          {busy ? 'Checking...' : 'Check answer'}
        </Button>
      ) : (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
        >
          <Card className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className={cx('font-medium', verdict.correct ? 'text-pass' : 'text-fail')}>
                {verdict.correct ? 'Correct' : 'Not this time'}
              </p>
              <SpeakButton
                audioKey={verdict.answerAudioKey}
                label="Listen to the answer and explanation"
              />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <SectionLabel>Expected output</SectionLabel>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-bg p-3 font-mono text-sm leading-6">
                {verdict.expectedOutput}
              </pre>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <SectionLabel>Explanation</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {verdict.explanation}
              </p>
            </div>
          </Card>

          <Button
            variant="primary"
            className="mt-5"
            disabled={busy}
            onClick={() => onGraded(verdict.correct ? 'passed' : 'failed')}
          >
            Next question
          </Button>
        </motion.div>
      )}
    </>
  )
}

type ChoiceVerdict = {
  correct: boolean
  correctOption: number
  explanation: string
  answerAudioKey: string
}

/**
 * The multiple choice form: pick one, find out immediately, move on. Grading
 * happens on the server, which is also the only place that knows the answer.
 */
function ChoiceQuestion({
  question,
  options,
  onGraded,
  reducedMotion,
}: {
  question: SessionQuestion
  options: string[]
  onGraded: (result: Result) => Promise<void>
  reducedMotion: boolean
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [verdict, setVerdict] = useState<ChoiceVerdict | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [busy, setBusy] = useState(false)

  async function choose(index: number) {
    if (verdict !== null || busy) return
    setBusy(true)
    setChosen(index)
    try {
      setVerdict(await answerMcqAction(question.topicSlug, question.id, index))
    } catch (error) {
      // The choice was not recorded, so let it be made again rather than
      // leaving a selected option that means nothing.
      setChosen(null)
      throw error
    } finally {
      setBusy(false)
    }
  }

  function toneFor(index: number): string {
    if (!verdict) return 'border-border hover:border-edge hover:bg-raised'
    if (index === verdict.correctOption) return 'border-pass bg-pass/10 text-pass'
    if (index === chosen) return 'border-fail bg-fail/10 text-fail'
    return 'border-border opacity-60'
  }

  return (
    <>
      {!verdict ? (
        <Hints
          hints={question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
          reducedMotion={reducedMotion}
        />
      ) : null}

      <ul aria-label="Answer options" className="mt-6 space-y-2">
        {options.map((option, index) => (
          <li key={option}>
            <button
              type="button"
              disabled={verdict !== null || busy}
              onClick={() => choose(index)}
              className={cx(
                'flex w-full items-start gap-3 rounded-card border p-3.5 text-left text-sm transition-colors',
                'disabled:cursor-default',
                toneFor(index),
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-md border border-current/30 text-xs font-semibold">
                {OPTION_LETTERS[index] ?? index + 1}
              </span>
              <span className="font-mono leading-6 whitespace-pre-wrap">{option}</span>
            </button>
          </li>
        ))}
      </ul>

      {verdict ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
        >
          <Card className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className={cx('font-medium', verdict.correct ? 'text-pass' : 'text-fail')}>
                {verdict.correct ? 'Correct' : 'Not this time'}
              </p>
              <SpeakButton
                audioKey={verdict.answerAudioKey}
                label="Listen to the answer and explanation"
              />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <SectionLabel>Explanation</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {verdict.explanation}
              </p>
            </div>
          </Card>

          <Button
            variant="primary"
            className="mt-5"
            disabled={busy}
            onClick={() => onGraded(verdict.correct ? 'passed' : 'failed')}
          >
            Next question
          </Button>
        </motion.div>
      ) : null}
    </>
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

  /**
   * Called once the attempt is already recorded, whichever form recorded it.
   * Per question state lives in the child, which is keyed by question, so
   * moving on resets it without anything here having to remember what to clear.
   */
  async function advance(result: Result) {
    setTally((current) => ({ ...current, [result]: current[result] + 1 }))

    if (position + 1 >= questions.length) {
      setDone(true)
    } else {
      setPosition(position + 1)
      // A long question can leave the next one starting below the fold.
      container.current?.scrollIntoView({
        block: 'start',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    }

    router.refresh()
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
          <QuestionPrompt question={question} />

          {question.options ? (
            <ChoiceQuestion
              question={question}
              options={question.options}
              onGraded={advance}
              reducedMotion={reducedMotion}
            />
          ) : question.checksOutput ? (
            <OutputQuestion question={question} onGraded={advance} reducedMotion={reducedMotion} />
          ) : (
            <WrittenQuestion question={question} onGraded={advance} reducedMotion={reducedMotion} />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
