import { describe, expect, it } from 'vitest'
import { activeTopicTab, topicTabItems } from './topic-tabs'

const BASE = '/topics/javascript/closures'

describe('topicTabItems', () => {
  it('builds the three routes a topic has', () => {
    expect(topicTabItems('javascript', 'closures')).toEqual([
      { tab: 'lesson', label: 'Lesson', href: BASE },
      { tab: 'practice', label: 'Practice', href: `${BASE}/practice` },
      { tab: 'exercises', label: 'Exercises', href: `${BASE}/exercises` },
    ])
  })
})

describe('activeTopicTab', () => {
  it('reads the tab out of the path', () => {
    expect(activeTopicTab(BASE, BASE)).toBe('lesson')
    expect(activeTopicTab(`${BASE}/practice`, BASE)).toBe('practice')
    expect(activeTopicTab(`${BASE}/exercises`, BASE)).toBe('exercises')
  })

  it('falls back to the lesson for anything unknown', () => {
    expect(activeTopicTab(`${BASE}/something-else`, BASE)).toBe('lesson')
  })
})
