import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextSpeed, SPEEDS, useNarrationSpeed, type NarrationSpeed } from './playback-speed'

const KEY = 'prep:narration-speed'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('useNarrationSpeed', () => {
  it('starts at normal speed when nothing has been chosen', () => {
    const { result } = renderHook(() => useNarrationSpeed())
    expect(result.current[0]).toBe(1)
  })

  it('remembers a chosen speed', () => {
    const { result } = renderHook(() => useNarrationSpeed())

    act(() => result.current[1](1.5))

    expect(result.current[0]).toBe(1.5)
    expect(window.localStorage.getItem(KEY)).toBe('1.5')
  })

  it('applies a speed chosen on an earlier topic', () => {
    window.localStorage.setItem(KEY, '2')
    const { result } = renderHook(() => useNarrationSpeed())
    expect(result.current[0]).toBe(2)
  })

  it('reaches every player on the page, not only the one that changed it', () => {
    const first = renderHook(() => useNarrationSpeed())
    const second = renderHook(() => useNarrationSpeed())

    act(() => first.result.current[1](2))

    expect(second.result.current[0]).toBe(2)
  })

  it('ignores a stored value that is not a speed we offer', () => {
    window.localStorage.setItem(KEY, '17')
    expect(renderHook(() => useNarrationSpeed()).result.current[0]).toBe(1)

    window.localStorage.setItem(KEY, 'fast')
    expect(renderHook(() => useNarrationSpeed()).result.current[0]).toBe(1)
  })
})

describe('nextSpeed', () => {
  it('cycles through every offered speed and back to the start', () => {
    let speed: NarrationSpeed = SPEEDS[0] ?? 1
    const seen: NarrationSpeed[] = [speed]

    for (let step = 1; step < SPEEDS.length; step += 1) {
      speed = nextSpeed(speed)
      seen.push(speed)
    }

    expect(seen).toEqual([...SPEEDS])
    expect(nextSpeed(speed)).toBe(SPEEDS[0])
  })

  it('never offers a speed past two, where a synthesised voice stops being followable', () => {
    expect(Math.max(...SPEEDS)).toBe(2)
  })
})
