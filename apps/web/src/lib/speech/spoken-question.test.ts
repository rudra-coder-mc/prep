import { describe, expect, it } from 'vitest'
import type { Question } from '@prep/core'
import { answerScript, questionScript, speakable } from './spoken-question'

const base: Question = {
  id: 'q',
  type: 'concept',
  form: 'open',
  tier: 'swe-1',
  prompt: 'What is a closure?',
  answerInFull: 'A function plus the scope it was defined in.',
  explanation: 'The binding is shared.',
  hints: [],
  tags: [],
}

describe('speakable', () => {
  it('leaves prose alone apart from collapsing the way it was laid out', () => {
    expect(speakable('One sentence.\nAnother one.')).toEqual({
      script: 'One sentence. Another one.',
      hasCode: false,
    })
  })

  it('drops indented code and says so, rather than reading punctuation aloud', () => {
    const written = `Use let instead:

  for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 0)
  }

That gives a binding per iteration.`

    expect(speakable(written)).toEqual({
      script: 'Use let instead: That gives a binding per iteration.',
      hasCode: true,
    })
  })

  it('reads a bullet list as sentences, since a listener cannot see the bullets', () => {
    expect(speakable('- It captures the variable.\n- Not the value.').script).toBe(
      'It captures the variable. Not the value.',
    )
  })

  it('does not add a second full stop to a bullet that already ends in one', () => {
    expect(speakable('- One.').script).toBe('One.')
  })

  it('ends a bullet that has no punctuation of its own', () => {
    expect(speakable('- One\n- Two').script).toBe('One. Two.')
  })

  it('is empty when there was nothing but code', () => {
    expect(speakable('  const a = 1')).toEqual({ script: '', hasCode: true })
  })

  it('drops the whole block, including the braces that sit in column one', () => {
    const written = `Like this:

function isEmpty(value) {
  return value == null
}

And that is all.`

    expect(speakable(written)).toEqual({
      script: 'Like this: And that is all.',
      hasCode: true,
    })
  })
})

describe('questionScript', () => {
  it('is the prompt for a question with nothing else to say', () => {
    expect(questionScript(base)).toBe('What is a closure?')
  })

  it('says the code is on screen rather than trying to read it', () => {
    expect(questionScript({ ...base, type: 'output', code: 'console.log(1)' })).toBe(
      'What is a closure? The code for this is on screen.',
    )
  })

  it('reads the options in order and letters them, so it can be answered by ear', () => {
    const script = questionScript({
      ...base,
      form: 'choice',
      options: ['The binding', 'The value'],
      correctOption: 0,
    })

    expect(script).toBe('What is a closure? Your choices are. A. The binding. B. The value.')
  })

  /**
   * The pool is safe to read out because its order is authored rather than the
   * printing order, so hearing it gives nothing away.
   */
  it('reads an ordering pool in the order the screen shows it', () => {
    const script = questionScript({
      ...base,
      form: 'ordering',
      prompt: 'What does this print, in order?',
      items: ['three', 'one', 'caught', 'two'],
      correctOrder: [1, 3, 0],
    })

    expect(script).toBe(
      'What does this print, in order? The lines to put in order are. A. three. B. one. C. caught. D. two.',
    )
  })
})

describe('answerScript', () => {
  it('reads the answer in full and then the explanation', () => {
    expect(answerScript(base)).toBe(
      'The answer. A function plus the scope it was defined in. Why this is the answer. The binding is shared.',
    )
  })

  it('names the correct option before reading the answer in full', () => {
    const script = answerScript({
      ...base,
      form: 'choice',
      options: ['The binding', 'The value'],
      correctOption: 1,
    })

    expect(script).toBe(
      'The answer is B. The value. A function plus the scope it was defined in. Why this is the answer. The binding is shared.',
    )
  })

  it('stops after the answer when there is no explanation to add', () => {
    expect(answerScript({ ...base, explanation: undefined })).toBe(
      'The answer. A function plus the scope it was defined in.',
    )
  })

  it('mentions the code it had to leave out of the answer', () => {
    const script = answerScript({
      ...base,
      answerInFull: 'Do this:\n\n  const a = 1\n\nAnd that is it.',
    })

    expect(script).toBe(
      'The answer. Do this: And that is it. The code for this is on screen. Why this is the answer. The binding is shared.',
    )
  })
})
