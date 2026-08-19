// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getAllTopics, getTechnology, getTopic } from './loader'

describe('content discovery', () => {
  it('finds a topic from its directory without any registry to update', async () => {
    const { topics } = await getTechnology('javascript')
    expect(topics.map((t) => t.slug)).toContain('javascript/closures')
  })

  it('builds the full slug from the technology and directory', async () => {
    const topic = await getTopic('javascript', 'closures')
    expect(topic?.slug).toBe('javascript/closures')
    expect(topic?.technology).toBe('javascript')
  })

  it('returns null for a topic that does not exist', async () => {
    expect(await getTopic('javascript', 'nonsense')).toBeNull()
  })

  it('loads the questions and exercises alongside the topic', async () => {
    const topic = await getTopic('javascript', 'closures')
    expect(topic?.questions.length).toBeGreaterThan(0)
    expect(topic?.exercises.length).toBeGreaterThan(0)
    expect(topic?.questions.every((q) => q.expectedAnswer.length > 0)).toBe(true)
  })

  it('orders topics by their declared order', async () => {
    const topics = await getAllTopics()
    const orders = topics.filter((t) => t.technology === 'javascript').map((t) => t.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })
})
