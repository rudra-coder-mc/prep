import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStepPlayer } from './use-step-player'

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

  it('does nothing useful but stays safe with no steps at all', () => {
    const { result } = renderHook(() => useStepPlayer(0))
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.index).toBe(0)
  })
})
