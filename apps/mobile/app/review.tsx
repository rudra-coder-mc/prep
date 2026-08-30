import { randomUUID } from 'expo-crypto'
import { Redirect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { RESULT_LABELS, TIER_LABELS, type Result } from '@prep/core'
import { readSchedule } from '../src/db/schedule'
import type { Database } from '../src/db/sqlite'
import {
  answerChoice,
  answerOrdering,
  revealAnswer,
  selfGrade,
  type ChoiceOutcome,
  type OrderingOutcome,
  type Revealed,
} from '../src/review/answer'
import { buildReviewQueue, type QueuedItem } from '../src/review/queue'
import { useApp } from '../src/ui/app-state'
import { Button, Card, Heading, Muted, Problem, Waiting } from '../src/ui/components'
import { Listen } from '../src/ui/listen'
import { colors, radius, space } from '../src/ui/theme'

/**
 * The day's review, run entirely from what the device holds.
 *
 * Nothing here reaches the network. The queue comes from the archive and the
 * ladder rows beside it, the answer is graded by the same @prep/core functions
 * the server runs, and the attempt waits in SQLite for a sync. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 *
 * The one part of the web's guarantee that survives offline is the order of
 * events: the answer in full is on this device the whole time, and it is not
 * rendered until the question has been answered.
 *
 * The prompt can be listened to when this track's audio has been downloaded,
 * which is the track screen's job. There is no control at all when it has not.
 */

const RESULTS: Result[] = ['passed', 'weak', 'failed']
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const RESULT_COLOURS: Record<Result, string> = {
  passed: colors.pass,
  weak: colors.weak,
  failed: colors.fail,
}

type Tally = Record<Result, number>

export default function ReviewScreen() {
  const app = useApp()
  const router = useRouter()

  const [queue, setQueue] = useState<QueuedItem[] | null>(null)
  const [position, setPosition] = useState(0)
  const [tally, setTally] = useState<Tally>({ passed: 0, weak: 0, failed: 0 })
  const [problem, setProblem] = useState<string | null>(null)
  const scroller = useRef<ScrollView>(null)

  const { content, db, files } = app

  useEffect(() => {
    let cancelled = false
    if (!content || !db) return

    void (async () => {
      const { items } = buildReviewQueue(content, await readSchedule(db), new Date())
      if (!cancelled) setQueue(items)
    })()

    return () => {
      cancelled = true
    }
  }, [content, db])

  const advance = useCallback((result: Result) => {
    setTally((current) => ({ ...current, [result]: current[result] + 1 }))
    setPosition((current) => current + 1)
    setProblem(null)
    // The answer card leaves the page scrolled to the bottom, and the next
    // question renders at the top of it.
    scroller.current?.scrollTo({ y: 0, animated: false })
  }, [])

  if (app.status === 'starting') return <Waiting label="Opening what this device holds" />
  if (app.status === 'signed-out') return <Redirect href="/sign-in" />
  if (!content) return <Redirect href="/" />
  if (!db || !queue) return <Waiting label="Building today's queue" />

  const item = queue[position]

  if (!item) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Card>
          <Heading>{queue.length === 0 ? 'Nothing due' : 'Session complete'}</Heading>
          <Muted>
            {queue.length === 0
              ? 'Mark a topic learned to put its questions into recall.'
              : `${queue.length} ${queue.length === 1 ? 'question' : 'questions'} recorded on this device, waiting for a sync.`}
          </Muted>
          {queue.length > 0 ? (
            <View style={styles.tally}>
              {RESULTS.map((result) => (
                <View key={result}>
                  <Text style={styles.tallyLabel}>{RESULT_LABELS[result]}</Text>
                  <Text style={[styles.tallyCount, { color: RESULT_COLOURS[result] }]}>
                    {tally[result]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>
            <Button label="Done" onPress={() => router.replace('/')} />
          </View>
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView ref={scroller} contentContainerStyle={styles.page}>
      <View style={styles.progress}>
        <Text style={styles.position}>
          {position + 1} of {queue.length}
        </Text>
        <Text style={styles.topic} numberOfLines={1}>
          {item.topicTitle}
        </Text>
      </View>
      <View style={styles.bar}>
        {queue.map((entry, index) => (
          <View
            key={entry.key}
            style={[
              styles.segment,
              index < position && styles.segmentDone,
              index === position && styles.segmentHere,
            ]}
          />
        ))}
      </View>

      {problem ? <Problem>{problem}</Problem> : null}

      <View style={styles.chips}>
        <Chip>{item.question.type}</Chip>
        <Chip>{TIER_LABELS[item.question.tier]}</Chip>
      </View>
      <Text style={styles.prompt}>{item.question.prompt}</Text>
      <Listen key={item.key} files={files} audioKey={item.question.promptAudioKey} />
      {item.question.code ? <Text style={styles.code}>{item.question.code}</Text> : null}

      <Question
        key={item.key}
        item={item}
        db={db}
        onGraded={advance}
        onProblem={setProblem}
        makeId={randomUUID}
      />
    </ScrollView>
  )
}

/** The forms, chosen by the question rather than by the screen. */
function Question(props: FormProps) {
  const { item } = props

  if (item.question.form === 'choice' && item.question.options) {
    return <ChoiceQuestion {...props} options={item.question.options} />
  }
  if (item.question.form === 'ordering' && item.question.items) {
    return <OrderingQuestion {...props} items={item.question.items} />
  }
  return <OpenQuestion {...props} />
}

function Chip({ children }: { children: string }) {
  return <Text style={styles.chip}>{children}</Text>
}

function Hints({ hints, shown, onShow }: { hints: string[]; shown: number; onShow: () => void }) {
  if (hints.length === 0) return null

  return (
    <View style={styles.hints}>
      {hints.slice(0, shown).map((hint, index) => (
        <Text key={index} style={styles.hint}>
          Hint {index + 1}: {hint}
        </Text>
      ))}
      {shown < hints.length ? (
        <Pressable accessibilityRole="button" onPress={onShow}>
          <Text style={styles.hintLink}>Show a hint</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** The answer in full, and the explanation when there is one to add. */
function AnswerCard({ revealed, heading }: { revealed: Revealed; heading: ReactNode }) {
  return (
    <Card>
      {heading}
      <Text style={styles.answer}>{revealed.answerInFull}</Text>
      {revealed.explanation ? (
        <>
          <Text style={styles.label}>Worth adding</Text>
          <Text style={styles.explanation}>{revealed.explanation}</Text>
        </>
      ) : null}
    </Card>
  )
}

function Outcome({ correct }: { correct: boolean }) {
  return (
    <Text style={[styles.outcome, { color: correct ? colors.pass : colors.fail }]}>
      {correct ? 'Correct' : 'Not this time'}
    </Text>
  )
}

type FormProps = {
  item: QueuedItem
  db: Database
  onGraded: (result: Result) => void
  onProblem: (problem: string | null) => void
  makeId: () => string
}

/** A ServerError is an Error, and its message is already the useful sentence. */
function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The choice form: pick one, find out immediately, read the full answer, move
 * on. The correct option is on the device, and nothing renders it until the
 * attempt has been written.
 */
function ChoiceQuestion({
  item,
  options,
  db,
  onGraded,
  onProblem,
  makeId,
}: FormProps & {
  options: string[]
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<ChoiceOutcome | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [busy, setBusy] = useState(false)

  async function choose(index: number) {
    if (outcome || busy) return

    setBusy(true)
    setChosen(index)
    onProblem(null)
    try {
      setOutcome(await answerChoice(db, item, index, { id: makeId(), now: new Date() }))
    } catch (error) {
      // Nothing was recorded, so let the choice be made again rather than
      // leaving an option selected that means nothing.
      setChosen(null)
      onProblem(describe(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!outcome ? (
        <Hints
          hints={item.question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
        />
      ) : null}

      <View style={styles.options} accessibilityLabel="Answer options">
        {options.map((option, index) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ disabled: outcome !== null || busy, selected: chosen === index }}
            disabled={outcome !== null || busy}
            onPress={() => void choose(index)}
            style={[styles.option, optionTone(outcome?.correctOption, chosen, index)]}
          >
            <Text style={styles.optionLetter}>{OPTION_LETTERS[index] ?? index + 1}</Text>
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {outcome ? (
        <>
          <AnswerCard revealed={outcome} heading={<Outcome correct={outcome.correct} />} />
          <NextQuestion dueAt={outcome.dueAt} onPress={() => onGraded(outcome.result)} />
        </>
      ) : null}
    </>
  )
}

function optionTone(correctOption: number | undefined, chosen: number | null, index: number) {
  if (correctOption === undefined) return chosen === index ? styles.optionChosen : undefined
  if (index === correctOption) return styles.optionRight
  if (index === chosen) return styles.optionWrong
  return styles.optionSpent
}

/**
 * The ordering form: tap the lines in the order the program prints them, and
 * tap one again to take it back out. Nothing says how many of them print, since
 * that is most of the answer on a question about what runs.
 */
function OrderingQuestion({
  item,
  items,
  db,
  onGraded,
  onProblem,
  makeId,
}: FormProps & {
  items: string[]
}) {
  const [chosen, setChosen] = useState<number[]>([])
  const [outcome, setOutcome] = useState<OrderingOutcome | null>(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [busy, setBusy] = useState(false)

  function toggle(index: number) {
    if (outcome || busy) return
    setChosen((current) =>
      current.includes(index) ? current.filter((at) => at !== index) : [...current, index],
    )
  }

  async function submit() {
    if (chosen.length === 0) return

    setBusy(true)
    onProblem(null)
    try {
      setOutcome(
        await answerOrdering(db, item, chosen, hintsShown, { id: makeId(), now: new Date() }),
      )
    } catch (error) {
      onProblem(describe(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!outcome ? (
        <Hints
          hints={item.question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
        />
      ) : null}

      <Muted>
        Tap the lines in the order they print. Not everything here prints. Tap one again to take it
        back out.
      </Muted>

      <View style={styles.options} accessibilityLabel="Lines to order">
        {items.map((line, index) => {
          const place = chosen.indexOf(index)

          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityState={{ disabled: outcome !== null || busy, selected: place >= 0 }}
              disabled={outcome !== null || busy}
              onPress={() => toggle(index)}
              style={[styles.option, lineTone(outcome?.correctOrder, chosen, index)]}
            >
              <Text style={styles.optionLetter}>{place >= 0 ? place + 1 : ''}</Text>
              <Text style={[styles.optionText, styles.mono]}>{line}</Text>
            </Pressable>
          )
        })}
      </View>

      {!outcome ? (
        <Button
          label="Check the order"
          onPress={() => void submit()}
          busy={busy}
          disabled={chosen.length === 0}
        />
      ) : (
        <>
          {!outcome.correct ? (
            <Card>
              <Text style={styles.label}>You said</Text>
              {chosen.map((index) => (
                <Text key={index} style={[styles.mono, styles.said]}>
                  {items[index]}
                </Text>
              ))}
              <Text style={[styles.label, styles.spaced]}>It prints</Text>
              {outcome.correctOrder.map((index) => (
                <Text key={index} style={[styles.mono, styles.printed]}>
                  {items[index]}
                </Text>
              ))}
            </Card>
          ) : null}
          <AnswerCard revealed={outcome} heading={<Outcome correct={outcome.correct} />} />
          <NextQuestion dueAt={outcome.dueAt} onPress={() => onGraded(outcome.result)} />
        </>
      )}
    </>
  )
}

function lineTone(correctOrder: number[] | undefined, chosen: number[], index: number) {
  if (correctOrder === undefined) return chosen.includes(index) ? styles.optionChosen : undefined
  if (correctOrder.includes(index)) return styles.optionRight
  if (chosen.includes(index)) return styles.optionWrong
  return styles.optionSpent
}

/**
 * The open form: answer it out loud, reveal, then mark yourself. The only form
 * nothing can grade, so it is the only one that asks.
 */
function OpenQuestion({ item, db, onGraded, onProblem, makeId }: FormProps) {
  const [hintsShown, setHintsShown] = useState(0)
  const [revealed, setRevealed] = useState<Revealed | null>(null)
  const [busy, setBusy] = useState(false)

  async function grade(result: Result) {
    setBusy(true)
    onProblem(null)
    try {
      await selfGrade(db, item, result, hintsShown, { id: makeId(), now: new Date() })
      onGraded(result)
    } catch (error) {
      onProblem(describe(error))
    } finally {
      setBusy(false)
    }
  }

  if (!revealed) {
    return (
      <>
        <Hints
          hints={item.question.hints}
          shown={hintsShown}
          onShow={() => setHintsShown(hintsShown + 1)}
        />
        <Muted>
          Answer it out loud, as you would in the room. Then reveal and mark yourself against what
          you actually said.
        </Muted>
        <Button label="Reveal the answer" onPress={() => setRevealed(revealAnswer(item))} />
      </>
    )
  }

  return (
    <>
      <AnswerCard revealed={revealed} heading={<Text style={styles.label}>The answer</Text>} />
      <Muted>How much of that did you say?</Muted>
      <View style={styles.grades}>
        {RESULTS.map((result) => (
          <Pressable
            key={result}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => void grade(result)}
            style={[styles.grade, { borderColor: RESULT_COLOURS[result] }]}
          >
            <Text style={[styles.gradeText, { color: RESULT_COLOURS[result] }]}>
              {RESULT_LABELS[result]}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}

function NextQuestion({ dueAt, onPress }: { dueAt: Date; onPress: () => void }) {
  const today = dueAt.toDateString() === new Date().toDateString()

  return (
    <View style={styles.next}>
      <Muted>{today ? 'Back later today' : `Back on ${dueAt.toDateString()}`}</Muted>
      <Button label="Next question" onPress={onPress} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.lg },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  position: { color: colors.muted, fontSize: 14 },
  topic: { color: colors.faint, fontSize: 12, flex: 1, textAlign: 'right' },
  bar: { flexDirection: 'row', gap: 3, marginTop: -space.md },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.raised },
  segmentDone: { backgroundColor: colors.accent },
  segmentHere: { backgroundColor: colors.edge },
  chips: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chip: {
    color: colors.muted,
    fontSize: 12,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  prompt: { color: colors.fg, fontSize: 19, fontWeight: '500', lineHeight: 28 },
  code: {
    color: colors.fg,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
  },
  hints: { gap: space.sm },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    borderLeftColor: colors.weak,
    borderLeftWidth: 3,
    paddingLeft: space.md,
  },
  hintLink: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
    minHeight: 48,
  },
  optionChosen: { borderColor: colors.accent, backgroundColor: colors.raised },
  optionRight: { borderColor: colors.pass },
  optionWrong: { borderColor: colors.fail },
  optionSpent: { opacity: 0.6 },
  optionLetter: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 16,
    textAlign: 'center',
  },
  optionText: { color: colors.fg, fontSize: 15, lineHeight: 22, flex: 1 },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  said: { color: colors.fail },
  printed: { color: colors.pass },
  spaced: { marginTop: space.md },
  label: { color: colors.faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  answer: { color: colors.fg, fontSize: 15, lineHeight: 23 },
  explanation: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  outcome: { fontSize: 16, fontWeight: '600' },
  grades: { flexDirection: 'row', gap: space.sm },
  grade: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: space.md,
    minHeight: 48,
  },
  gradeText: { fontSize: 15, fontWeight: '600' },
  next: { gap: space.sm },
  tally: { flexDirection: 'row', gap: space.xl, marginTop: space.sm },
  tallyLabel: { color: colors.faint, fontSize: 12 },
  tallyCount: { fontSize: 20, fontWeight: '600' },
  actions: { marginTop: space.sm },
})
