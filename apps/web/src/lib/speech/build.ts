import { getTechnology, getTopic, listTechnologies, type Topic } from '@prep/content'
import { cacheDirectory, hasCachedAudio, scriptKey } from './cache'
import { narrate } from './narrate'
import { answerScript, questionScript } from './spoken-question'

/**
 * Recording everything a track can say, ahead of anybody asking for it.
 *
 * Audio is made when it is asked for, which is decision `0029` and is right for
 * a laptop sitting next to the engine. It is wrong for a phone: a device out of
 * reach of the server cannot synthesise anything, so a listen button with no
 * recording behind it is a dead end rather than a wait. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 *
 * So this is bulk preparation, and it is scoped to a track because a track is
 * what somebody downloads before a journey.
 *
 * The work is split in three on purpose, because the reason this exists is that
 * a build was run and nobody could tell afterwards what it had made. Planning
 * says what a track holds, the survey says what of it is on disk, and only the
 * third part spends the engine. That makes "this track is fully recorded" a
 * question the filesystem answers, before the run and again after it, rather
 * than a claim a counter makes.
 */

export type Planned = {
  /** The content address of the script, which is the recording's filename. */
  key: string
  script: string
  /** How a run names this recording in its log. */
  what: string
}

/**
 * Every script the given topics can be listened to through, each one once.
 *
 * Deduplicated by key, because a recording is addressed by its words: two
 * questions that read the same are one file, and counting it twice would report
 * a total the cache can never reach.
 */
export function plannedRecordings(topics: Topic[]): Planned[] {
  const planned = new Map<string, Planned>()

  const add = (script: string, what: string) => {
    const key = scriptKey(script)
    if (!planned.has(key)) planned.set(key, { key, script, what })
  }

  for (const topic of topics) {
    for (const section of topic.narration ?? []) {
      add(section.script, `${topic.slug} ${section.title}`)
    }

    // A question is spoken from the words it already has rather than from a
    // script written for it, which is the opposite of how a lesson is narrated.
    // A question is a sentence somebody asks out loud; a lesson is a document.
    // See docs/decisions/0021-questions-are-spoken-from-built-audio.md.
    for (const question of topic.questions) {
      add(questionScript(question), `${topic.slug}#${question.id} question`)
      add(answerScript(question), `${topic.slug}#${question.id} answer`)
    }
  }

  return [...planned.values()]
}

/** The planned recordings that have no file behind them yet. */
export async function unrecorded(
  planned: Planned[],
  directory = cacheDirectory(),
): Promise<Planned[]> {
  const missing: Planned[] = []

  for (const item of planned) {
    if (!(await hasCachedAudio(item.key, directory))) missing.push(item)
  }

  return missing
}

export type Build = {
  /** Made by this run. */
  recorded: number
  /** Already on disk when the run reached them. */
  already: number
}

/**
 * Records each script in turn, skipping anything already made.
 *
 * One at a time throughout, for the reason warming is: the engine is a single
 * container doing real work, and a track arriving at once would only make it
 * slower.
 *
 * Nothing is caught here. The one error worth expecting is the engine going
 * away, and every recording after it would fail the same way, so stopping is
 * the honest outcome. What is already on disk stays, so the next run carries on
 * from there.
 */
export async function buildRecordings(
  planned: Planned[],
  onRecorded?: (item: Planned, done: number, total: number) => void,
): Promise<Build> {
  let recorded = 0
  let already = 0

  for (const item of planned) {
    const { source } = await narrate(item.script)

    if (source === 'cache') {
      already += 1
      continue
    }

    recorded += 1
    onRecorded?.(item, recorded, planned.length)
  }

  return { recorded, already }
}

/**
 * The topics a target names: a whole track, or one topic within one.
 *
 * Both forms exist because both are real jobs. A track is what a device
 * downloads and what this command was widened for; a topic is what somebody
 * records after editing one lesson.
 */
export async function topicsIn(target: string): Promise<Topic[]> {
  // Emptied of blanks first, so `javascript/` means the track. Completing a
  // directory name in a shell leaves that slash there.
  const [technology, directory] = target.split('/').filter(Boolean)

  if (!technology || !listTechnologies().includes(technology)) {
    throw new Error(
      `no track called "${target}". Name a track, as in javascript, or one topic in it, as in javascript/closures`,
    )
  }

  if (directory === undefined) return (await getTechnology(technology)).topics

  const topic = await getTopic(technology, directory)
  if (!topic) throw new Error(`no topic called "${target}" in the ${technology} track`)

  return [topic]
}
