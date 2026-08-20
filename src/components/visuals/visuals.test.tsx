import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CallStack, type CallStackStep } from './call-stack'
import { EventLoop, type EventLoopStep } from './event-loop'
import { MemoryModel, type MemoryStep } from './memory-model'
import { PromiseTimeline, type PromiseTimelineStep } from './promise-timeline'
import { PrototypeChain, type PrototypeStep } from './prototype-chain'
import { ScopeChain, type ScopeStep } from './scope-chain'

const next = async () => userEvent.click(screen.getByLabelText('Next step'))

describe('CallStack', () => {
  const steps: CallStackStep[] = [
    { frames: [], note: 'Nothing is running yet.' },
    { frames: ['main', 'greet'], note: 'greet is called from main.' },
    { frames: ['main'], note: 'greet returns and is popped.', output: ['hi'] },
  ]

  it('shows an empty stack as empty rather than as nothing', () => {
    render(<CallStack steps={steps} />)
    expect(screen.getByText('empty')).toBeDefined()
  })

  it('pushes and pops frames as the steps advance', async () => {
    const { container } = render(<CallStack steps={steps} />)

    await next()
    expect(container.querySelectorAll('[data-frame]')).toHaveLength(2)
    expect(container.querySelector('[data-frame="greet"]')).not.toBeNull()

    // A popped frame animates out before it is removed, so this waits for the
    // pop rather than asserting on the frame mid-exit.
    await next()
    await waitFor(() => expect(container.querySelectorAll('[data-frame]')).toHaveLength(1))
    expect(container.querySelector('[data-frame="greet"]')).toBeNull()
  })

  it('reveals output only on the step that produces it', async () => {
    render(<CallStack steps={steps} />)
    expect(screen.queryByText('Output')).toBeNull()
    await next()
    await next()
    expect(screen.getByText('Output')).toBeDefined()
  })
})

describe('EventLoop', () => {
  const steps: EventLoopStep[] = [
    { note: 'Synchronous code runs first.', stack: ['main'], active: 'stack' },
    {
      note: 'The stack empties, so microtasks run before any timer.',
      stack: [],
      microtasks: ['then'],
      macrotasks: ['setTimeout'],
      active: 'microtasks',
    },
    {
      note: 'Only once microtasks are exhausted does a macrotask run.',
      macrotasks: ['setTimeout'],
      active: 'macrotasks',
      output: ['then', 'timeout'],
    },
  ]

  it('renders all three lanes at every step', () => {
    const { container } = render(<EventLoop steps={steps} />)
    expect(container.querySelectorAll('[data-lane]')).toHaveLength(3)
  })

  it('marks exactly the lane the loop is working on', async () => {
    const { container } = render(<EventLoop steps={steps} />)
    expect(container.querySelector('[data-lane="stack"][data-active]')).not.toBeNull()

    await next()
    expect(container.querySelector('[data-lane="stack"][data-active]')).toBeNull()
    expect(container.querySelector('[data-lane="microtasks"][data-active]')).not.toBeNull()
  })

  it('drains a lane when its step says so', async () => {
    const { container } = render(<EventLoop steps={steps} />)
    await next()
    const stack = container.querySelector('[data-lane="stack"]')
    expect(stack?.textContent).toContain('empty')
  })

  it('carries one identified task from a queue onto the stack', async () => {
    const moving: EventLoopStep[] = [
      {
        note: 'The timer callback is waiting its turn.',
        macrotasks: [{ id: 'timeout', label: 'timeout: log 2' }],
        active: 'macrotasks',
      },
      {
        note: 'The loop takes it and runs it.',
        stack: [{ id: 'timeout', label: 'timeout callback' }],
        active: 'stack',
      },
    ]

    const { container } = render(<EventLoop steps={moving} />)
    expect(container.querySelector('[data-lane="macrotasks"] [data-task="timeout"]')).not.toBeNull()

    await next()
    // The same task, now on the stack: identity is what lets it travel rather
    // than being deleted in one lane and created in another.
    await waitFor(() =>
      expect(container.querySelector('[data-lane="stack"] [data-task="timeout"]')).not.toBeNull(),
    )
  })

  it('keeps two identically labelled tasks apart', () => {
    const repeated: EventLoopStep[] = [
      { note: 'Two of the same callback are queued.', microtasks: ['then', 'then'] },
    ]

    const { container } = render(<EventLoop steps={repeated} />)
    const ids = [...container.querySelectorAll('[data-task]')].map((el) =>
      el.getAttribute('data-task'),
    )
    expect(new Set(ids).size).toBe(2)
  })
})

describe('MemoryModel', () => {
  const steps: MemoryStep[] = [
    { note: 'A primitive is held directly.', stack: [{ name: 'a', value: '1' }] },
    {
      note: 'An object binding holds a reference, not the object.',
      stack: [
        { name: 'a', value: '1' },
        { name: 'b', ref: '#1' },
      ],
      heap: [{ id: '#1', label: 'Object', fields: { x: '1' } }],
      highlight: ['#1'],
    },
    {
      note: 'Copying the binding copies the reference, so both point at one object.',
      stack: [
        { name: 'b', ref: '#1' },
        { name: 'c', ref: '#1' },
      ],
      heap: [{ id: '#1', label: 'Object', fields: { x: '99' } }],
      highlight: ['#1'],
    },
  ]

  it('distinguishes a value binding from a reference', async () => {
    const { container } = render(<MemoryModel steps={steps} />)
    expect(container.querySelector('[data-binding="a"]')?.textContent).toContain('1')

    await next()
    expect(container.querySelector('[data-binding="b"]')?.textContent).toContain('#1')
  })

  it('shows two bindings sharing one heap object', async () => {
    const { container } = render(<MemoryModel steps={steps} />)
    await next()
    await next()

    expect(container.querySelectorAll('[data-heap]')).toHaveLength(1)
    expect(container.querySelector('[data-binding="b"]')?.textContent).toContain('#1')
    expect(container.querySelector('[data-binding="c"]')?.textContent).toContain('#1')
  })

  it('marks the object that changed', async () => {
    const { container } = render(<MemoryModel steps={steps} />)
    await next()
    expect(container.querySelector('[data-heap="#1"][data-highlighted]')).not.toBeNull()
  })
})

describe('ScopeChain', () => {
  const steps: ScopeStep[] = [
    {
      note: 'The inner function does not declare count, so lookup walks outward.',
      scopes: [
        { name: 'global', bindings: {} },
        { name: 'makeCounter', bindings: { count: '0' } },
        { name: 'increment', bindings: {} },
      ],
      lookup: { name: 'count', foundIn: 'makeCounter' },
    },
    {
      note: 'A name nobody declares reaches the end of the chain.',
      scopes: [
        { name: 'global', bindings: {} },
        { name: 'makeCounter', bindings: { count: '0' } },
      ],
      lookup: { name: 'missing' },
    },
  ]

  it('marks the scope that answered the lookup', () => {
    const { container } = render(<ScopeChain steps={steps} />)
    expect(container.querySelector('[data-scope="makeCounter"][data-answer]')).not.toBeNull()
    expect(container.querySelector('[data-scope="global"][data-answer]')).toBeNull()
  })

  it('says so when nothing in the chain has the name', async () => {
    render(<ScopeChain steps={steps} />)
    await next()
    expect(screen.getByText(/not found/)).toBeDefined()
  })
})

describe('PrototypeChain', () => {
  const steps: PrototypeStep[] = [
    {
      note: 'toString is not an own property, so lookup walks the chain.',
      chain: [
        { id: 'dog', label: 'dog', properties: ['name'] },
        { id: 'Dog.prototype', label: 'Dog.prototype', properties: ['bark'] },
        { id: 'Object.prototype', label: 'Object.prototype', properties: ['toString'] },
      ],
      lookup: { property: 'toString', foundIn: 'Object.prototype' },
    },
    {
      note: 'A property nobody defines ends as undefined.',
      chain: [
        { id: 'dog', label: 'dog', properties: ['name'] },
        { id: 'Object.prototype', label: 'Object.prototype', properties: ['toString'] },
      ],
      lookup: { property: 'fly' },
    },
  ]

  it('marks the link that owns the property', () => {
    const { container } = render(<PrototypeChain steps={steps} />)
    expect(container.querySelector('[data-link="Object.prototype"][data-answer]')).not.toBeNull()
    expect(container.querySelector('[data-link="dog"][data-answer]')).toBeNull()
  })

  it('reports undefined when the chain runs out', async () => {
    const { container } = render(<PrototypeChain steps={steps} />)
    await next()
    const lookup = [...container.querySelectorAll('p')].find((p) =>
      p.textContent?.startsWith('looking up'),
    )
    expect(lookup?.textContent).toContain('undefined')
  })
})

describe('PromiseTimeline', () => {
  const steps: PromiseTimelineStep[] = [
    {
      note: 'Both start pending.',
      promises: [
        { id: 'a', label: 'fetchUser()', state: 'pending' },
        { id: 'b', label: 'fetchPosts()', state: 'pending' },
      ],
    },
    {
      note: 'One settles, the other rejects.',
      promises: [
        { id: 'a', label: 'fetchUser()', state: 'fulfilled', value: 'user' },
        { id: 'b', label: 'fetchPosts()', state: 'rejected', value: '404' },
      ],
      output: ['allSettled resolves anyway'],
    },
  ]

  it('renders each promise with its state', () => {
    const { container } = render(<PromiseTimeline steps={steps} />)
    expect(container.querySelectorAll('[data-state="pending"]')).toHaveLength(2)
  })

  it('moves promises between states as steps advance', async () => {
    const { container } = render(<PromiseTimeline steps={steps} />)
    await next()

    expect(container.querySelector('[data-promise="a"]')?.getAttribute('data-state')).toBe(
      'fulfilled',
    )
    expect(container.querySelector('[data-promise="b"]')?.getAttribute('data-state')).toBe(
      'rejected',
    )
  })
})
