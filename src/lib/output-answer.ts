import type { Confidence } from './interval-ladder'

/**
 * Typing a program's output from memory is stronger evidence than recognising
 * an answer among four, so a correct output earns more of the ladder than a
 * multiple choice answer does. It is still short of the top, which is reserved
 * for explaining a thing rather than predicting it.
 */
export const OUTPUT_CONFIDENCE: Confidence = 4

/**
 * Strips the differences that are not the answer. Console output copied by hand
 * varies in indentation, in how many spaces separate values, in whether the
 * last line ends with a newline, and in which quote character the writer
 * happened to use. None of those are what the question is asking about.
 *
 * Case is left alone, because JavaScript is case sensitive and `undefined` is
 * not `Undefined`.
 */
export function normaliseOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[‘’`]/g, "'")
    .replace(/["“”]/g, "'")
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

export function matchesExpectedOutput(answer: string, expected: string): boolean {
  const normalised = normaliseOutput(answer)
  return normalised.length > 0 && normalised === normaliseOutput(expected)
}
