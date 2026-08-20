import { describe, expect, it } from 'vitest'
import { linkPath } from './flow'

/** Only the geometry matters here, so a rect is four numbers. */
function rect(x: number, y: number, width: number, height: number): DOMRect {
  return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height } as DOMRect
}

const BASE = rect(0, 0, 500, 400)

function points(d: string): { x: number; y: number }[] {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }))
}

describe('linkPath', () => {
  const source = rect(20, 100, 100, 40)

  it('leaves the right edge and enters the left edge when the boxes sit side by side', () => {
    const target = rect(200, 180, 200, 40)
    const drawn = points(linkPath(source, target, BASE, 'vertical'))

    expect(drawn.at(0)).toEqual({ x: 120, y: 120 })
    expect(drawn.at(-1)).toEqual({ x: 200, y: 200 })
  })

  it('drops from bottom to top when the target has wrapped underneath', () => {
    const target = rect(20, 200, 100, 40)
    const drawn = points(linkPath(source, target, BASE, 'vertical'))

    expect(drawn.at(0)).toEqual({ x: 70, y: 140 })
    expect(drawn.at(-1)).toEqual({ x: 70, y: 200 })
  })

  it('runs down the margin rather than across the boxes when routing a stacked map', () => {
    const target = rect(40, 260, 300, 40)
    const drawn = points(linkPath(source, target, BASE, 'gutter'))

    // It has to end on the target's left edge, at its middle...
    expect(drawn.at(-1)).toEqual({ x: 40, y: 280 })
    // ...and never stray right of that edge on the way there, which is what
    // made the lines cut diagonally across every branch between.
    expect(Math.max(...drawn.map((point) => point.x))).toBeLessThanOrEqual(40)
  })

  it('keeps the spine below the source even when the first target is close', () => {
    const target = rect(40, 145, 300, 40)
    const drawn = points(linkPath(source, target, BASE, 'gutter'))
    const ys = drawn.map((point) => point.y)

    expect(Math.min(...ys)).toBeGreaterThanOrEqual(140)
  })
})
