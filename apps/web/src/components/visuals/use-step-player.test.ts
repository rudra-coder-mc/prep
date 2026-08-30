import { act, render, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoPlayInView, useStepPlayer } from './use-step-player'

describe('useStepPlayer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts at the first step', () => {
    const { result } = renderHook(() => useStepPlayer(3))
    expect(result.current.index).toBe(0)
    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(false)
  })

  it('steps forward and backward without leaving the range', () => {
    const { result } = renderHook(() => useStepPlayer(3))

    act(() => result.current.previous())
    expect(result.current.index).toBe(0)

    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
    expect(result.current.isLast).toBe(true)
  })

  it('advances on a timer while playing and stops at the end', () => {
    const { result } = renderHook(() => useStepPlayer(3, 100))

    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)

    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.index).toBe(1)

    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.index).toBe(2)

    act(() => void vi.advanceTimersByTime(200))
    expect(result.current.index).toBe(2)
    expect(result.current.isPlaying).toBe(false)
  })

  it('restarts when play is pressed at the end', () => {
    const { result } = renderHook(() => useStepPlayer(3, 100))

    act(() => result.current.goTo(2))
    act(() => result.current.play())
    expect(result.current.index).toBe(0)
    expect(result.current.isPlaying).toBe(true)
  })

  it('stepping by hand pauses playback', () => {
    const { result } = renderHook(() => useStepPlayer(3, 100))

    act(() => result.current.play())
    act(() => result.current.next())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.index).toBe(1)
  })

  it('pulls the index back when the step count shrinks', () => {
    const { result, rerender } = renderHook(({ count }) => useStepPlayer(count), {
      initialProps: { count: 5 },
    })

    act(() => result.current.goTo(4))
    expect(result.current.index).toBe(4)

    rerender({ count: 2 })
    expect(result.current.index).toBe(1)
  })

  it('halves the wait between steps at double speed', () => {
    const { result } = renderHook(() => useStepPlayer(3, 100))

    act(() => result.current.cycleSpeed())
    expect(result.current.speed).toBe(1.5)

    act(() => result.current.cycleSpeed())
    expect(result.current.speed).toBe(2)

    act(() => result.current.play())
    act(() => void vi.advanceTimersByTime(50))
    expect(result.current.index).toBe(1)
  })

  it('reports which way the last move went, so visuals can animate with it', () => {
    const { result } = renderHook(() => useStepPlayer(3, 100))
    expect(result.current.direction).toBe(1)

    act(() => result.current.next())
    expect(result.current.direction).toBe(1)

    act(() => result.current.previous())
    expect(result.current.direction).toBe(-1)
  })

  it('does nothing useful but stays safe with no steps at all', () => {
    const { result } = renderHook(() => useStepPlayer(0))
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.index).toBe(0)
  })
})

describe('useAutoPlayInView', () => {
  function fakeObserver() {
    const callbacks: ((entries: { intersectionRatio: number }[]) => void)[] = []

    class FakeObserver {
      constructor(callback: (entries: { intersectionRatio: number }[]) => void) {
        callbacks.push(callback)
      }
      observe() {}
      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', FakeObserver)
    return callbacks
  }

  /** A visual, reduced to the only part of one this hook cares about. */
  function Visual({ onVisible, enabled = true }: { onVisible: () => void; enabled?: boolean }) {
    const ref = useAutoPlayInView(onVisible, enabled)
    return createElement('div', { ref, 'data-testid': 'visual' })
  }

  afterEach(() => vi.unstubAllGlobals())

  it('runs the callback the first time the element is properly on screen', () => {
    const callbacks = fakeObserver()
    const onVisible = vi.fn()

    render(createElement(Visual, { onVisible }))
    act(() => callbacks.at(-1)?.([{ intersectionRatio: 0.9 }]))

    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  it('does not run it again on the way back up the page', () => {
    const callbacks = fakeObserver()
    const onVisible = vi.fn()

    render(createElement(Visual, { onVisible }))
    act(() => callbacks.at(-1)?.([{ intersectionRatio: 0.9 }]))
    act(() => callbacks.at(-1)?.([{ intersectionRatio: 0.9 }]))

    expect(onVisible).toHaveBeenCalledTimes(1)
  })

  it('ignores an element that is barely in view', () => {
    const callbacks = fakeObserver()
    const onVisible = vi.fn()

    render(createElement(Visual, { onVisible }))
    act(() => callbacks.at(-1)?.([{ intersectionRatio: 0.2 }]))

    expect(onVisible).not.toHaveBeenCalled()
  })

  it('does nothing at all when disabled, as it is for reduced motion', () => {
    const callbacks = fakeObserver()
    const onVisible = vi.fn()

    render(createElement(Visual, { onVisible, enabled: false }))

    expect(callbacks).toHaveLength(0)
    expect(onVisible).not.toHaveBeenCalled()
  })

  it('stays safe in an environment with no observer at all', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const onVisible = vi.fn()

    expect(() => render(createElement(Visual, { onVisible }))).not.toThrow()
    expect(onVisible).not.toHaveBeenCalled()
  })
})
