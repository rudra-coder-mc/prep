import { markNarratedSection } from '@/components/speech/narrated-section'
import { LESSON_CONTROLS, type LessonMessage, type LessonTheme } from './bridge'

/**
 * The page's end of the bridge. ./bridge.ts is the protocol and the app's end.
 *
 * The marking is the web app's own `markNarratedSection` rather than a copy of
 * it, for the reason the page renders through the web app's own component map:
 * the lesson follows the voice the same way on both surfaces because both run
 * the same walk. See docs/decisions/0018-the-lesson-follows-the-voice.md.
 */

type Controls = {
  section(slug: string | null): void
  theme(theme: LessonTheme): void
}

declare global {
  interface Window {
    /** The app's end, which only a page inside the WebView has. */
    ReactNativeWebView?: { postMessage(message: string): void }
    /** This end, hung on the window for the app to call into. */
    prepLesson?: Controls
  }
}

/** A property the page could have declared itself, and nothing else. */
const CUSTOM_PROPERTY = /^--[a-z0-9-]+$/

/**
 * Opens the bridge, if there is an app on the other side of it.
 *
 * A lesson page opened in a browser is left exactly as it was: no controls on
 * the window, and links that follow themselves. Intercepting them there would
 * make every link dead and nothing would take the tap instead.
 */
export function openLessonBridge(lesson: HTMLElement): void {
  const app = window.ReactNativeWebView
  if (!app) return

  const post = (message: LessonMessage) => app.postMessage(JSON.stringify(message))

  window[LESSON_CONTROLS] = {
    section(slug) {
      markNarratedSection(lesson, slug)
      lesson.setAttribute('data-narrated-lesson', String(slug !== null))
      if (slug === null) return

      // Marked first, then scrolled to, so the reader arrives at a section that
      // is already lit rather than watching it light up after it settles.
      document.getElementById(slug)?.scrollIntoView({ block: 'start' })
    },

    theme(theme) {
      const root = document.documentElement.style
      for (const [property, value] of Object.entries(theme)) {
        if (CUSTOM_PROPERTY.test(property)) root.setProperty(property, value)
      }
    },
  }

  // On the lesson rather than on the document: the page is the lesson and
  // nothing else, so this catches every link there is and stops listening when
  // the lesson does.
  lesson.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null
    const href = link?.getAttribute('href')

    // A link to a heading in this lesson is the page's own business: the
    // WebView scrolls to it and the app never hears about it.
    if (!href || href.startsWith('#')) return

    // Everything else leaves the lesson, and leaving it is navigation, which
    // is native. The WebView must not follow the link itself.
    event.preventDefault()
    post({ type: 'link', href })
  })

  post({ type: 'ready' })
}
