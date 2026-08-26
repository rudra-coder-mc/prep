import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'leak-on-purpose',
    title: 'Write four leaks, then prove each one',
    difficulty: 'hard',
    prompt:
      'Build a small Node script that leaks in each of the four shapes, and measure it rather than asserting it. Run each shape a thousand times, force a collection between rounds with --expose-gc, and print heapUsed so the difference is a number you can see.',
    requirements: [
      'A module-level Map that is never evicted from, and the same code with a size bound, printing the heap after each.',
      'A setInterval whose callback closes over a large buffer, with a version that clears it, and a comment on why the leaked one also costs CPU.',
      'A listener added to a long-lived emitter with an inline arrow, showing that removing it with an identical arrow does not work.',
      'A returned closure that shares a scope with an unused closure mentioning a large buffer, and the rewrite that gives it a scope of its own.',
      'A comment stating what --expose-gc is for and why calling global.gc from application code is wrong.',
    ],
  },
  {
    id: 'read-a-retainer-path',
    title: 'Find a leak from a snapshot, not from the source',
    difficulty: 'hard',
    prompt:
      'Take a leaking script you did not write, or one of your own from the previous exercise with the cause obscured, and find the retainer without reading the code that leaks. Use two heap snapshots and the comparison view.',
    requirements: [
      'Capture a snapshot, run the suspect operation many times, capture a second, and compare, writing down what the comparison shows about objects allocated between them.',
      'Read the retainer path for one leaked object and write it out as a chain from the root, naming each link.',
      'State which of the four shapes it is, and predict the fix before applying it.',
      'Apply the fix and repeat the same measurement, showing the count no longer grows.',
      'Do the same thing with process.memoryUsage().heapUsed alone, and write down what that method can and cannot tell you.',
    ],
  },
]
