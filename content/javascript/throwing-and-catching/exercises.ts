import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'completion-rules',
    title: 'Prove the completion rules',
    difficulty: 'medium',
    prompt:
      'Write a small set of functions that each combine try, catch and finally differently, and a test for every rule about which completion wins. The tests are the deliverable: each one should fail loudly if a future engine changed the rule.',
    requirements: [
      'A function whose try returns a variable that finally then reassigns. Assert the original value comes back, and say in a comment when the return expression was evaluated.',
      'A function whose finally returns. Assert it wins over both a return in the try and a throw in the try, so the same finally hides an error and replaces a value.',
      'A loop whose try breaks and whose finally pushes to a log. Assert the finally ran and the loop still ended, then add a variant where the finally continues and assert the loop no longer ends early.',
      'A function whose finally throws while an error is already in flight. Assert the caller sees the cleanup error and not the original, then fix it with an inner try and assert the original arrives with the cleanup failure recorded separately.',
      'A test that a finally block runs when nothing catches the error at all, by asserting a side effect after the call site catches it.',
    ],
  },
  {
    id: 'narrow-recovery',
    title: 'Recover from one failure and nothing else',
    difficulty: 'medium',
    prompt:
      'Write loadConfig(raw) that returns parsed configuration, falls back to defaults when the text is not valid JSON, and lets every other failure through untouched.',
    requirements: [
      'A test asserts malformed JSON returns the defaults, and another asserts the defaults are a fresh object each time rather than a shared one the caller can mutate.',
      'The normalising step is outside the try. A test passes valid JSON that makes normalise throw a TypeError, and asserts that error reaches the caller rather than becoming defaults.',
      'A test asserts the fallback is reported: pass a warning function in and assert it was called once with the reason.',
      'Add a second entry point that must not recover, loadConfigStrict, and assert malformed JSON throws from it. Keep the parsing in one place rather than duplicating it.',
      'A test throws a non-Error value from the injected normalise and asserts loadConfig neither recovers from it nor crashes trying to read a property off it.',
    ],
  },
]
