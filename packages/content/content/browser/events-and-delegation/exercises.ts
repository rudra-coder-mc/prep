import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'delegated-table',
    title: 'One listener for a table that rebuilds itself',
    difficulty: 'medium',
    prompt:
      'Build a sortable, filterable table of at least two hundred rows where every row has select, edit and delete actions, using exactly one click listener and one keydown listener for the whole table, and prove the count.',
    requirements: [
      'Every action is matched with closest and a data-action attribute, and an assertion shows the handler count on the table and on every row, so "exactly one" is tested rather than claimed.',
      'Clicking an icon inside a button behaves identically to clicking the button, with a test that dispatches the click on the innermost node.',
      'Sorting and filtering replace every row node, and a test asserts the actions still work afterwards without anything being reattached.',
      'Keyboard operation of the same actions through the same delegated listener, including the case where the focused element is inside a row rather than being the row.',
      'A written note on what happens if a future row contains a component that calls stopPropagation, and what you would do about it.',
    ],
  },
  {
    id: 'listener-lifetimes',
    title: 'Leak a listener, then find it and fix it three ways',
    difficulty: 'hard',
    prompt:
      'Write a component that mounts and unmounts repeatedly and deliberately leaks its window listeners, observe the growth in the browser, then remove the leak three different ways and compare them.',
    requirements: [
      'A reproduction that grows measurably over fifty mount and unmount cycles, with the growth shown in a heap snapshot and the retaining path written down.',
      'Fix one: a stored function reference, including the bind case, with a test that proves removal succeeded rather than assuming it.',
      'Fix two: the once option, with a note on which of the component listeners it can and cannot replace.',
      'Fix three: a single AbortController whose signal covers every listener, a fetch and an observer, aborted in one call at teardown.',
      'A comparison of the three, saying which you would use by default and what each one costs when a component registers listeners conditionally.',
    ],
  },
]
