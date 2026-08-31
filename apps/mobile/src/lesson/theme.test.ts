import { describe, expect, it } from 'vitest'
import { colors } from '../ui/theme'
import { lessonTheme } from './theme'

describe('lessonTheme', () => {
  it('names every colour the way the stylesheet does', () => {
    expect(lessonTheme({ bg: '#0b0e15', accentFg: '#07121e' })).toEqual({
      '--color-bg': '#0b0e15',
      '--color-accent-fg': '#07121e',
    })
  })

  it('sends the whole palette, so a colour added to it is not left behind', () => {
    expect(Object.keys(lessonTheme())).toHaveLength(Object.keys(colors).length)
  })
})
