import { describe, expect, it } from 'vitest'
import { archiveTopic } from '../../test-support/content'
import { playableSections } from './narration'

const narrated = archiveTopic({
  narration: [
    { title: 'Why this matters', heading: 'Why this matters', script: '...', audioKey: 'one' },
    { title: 'The `this` binding', heading: 'The `this` binding', script: '...', audioKey: 'two' },
  ],
})

describe('playableSections', () => {
  it('offers the sections this device holds a recording of', () => {
    expect(playableSections(narrated, new Set(['one', 'two']))).toEqual([
      { title: 'Why this matters', slug: 'why-this-matters', audioKey: 'one' },
      { title: 'The `this` binding', slug: 'the-this-binding', audioKey: 'two' },
    ])
  })

  it('leaves out a section whose recording has not been downloaded', () => {
    expect(playableSections(narrated, new Set(['two']))).toEqual([
      { title: 'The `this` binding', slug: 'the-this-binding', audioKey: 'two' },
    ])
  })

  it('offers nothing for a topic with no narration at all', () => {
    expect(playableSections(archiveTopic(), new Set(['one']))).toEqual([])
  })
})
