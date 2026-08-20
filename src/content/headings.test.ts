import { describe, expect, it } from 'vitest'
import { collidingHeadings, headingSlug, lessonHeadings, unknownHeadings } from './headings'

const LESSON = `## Why this matters

Prose about why.

## \`+\` is two operators

\`\`\`js
// ## not a heading, this is a comment in a code block
console.log(1 + '2')
\`\`\`

### A third level heading is not a section

More prose.

## The interview angle
`

describe('headingSlug', () => {
  it('turns a heading into the id it is anchored by', () => {
    expect(headingSlug('Why this matters')).toBe('why-this-matters')
  })

  it('ignores backticks, since the rendered heading has none', () => {
    expect(headingSlug('`prototype` versus `__proto__`')).toBe('prototype-versus-proto')
    expect(headingSlug('What `==` actually does')).toBe(headingSlug('What == actually does'))
  })

  it('never leaves a slug starting or ending in a separator', () => {
    expect(headingSlug('`+` is two operators')).toBe('is-two-operators')
    expect(headingSlug('  Trailing punctuation!  ')).toBe('trailing-punctuation')
  })
})

describe('lessonHeadings', () => {
  it('reads the second level headings, in the order they appear', () => {
    expect(lessonHeadings(LESSON)).toEqual([
      'Why this matters',
      '`+` is two operators',
      'The interview angle',
    ])
  })

  it('does not mistake a comment in a code block for a heading', () => {
    expect(lessonHeadings(LESSON)).not.toContain('not a heading, this is a comment in a code block')
  })

  it('has nothing to say about a lesson with no headings', () => {
    expect(lessonHeadings('Just prose.\n')).toEqual([])
  })
})

describe('unknownHeadings', () => {
  it('is empty when every section points at a heading that exists', () => {
    expect(unknownHeadings(['Why this matters', '`+` is two operators'], LESSON)).toEqual([])
  })

  it('accepts a heading written without its backticks', () => {
    expect(unknownHeadings(['+ is two operators'], LESSON)).toEqual([])
  })

  it('names a heading the lesson does not have', () => {
    const unknown = unknownHeadings(['Truthiness'], LESSON)

    expect(unknown).toHaveLength(1)
    expect(unknown[0]?.heading).toBe('Truthiness')
  })

  it('suggests the heading a renamed one probably became', () => {
    expect(unknownHeadings(['Why this matters most'], LESSON)[0]?.suggestion).toBe(
      'Why this matters',
    )
  })

  it('suggests nothing when there is nothing close', () => {
    expect(unknownHeadings(['Garbage collection'], LESSON)[0]?.suggestion).toBeNull()
  })
})

describe('collidingHeadings', () => {
  it('is empty when every heading has an id of its own', () => {
    expect(collidingHeadings(LESSON)).toEqual([])
  })

  it('names headings that would render with the same id', () => {
    const lesson = `${LESSON}\n## Why, this matters!\n`

    expect(collidingHeadings(lesson)).toEqual([['Why this matters', 'Why, this matters!']])
  })
})
