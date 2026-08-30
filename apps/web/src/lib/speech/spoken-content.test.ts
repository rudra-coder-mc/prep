// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { getTopic } from '@prep/content'
import type { NarrationSection, Question } from '@prep/core'
import { scriptKey } from './cache'
import { answerScriptFor, scriptFor } from './spoken-content'
import { answerAudioKey, answerScript, questionAudioKey, questionScript } from './spoken-question'

/**
 * Against the real `content/`, because what this module has to get right is that
 * a key a page hands the browser resolves back to the words behind it. A fixture
 * would prove the map works and not that the two sides agree.
 */
let section: NarrationSection
let question: Question

beforeAll(async () => {
  const topic = await getTopic('javascript', 'closures')
  const first = topic?.narration?.[0]
  const asked = topic?.questions[0]

  if (!first || !asked) throw new Error('this test needs a narrated topic with questions in it')

  section = first
  question = asked
})

describe('scriptFor', () => {
  it('resolves a narration section key back to its script', async () => {
    expect(await scriptFor(scriptKey(section.script))).toBe(section.script)
  })

  it('resolves a question key, so the script never has to come from the browser', async () => {
    expect(await scriptFor(questionAudioKey(question))).toBe(questionScript(question))
  })

  it('resolves an answer key, which reaches the browser only with the reveal', async () => {
    expect(await scriptFor(answerAudioKey(question))).toBe(answerScript(question))
  })

  it('has nothing for a key no script in content hashes to', async () => {
    expect(await scriptFor('f'.repeat(64))).toBeNull()
  })
})

describe('answerScriptFor', () => {
  it('resolves the answer from the question it belongs to, since its key cannot travel', async () => {
    expect(await answerScriptFor('javascript/closures', question.id)).toBe(answerScript(question))
  })

  it('has nothing for a question that is not in the topic', async () => {
    expect(await answerScriptFor('javascript/closures', 'no-such-question')).toBeNull()
  })

  it('has nothing for a slug that names no topic, malformed or not', async () => {
    expect(await answerScriptFor('javascript/no-such-topic', question.id)).toBeNull()
    expect(await answerScriptFor('closures', question.id)).toBeNull()
  })
})
