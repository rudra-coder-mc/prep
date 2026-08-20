/**
 * Lesson headings, and how a narration section points at one.
 *
 * A narration script is separate text from the lesson, written to be heard
 * rather than read, so the two cannot be lined up by matching words. Each
 * section names the lesson heading it is talking about instead, and that name is
 * what lets the page highlight the part of the lesson the voice is on.
 *
 * The slug is the tie between them: the heading becomes an `id` in the rendered
 * lesson, and the same function turns the narration's heading into the same
 * `id`. Both sides go through here so they cannot drift apart.
 */

/** How a heading becomes the `id` it is anchored by. */
export function headingSlug(heading: string): string {
  return (
    heading
      .toLowerCase()
      // Backticks are markup rather than words: `+` is two operators and + is two
      // operators are the same heading, and the rendered text has no backticks in
      // it at all.
      .replace(/`/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

/**
 * The second level headings of a lesson, exactly as written.
 *
 * Second level only, because that is what a narration section is the size of. A
 * fenced block is skipped rather than read: a `#` inside one is code, not a
 * heading.
 */
export function lessonHeadings(source: string): string[] {
  const headings: string[] = []
  let fenced = false

  for (const line of source.split('\n')) {
    if (line.startsWith('```')) {
      fenced = !fenced
      continue
    }
    if (fenced) continue

    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading?.[1]) headings.push(heading[1])
  }

  return headings
}

/**
 * The headings a narration points at that its lesson does not have.
 *
 * This is the check that keeps the highlight honest. Renaming a lesson heading
 * without touching the narration would otherwise leave the voice talking about a
 * part of the page that nothing points at, which nothing else would notice.
 */
export function unknownHeadings(
  narrationHeadings: string[],
  source: string,
): { heading: string; suggestion: string | null }[] {
  const known = new Set(lessonHeadings(source).map(headingSlug))

  return narrationHeadings
    .filter((heading) => !known.has(headingSlug(heading)))
    .map((heading) => ({ heading, suggestion: closestHeading(heading, source) }))
}

/**
 * The lesson heading a mistyped one probably meant, by longest shared prefix.
 * Crude, but the realistic mistake is a heading that was edited on one side.
 */
function closestHeading(heading: string, source: string): string | null {
  const wanted = headingSlug(heading)
  let best: { heading: string; shared: number } | null = null

  for (const candidate of lessonHeadings(source)) {
    const slug = headingSlug(candidate)
    let shared = 0
    while (shared < slug.length && slug[shared] === wanted[shared]) shared += 1
    if (shared > 3 && (!best || shared > best.shared)) best = { heading: candidate, shared }
  }

  return best?.heading ?? null
}

/**
 * Headings in one lesson that would be rendered with the same `id`.
 *
 * Two of them means a narration section pointing at either one lights up both
 * and scrolls to the first, which is confusing in a way nothing else would
 * explain. Renaming one of the headings is the fix.
 */
export function collidingHeadings(source: string): string[][] {
  const bySlug = new Map<string, string[]>()

  for (const heading of lessonHeadings(source)) {
    const slug = headingSlug(heading)
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), heading])
  }

  return [...bySlug.values()].filter((headings) => headings.length > 1)
}
