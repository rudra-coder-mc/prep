import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseLessonMessage, sectionScript, themeScript, type LessonMessage } from './bridge'
import { openLessonBridge } from './lesson-bridge'

/**
 * Both ends of the bridge, met in the middle: the page is opened here and driven
 * with the scripts the app injects, so a message either end renames fails here
 * rather than on a phone.
 */

let lesson: HTMLElement
let posted: LessonMessage[]

/** A lesson as the page holds it: a flat run of elements, sections only implied. */
function mount() {
  lesson = document.createElement('main')
  lesson.id = 'lesson'
  lesson.innerHTML = `
    <h2 id="why-this-matters">Why this matters</h2>
    <p>Why it matters.</p>
    <h2 id="truthiness">Truthiness</h2>
    <p>Eight falsy values.</p>
    <p><a href="/topics/javascript/coercion">Coercion</a> covers the rest.</p>
    <p><a href="#why-this-matters">Back to the top</a></p>
    <h2 id="the-interview-angle">The interview angle</h2>
  `
  document.body.replaceChildren(lesson)
}

/** The app on the other side, which is all the page knows about it. */
function attachApp() {
  posted = []
  window.ReactNativeWebView = {
    postMessage: (raw) => {
      const message = parseLessonMessage(raw)
      if (message) posted.push(message)
    },
  }
}

const marked = () =>
  Array.from(lesson.querySelectorAll('[data-narrated]')).map((element) =>
    element.tagName === 'H2' ? element.id : element.textContent?.trim(),
  )

/** What the app does with a script: hand it to the page and evaluate it there. */
const inject = (script: string) => {
  new Function(script)()
}

const click = (selector: string) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  lesson.querySelector(selector)?.dispatchEvent(event)
  return event
}

beforeEach(() => {
  delete window.ReactNativeWebView
  delete window.prepLesson
  mount()
})

describe('openLessonBridge', () => {
  it('leaves a page opened outside the app exactly as it was', () => {
    openLessonBridge(lesson)

    expect(window.prepLesson).toBeUndefined()
    expect(click('a[href="/topics/javascript/coercion"]').defaultPrevented).toBe(false)
  })

  it('says it is ready, so the app knows what to send', () => {
    attachApp()
    openLessonBridge(lesson)

    expect(posted).toEqual([{ type: 'ready' }])
  })

  it('lights up the section the app says the voice is on, and goes to it', () => {
    const scrolled = vi
      .spyOn(window.HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => {})
    attachApp()
    openLessonBridge(lesson)

    inject(sectionScript('truthiness'))

    expect(lesson.getAttribute('data-narrated-lesson')).toBe('true')
    expect(marked()).toEqual([
      'truthiness',
      'Eight falsy values.',
      'Coercion covers the rest.',
      'Back to the top',
    ])
    expect(scrolled.mock.instances[0]).toBe(lesson.querySelector('#truthiness'))
    scrolled.mockRestore()
  })

  it('reads as an ordinary page again once nothing is being read', () => {
    attachApp()
    openLessonBridge(lesson)

    inject(sectionScript('truthiness'))
    inject(sectionScript(null))

    expect(lesson.getAttribute('data-narrated-lesson')).toBe('false')
    expect(marked()).toEqual([])
  })

  it('takes the colours the app drew the screen with', () => {
    attachApp()
    openLessonBridge(lesson)

    inject(themeScript({ '--color-bg': '#0b0e15', 'font-family': 'Comic Sans' }))

    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#0b0e15')
    // The app hands over its palette. Anything else is not a colour and the page
    // keeps its own styling, which is the whole reason a lesson reads the same
    // on both surfaces.
    expect(document.documentElement.style.fontFamily).toBe('')
  })

  it('hands a link that leaves the lesson to the app instead of following it', () => {
    attachApp()
    openLessonBridge(lesson)

    const event = click('a[href="/topics/javascript/coercion"]')

    expect(event.defaultPrevented).toBe(true)
    expect(posted).toEqual([
      { type: 'ready' },
      { type: 'link', href: '/topics/javascript/coercion' },
    ])
  })

  it('leaves a link to a heading in this lesson to the page', () => {
    attachApp()
    openLessonBridge(lesson)

    const event = click('a[href="#why-this-matters"]')

    expect(event.defaultPrevented).toBe(false)
    expect(posted).toEqual([{ type: 'ready' }])
  })
})
