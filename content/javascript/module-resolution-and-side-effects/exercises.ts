import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'evaluated-once-proof',
    title: 'Prove what shares a module and what does not',
    difficulty: 'medium',
    prompt:
      'Write a module that records each evaluation on globalThis, then import it four ways — the same relative path from two directories, an absolute path, and the same path with a query string — and assert exactly how many times it evaluated.',
    requirements: [
      'Assert the two relative spellings and the absolute path share one evaluation, and say in a comment what the registry key is.',
      'Assert the query string version evaluates again, and that its module level state is separate from the first copy.',
      'Export a counter from the module and assert the two copies disagree, which is the duplicate state a second instance brings.',
      'Add a class to the module and assert an instance from one copy fails instanceof against the class from the other.',
      'Replace that check with a symbol based brand check and assert it passes across both copies.',
    ],
  },
  {
    id: 'safe-side-effect-module',
    title: 'A registration module that survives being loaded twice',
    difficulty: 'medium',
    prompt:
      'Write register.js, which registers a set of handlers as a side effect of being imported, so that a second evaluation of the module is harmless. Then write the tests that would have caught the unguarded version.',
    requirements: [
      'The shared state the guard consults lives outside the module, on a namespaced property of globalThis, and a test asserts a second evaluation adds nothing.',
      'A test loads the module twice through different specifiers, asserting one set of handlers and no error.',
      'A test asserts the handlers exist before the body of an importing module runs, which is the guarantee a side effect import gives.',
      'Add a package.json sideEffects entry covering this file, and state in a comment what would happen in a production build without it.',
      'A test asserts the module exports nothing, so no consumer can come to depend on its internals.',
    ],
  },
]
