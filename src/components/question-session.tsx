'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  answerChoiceAction,
  answerOrderingAction,
  revealAnswerAction,
  selfGradeAction,
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
import { warmAnswer } from '@/components/speech/warm'
import { RESULT_LABELS, type Result } from '@/lib/interval-ladder'
import { TIER_LABELS, type AnswerForm, type Tier } from '@/content/schema'
import { cx } from '@/lib/cx'

/**
 * Deliberately excludes the answer, so it cannot reach the browser early. For a
 * choice question that means the options are here but which one is
 * correct is not.
 */
export type SessionQuestion = {
  id: string
  topicSlug: string
  topicTitle: string
  type: string
  tier: Tier
  prompt: string
  code?: string
  hints: string[]
  options?: string[]
  /**
   * An ordering question's pool, in the order it is shown. Which entries print,
   * and in what order, is not here: that is the answer.
   */
  items?: string[]
  /** How it is answered. Decides which form the session renders. */
  form: AnswerForm
  /**
   * Where the recording of the prompt and, for a choice question, its options
   * lives. A key rather than a script, because the server resolves it against
   * `content/` and makes the recording the first time it is asked for. The
   * answer's key travels the same way, with the reveal.
   */
  questionAudioKey?: string
}

type Revealed = { answerInFull: string; explanation?: string; answerAudioKey: string }
type Tally = Record<Result, number>

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
        <Chip>{TIER_LABELS[question.tier]}</Chip>
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

/** The answer in full, and the explanation when there is one to add. */
function AnswerCard({
  answerInFull,
  explanation,
  answerAudioKey,
  heading,
}: {
  answerInFull: string
  explanation?: string
  answerAudioKey: string
  heading: React.ReactNode
}) {
  return (
    <Card className="mt-5">
      <div className="flex items-center justify-between gap-3">
        {heading}
        <SpeakButton audioKey={answerAudioKey} label="Listen to the answer" />
      </div>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{answerInFull}</p>

      {explanation ? (
        <div className="mt-5 border-t border-border pt-4">
          <SectionLabel>Worth adding</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
            {explanation}
          </p>
        </div>
      ) : null}
    </Card>
  )
}

/**
 * The open form: answer it in your head or out loud, reveal, then mark yourself.
 * The only form the platform cannot grade, so it is the only one that asks.
 *
 * Nothing is typed. A typed answer nobody reads back is a self grade with extra
 * steps, and it made a two second judgement into a fifteen second one.
 */
function OpenQuestion({
  question,
  onGraded,
  reducedMotion,
}: {
  question: SessionQuestion
  onGraded: (result: Result) => Promise<void>
  reducedMotion: boolean
}) {
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState<Revealed | null>(null)
  const [busy, setBusy] = useState(false)

  async function reveal() {
    setBusy(true)
    try {
      setRevealed(await revealAnswerAction(question.topicSlug, question.id))
    } finally {
      setBusy(false)
    }
  }

  async function grade(result: Result) {
    setBusy(true)
    try {
      await selfGradeAction(question.topicSlug, question.id, result, hintsShown)
      await onGraded(result)
    } finally {
      setBusy(false)
    }
  }

  if (!revealed) {
    return (
      <>
        <Hints
          hints={question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
          reducedMotion={reducedMotion}
        />

        <p className="mt-6 text-sm text-muted">
          Answer it out loud, as you would in the room. Then reveal and mark yourself against what
          you actually said.
        </p>

        <Button variant="primary" onClick={reveal} disabled={busy} className="mt-4">
          {busy ? 'Loading...' : 'Reveal the answer'}
        </Button>
      </>
    )
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
    >
      <AnswerCard
        answerInFull={revealed.answerInFull}
        explanation={revealed.explanation}
        answerAudioKey={revealed.answerAudioKey}
        heading={<SectionLabel>The answer</SectionLabel>}
      />

      <div className="mt-5">
        <p className="text-sm text-muted">How much of that did you say?</p>
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
  )
}

type OrderingVerdict = {
  correct: boolean
  correctOrder: number[]
  answerInFull: string
  explanation?: string
  answerAudioKey: string
}

/**
 * The ordering form: tap the lines in the order the program prints them, and
 * tap one again to take it back out. Nothing says how many of them print, since
 * that is most of the answer on a question about what runs.
 */
function OrderingQuestion({
  question,
  items,
  onGraded,
  reducedMotion,
}: {
  question: SessionQuestion
  items: string[]
  onGraded: (result: Result) => Promise<void>
  reducedMotion: boolean
}) {
  const [chosen, setChosen] = useState<number[]>([])
  const [hintsShown, setHintsShown] = useState(0)
  const [verdict, setVerdict] = useState<OrderingVerdict | null>(null)
  const [busy, setBusy] = useState(false)

  function toggle(index: number) {
    if (verdict !== null || busy) return
    setChosen((current) =>
      current.includes(index) ? current.filter((at) => at !== index) : [...current, index],
    )
  }

  async function submit() {
    if (chosen.length === 0) return
    setBusy(true)
    try {
      setVerdict(await answerOrderingAction(question.topicSlug, question.id, chosen, hintsShown))
    } finally {
      setBusy(false)
    }
  }

  function toneFor(index: number): string {
    if (!verdict) {
      return chosen.includes(index)
        ? 'border-accent bg-accent-dim text-accent'
        : 'border-border hover:border-edge hover:bg-raised'
    }
    if (verdict.correctOrder.includes(index)) return 'border-pass bg-pass/10 text-pass'
    if (chosen.includes(index)) return 'border-fail bg-fail/10 text-fail'
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

      <p className="mt-6 text-sm text-muted">
        Tap the lines in the order they print. Not everything here prints. Tap one again to take it
        back out.
      </p>

      <ul aria-label="Lines to order" className="mt-3 space-y-2">
        {items.map((item, index) => {
          const place = chosen.indexOf(index)

          return (
            <li key={index}>
              <button
                type="button"
                disabled={verdict !== null || busy}
                onClick={() => toggle(index)}
                aria-pressed={place >= 0}
                className={cx(
                  'flex w-full items-start gap-3 rounded-card border p-3.5 text-left text-sm transition-colors',
                  'disabled:cursor-default',
                  toneFor(index),
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md border border-current/30 text-xs font-semibold tabular-nums">
                  {place >= 0 ? place + 1 : ''}
                </span>
                <span className="font-mono leading-6 whitespace-pre-wrap">{item}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {!verdict ? (
        <Button
          variant="primary"
          onClick={submit}
          disabled={chosen.length === 0 || busy}
          className="mt-5"
        >
          {busy ? 'Checking...' : 'Check the order'}
        </Button>
      ) : (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
        >
          {!verdict.correct ? (
            <Card className="mt-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <SectionLabel>You said</SectionLabel>
                  <ol className="mt-2 space-y-1 font-mono text-sm text-fail">
                    {chosen.map((index) => (
                      <li key={index}>{items[index]}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <SectionLabel>It prints</SectionLabel>
                  <ol className="mt-2 space-y-1 font-mono text-sm text-pass">
                    {verdict.correctOrder.map((index) => (
                      <li key={index}>{items[index]}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ) : null}

          <AnswerCard
            answerInFull={verdict.answerInFull}
            explanation={verdict.explanation}
            answerAudioKey={verdict.answerAudioKey}
            heading={
              <p className={cx('font-medium', verdict.correct ? 'text-pass' : 'text-fail')}>
                {verdict.correct ? 'Correct' : 'Not this time'}
              </p>
            }
          />

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

type Verdict = {
  correct: boolean
  correctOption: number
  answerInFull: string
  explanation?: string
  answerAudioKey: string
}

/**
 * The choice form: pick one, find out immediately, read the full answer, move
 * on. Grading happens on the server, which is also the only place that knows
 * which option is right.
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
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [busy, setBusy] = useState(false)

  async function choose(index: number) {
    if (verdict !== null || busy) return
    setBusy(true)
    setChosen(index)
    try {
      setVerdict(await answerChoiceAction(question.topicSlug, question.id, index))
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
          <AnswerCard
            answerInFull={verdict.answerInFull}
            explanation={verdict.explanation}
            answerAudioKey={verdict.answerAudioKey}
            heading={
              <p className={cx('font-medium', verdict.correct ? 'text-pass' : 'text-fail')}>
                {verdict.correct ? 'Correct' : 'Not this time'}
              </p>
            }
          />

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
  const topicSlug = question?.topicSlug
  const questionId = question?.id

  /**
   * The answer is recorded while the question is being answered, which is the
   * one moment the reader is guaranteed to be busy, so the listen button on the
   * reveal has something behind it the moment it appears.
   *
   * It asks by question rather than by key. The answer's key is not allowed on
   * the page until the answer has been given, so the server is the only side
   * that can turn a question into the words its answer is read from.
   */
  useEffect(() => {
    if (!done && topicSlug && questionId) warmAnswer(topicSlug, questionId)
  }, [done, topicSlug, questionId])

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

          {question.form === 'choice' && question.options ? (
            <ChoiceQuestion
              question={question}
              options={question.options}
              onGraded={advance}
              reducedMotion={reducedMotion}
            />
          ) : question.form === 'ordering' && question.items ? (
            <OrderingQuestion
              question={question}
              items={question.items}
              onGraded={advance}
              reducedMotion={reducedMotion}
            />
          ) : (
            <OpenQuestion question={question} onGraded={advance} reducedMotion={reducedMotion} />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
