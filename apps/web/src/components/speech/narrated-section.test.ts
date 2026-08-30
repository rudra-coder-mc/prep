import { beforeEach, describe, expect, it } from 'vitest'
import { markNarratedSection, NARRATED } from './narrated-section'

let lesson: HTMLElement

/** A lesson as MDX leaves it: a flat run of elements, sections only implied. */
beforeEach(() => {
  lesson = document.createElement('article')
  lesson.innerHTML = `
    <h2 id="why-this-matters">Why this matters</h2>
    <p>Why it matters.</p>
    <h2 id="truthiness">Truthiness</h2>
    <p>Eight falsy values.</p>
    <pre>the list</pre>
    <h3>A third level heading belongs to the section above it</h3>
    <p>Still truthiness.</p>
    <h2 id="the-interview-angle">The interview angle</h2>
    <p>What to say.</p>
  `
})

const marked = () =>
  Array.from(lesson.querySelectorAll(`[${NARRATED}]`)).map((element) =>
    element.tagName === 'H2' ? element.id : element.textContent?.trim(),
  )

describe('markNarratedSection', () => {
  it('marks the heading and everything under it, up to the next heading', () => {
    markNarratedSection(lesson, 'truthiness')

    expect(marked()).toEqual([
      'truthiness',
      'Eight falsy values.',
      'the list',
      'A third level heading belongs to the section above it',
      'Still truthiness.',
    ])
  })

  it('marks the last section to the end of the lesson', () => {
    markNarratedSection(lesson, 'the-interview-angle')

    expect(marked()).toEqual(['the-interview-angle', 'What to say.'])
  })

  it('moves the marking rather than adding to it', () => {
    markNarratedSection(lesson, 'why-this-matters')
    markNarratedSection(lesson, 'the-interview-angle')

    expect(marked()).toEqual(['the-interview-angle', 'What to say.'])
  })

  it('leaves the lesson unmarked when nothing is being read', () => {
    markNarratedSection(lesson, 'truthiness')
    markNarratedSection(lesson, null)

    expect(marked()).toEqual([])
  })

  it('marks nothing for a heading the lesson does not have', () => {
    markNarratedSection(lesson, 'converting-on-purpose')

    expect(marked()).toEqual([])
  })
})
