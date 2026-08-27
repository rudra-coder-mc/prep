/**
 * Asking the server to make a recording before anybody presses play.
 *
 * Synthesis is the better part of a minute for a lesson section, so the wait has
 * to be spent somewhere the listener is not watching a button. These fire at the
 * two moments decision `0029` names: opening a topic, and showing a question the
 * reader is about to answer.
 *
 * Nothing comes back and nothing is awaited. A warm that fails costs a recording
 * that has to be made later, which is what would have happened anyway, and the
 * play that finds it missing is the one that reports it.
 */
type Warmable = { narration: string } | { answer: { topic: string; question: string } }

function warm(what: Warmable): void {
  void fetch('/api/speech/warm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(what),
  }).catch(() => undefined)
}

/** A recording the browser already holds the key of: a lesson section. */
export function warmNarration(key: string): void {
  warm({ narration: key })
}

/**
 * A question's answer, named by the question rather than by its key. The key
 * travels with the reveal and not before, so this is the only way to have the
 * answer ready while the question is still being answered.
 */
export function warmAnswer(topic: string, question: string): void {
  warm({ answer: { topic, question } })
}
