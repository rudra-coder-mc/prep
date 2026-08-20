import type { Question } from '@/content/schema'
import { scriptKey } from './cache'
import { normaliseScript } from './script'

/**
 * Turning a written question into something worth hearing.
 *
 * Decision 0016 said a narration is separate text, written to be heard, because
 * a lesson read verbatim sounds like a document being read. A question is the
 * other case: it is already a sentence somebody asks out loud, so it can be
 * spoken as written. What it cannot do is read its code, and every question form
 * carries some.
 *
 * So the rule here is narrow. Prose is spoken as written, code is left on the
 * screen where it belongs, and the script says that it is there rather than
 * leaving a silence the listener has to interpret.
 */

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/** Said once when something was left out, so the silence is explained. */
const CODE_IS_ON_SCREEN = 'The code for this is on screen.'

export type Speakable = {
  script: string
  /** Whether code was dropped, which is what the caller says something about. */
  hasCode: boolean
}

/**
 * Code is detected a paragraph at a time rather than a line at a time.
 *
 * Every code sample inside an answer or an explanation in `content/` is indented
 * and separated by blank lines. Judging each line on its own indentation looks
 * like it would work and does not: the opening `function isEmpty(value) {` and
 * the closing brace sit in column one, so a line-by-line rule keeps them and the
 * script reads "function isEmpty value" out loud.
 *
 * A blank line separated paragraph containing any indented line is therefore all
 * code. That also throws away a line of prose written hard against a sample, and
 * losing a sentence is a better failure than speaking a brace.
 */
function isCode(paragraph: string[]): boolean {
  return paragraph.some((line) => /^\s{2,}\S/.test(line))
}

/** Blank line separated runs, with the blank lines dropped. */
function paragraphs(text: string): string[][] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').filter((line) => line.trim().length > 0))
    .filter((block) => block.length > 0)
}

/**
 * Piper phrases on punctuation, so a fragment with none runs straight into
 * whatever follows it. An option read as "A. The binding B. The value" is one
 * breath and cannot be answered by ear; ending each one is what puts the pause
 * between them.
 */
function ended(text: string): string {
  if (text.length === 0) return text
  return /[.!?:]$/.test(text) ? text : `${text}.`
}

/**
 * A bullet is a shape on a page. Spoken, it has to be a sentence, or the list
 * runs together into one long clause with no pauses in it.
 */
function unbullet(line: string): string {
  const item = line.replace(/^\s*[-*]\s+/, '')
  return item === line ? line : ended(item)
}

export function speakable(text: string): Speakable {
  const blocks = paragraphs(text)
  const prose = blocks.filter((block) => !isCode(block))

  return {
    script: normaliseScript(prose.flat().map(unbullet).join(' ')),
    hasCode: prose.length !== blocks.length,
  }
}

/** Joins the parts of a script, dropping the ones that had nothing to say. */
function sentences(...parts: (string | null)[]): string {
  return parts.filter((part) => part !== null && part.length > 0).join(' ')
}

/**
 * What the play button on a question reads: the prompt, and for a multiple
 * choice question every option in turn, so it can be answered without looking.
 *
 * It deliberately holds nothing that would give the answer away. This script is
 * built into audio and its key is sent to the browser with the question, so
 * anything in here is readable before the reader has answered.
 */
export function questionScript(question: Question): string {
  const prompt = speakable(question.prompt)

  return sentences(
    prompt.script,
    question.code !== undefined || prompt.hasCode ? CODE_IS_ON_SCREEN : null,
    lettered(question),
  )
}

/**
 * The options of a choice question, or the pool of an ordering one, read in the
 * order the screen shows them.
 *
 * Both are read out for the same reason: a question you can only answer by
 * looking is a question you cannot answer while walking. An ordering question's
 * pool is safe to read because the display order is authored rather than the
 * printing order, so hearing it gives nothing away.
 */
function lettered(question: Question): string | null {
  const entries =
    question.form === 'choice'
      ? question.options
      : question.form === 'ordering'
        ? question.items
        : undefined

  if (entries === undefined || entries.length === 0) return null

  const lead = question.form === 'choice' ? 'Your choices are.' : 'The lines to put in order are.'

  return sentences(
    lead,
    ...entries.map(
      (entry, index) => `${OPTION_LETTERS[index] ?? index + 1}. ${ended(speakable(entry).script)}`,
    ),
  )
}

/**
 * What the play button on the revealed answer reads.
 *
 * Its key travels back with the reveal rather than with the question, for the
 * same reason the answer itself does: nothing that decides the answer is allowed
 * to reach the browser before it has been given.
 */
export function answerScript(question: Question): string {
  const answer = spokenAnswer(question)
  const explanation = question.explanation ? speakable(question.explanation) : null

  return sentences(
    answer.script,
    answer.hasCode ? CODE_IS_ON_SCREEN : null,
    // An explanation only says what the answer left out, and plenty of questions
    // leave nothing out. Announcing a reason and then saying nothing is worse
    // than moving on.
    explanation ? 'Why this is the answer.' : null,
    explanation ? explanation.script : null,
    explanation?.hasCode ? CODE_IS_ON_SCREEN : null,
  )
}

/**
 * The lead-in differs by form, because "the answer is B" means nothing on a
 * question with no options and "the answer" is a thin thing to say when the
 * option has just been read out. Both then run into the answer in full.
 */
function spokenAnswer(question: Question): Speakable {
  const full = speakable(question.answerInFull)

  if (question.form === 'choice') {
    const letter = OPTION_LETTERS[question.correctOption ?? 0] ?? ''
    const option = speakable(question.options?.[question.correctOption ?? 0] ?? '')
    return {
      script: sentences(`The answer is ${letter}.`, ended(option.script), full.script),
      hasCode: full.hasCode,
    }
  }

  return { script: sentences('The answer.', full.script), hasCode: full.hasCode }
}

/**
 * Where a question's two recordings live.
 *
 * Both are content addressed like every other recording, so editing a prompt or
 * an explanation is a new key rather than stale audio, and the next build makes
 * it. Pages compute these on the server and hand the browser the key alone: the
 * answer's key is not a thing the answer can be recovered from, but it still
 * travels with the reveal rather than with the question, so nothing about the
 * answer is on the page before it has been given.
 */
export function questionAudioKey(question: Question): string {
  return scriptKey(questionScript(question))
}

export function answerAudioKey(question: Question): string {
  return scriptKey(answerScript(question))
}
