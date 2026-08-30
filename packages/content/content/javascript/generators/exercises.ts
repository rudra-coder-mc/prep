import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'lazy-pipeline',
    title: 'A lazy map, filter and take',
    difficulty: 'medium',
    prompt:
      'Write map(iterable, fn), filter(iterable, pred) and take(iterable, n) as generator functions, so that take(filter(map(naturals(), square), isEven), 3) produces the first three even squares without naturals() ever running more than it needs to.',
    requirements: [
      'naturals() is an infinite generator. The pipeline must terminate.',
      'Count how many times square is called for the three results and assert the number, and explain in a comment why that number and not more.',
      'Show that take calls return() on its source when it stops, by giving filter a finally block that logs, and assert it runs.',
      'Write the array version with map, filter and slice beside it, and say in a comment which line would never finish.',
    ],
  },
  {
    id: 'two-way-generator',
    title: 'A generator that takes input',
    difficulty: 'hard',
    prompt:
      'Write a generator runningAverage() where each next(value) sends a number in and receives the average of everything sent so far, and a generator that wraps it to reject NaN by throwing into it with gen.throw().',
    requirements: [
      'The first next() call primes the generator and returns nothing useful. Say in a comment why the value passed to the first next() is discarded.',
      'next(10) returns 10, then next(20) returns 15, then next(30) returns 20.',
      'gen.throw(new Error("not a number")) is caught inside the generator at the yield, logged, and the generator keeps accepting numbers afterwards with the average unaffected.',
      'gen.return() ends it, and a finally block inside the generator runs and logs. Assert that next() after that returns { value: undefined, done: true }.',
    ],
  },
]
