/**
 * The web app's palette, in the form React Native takes.
 *
 * The two surfaces are one product and should not look like two, so these are
 * the tokens in apps/web/src/app/globals.css converted from oklch to hex. That
 * file is the original; when it changes, this follows.
 */
export const colors = {
  bg: '#0b0e15',
  surface: '#161921',
  raised: '#1e232c',
  border: '#2c303a',
  edge: '#474d59',
  fg: '#f0f2f5',
  muted: '#9fa5af',
  faint: '#70757e',
  accent: '#5fafff',
  accentFg: '#07121e',
  pass: '#4eca7a',
  weak: '#f1b638',
  fail: '#fa6863',
} as const

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const

export const radius = { card: 14, control: 10 } as const
