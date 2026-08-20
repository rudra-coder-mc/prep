/**
 * Marking which part of a rendered lesson the voice is on.
 *
 * A lesson is MDX: by the time it reaches the page it is a flat run of
 * headings, paragraphs, code blocks and figures, with nothing wrapping a
 * section. So a section is not an element to highlight but a range between two
 * headings, and this walks that range and marks it. The dimming itself is one
 * rule in `globals.css`, keyed on the attribute set here.
 *
 * It works on the DOM rather than on React's children because the lesson is a
 * compiled MDX component: its output cannot be mapped over from the outside
 * without rendering it, and re-rendering a whole lesson every time the voice
 * moves on would be a much worse trade than setting an attribute.
 */
export const NARRATED = 'data-narrated'

/**
 * Marks everything from the heading with this id up to the next heading, and
 * unmarks everything else. A null slug clears the lesson, which is what a
 * reader who has never pressed play, or who has heard the topic out, sees.
 */
export function markNarratedSection(lesson: HTMLElement, slug: string | null): void {
  let section: string | null = null

  for (const element of Array.from(lesson.children)) {
    if (element.tagName === 'H2') section = element.id || null

    if (slug !== null && section === slug) element.setAttribute(NARRATED, 'true')
    else element.removeAttribute(NARRATED)
  }
}
