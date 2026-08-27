import { getAllTopics, getTopic } from '@/content/loader'
import { scriptKey } from './cache'
import { answerScript, questionScript } from './spoken-question'

/**
 * Every script in `content/` that can be spoken, addressed the way its recording
 * is.
 *
 * This is what lets a request for audio carry a key and nothing else. The
 * browser is handed the hash of the words, never the words, and the server turns
 * it back into a script when there is no recording behind it yet. A question's
 * answer is the reason that matters: its script would give the answer away, so
 * it cannot travel with the question and cannot be posted back to be
 * synthesised. See docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
 */

/** Held as a promise so requests arriving together share one walk of content. */
let index: Promise<Map<string, string>> | null = null

async function build(): Promise<Map<string, string>> {
  const scripts = new Map<string, string>()

  for (const topic of await getAllTopics()) {
    for (const section of topic.narration ?? []) {
      scripts.set(scriptKey(section.script), section.script)
    }

    for (const question of topic.questions) {
      const prompt = questionScript(question)
      const answer = answerScript(question)
      scripts.set(scriptKey(prompt), prompt)
      scripts.set(scriptKey(answer), answer)
    }
  }

  return scripts
}

/** The script a key addresses, or null when nothing in `content/` hashes to it. */
export async function scriptFor(key: string): Promise<string | null> {
  const known = await (index ??= build())
  const found = known.get(key)
  if (found !== undefined) return found

  // A miss is either a key from nowhere or a script edited since this process
  // started, and only one walk of content tells them apart. Content is baked
  // into the image, so in the stack this is authoring behaviour that costs
  // nothing in normal use.
  const rebuilt = await (index = build())
  return rebuilt.get(key) ?? null
}

/**
 * Every key `content/` currently hashes to.
 *
 * Prune's keep list. It is the same walk `scriptFor` does, read the other way
 * round: that asks whether one key is still spoken, and this asks which ones
 * are.
 */
export async function spokenScriptKeys(): Promise<Set<string>> {
  return new Set((await (index ??= build())).keys())
}

/**
 * A question's answer script, addressed by the question rather than by a key.
 *
 * Warming needs this because the answer is the one recording the browser cannot
 * name. Its key travels with the reveal, so a page that wants the answer ready
 * before it has been given has to ask for it by the question it belongs to, and
 * the server does the resolving. Null when there is no such topic or question.
 */
export async function answerScriptFor(
  topicSlug: string,
  questionId: string,
): Promise<string | null> {
  const [technology, directory] = topicSlug.split('/')
  if (!technology || !directory) return null

  const topic = await getTopic(technology, directory)
  const question = topic?.questions.find((candidate) => candidate.id === questionId)

  return question ? answerScript(question) : null
}
