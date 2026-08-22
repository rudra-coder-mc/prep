import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'which-methods-mutate',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these lists contains only methods that change the array they are called on?',
    options: [
      'sort, reverse, splice, push',
      'sort, slice, splice, concat',
      'map, filter, reduce, forEach',
      'push, pop, slice, flat',
    ],
    correctOption: 0,
    answerInFull: `sort, reverse, splice and push all mutate. The full list of mutating methods is nine: push, pop, shift, unshift, splice, sort, reverse, fill and copyWithin.

Everything else returns a new value and leaves the original alone. The 2023 additions toSorted, toReversed, toSpliced and with exist to give the four most commonly misused mutators a copying twin.

The one to say out loud is sort: it mutates and returns the same array, so const sorted = arr.sort() looks like a copy and is an alias.`,
    explanation: `slice is the copying one and splice is the mutating one, and the list that has both is mixing them. A slice is a view copied out; a splice cuts into the original.

map, filter, reduce and forEach never touch the array. forEach's callback can, but the method itself does not.

flat returns a new array. pop and push do mutate, which is what makes the last option tempting.`,
    hints: ['Which of slice and splice is the cut?'],
    tags: ['arrays', 'mutation'],
  },
  {
    id: 'sort-default-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `console.log([10, 9, 1, 100].sort())`,
    options: ['[ 1, 9, 10, 100 ]', '[ 1, 10, 100, 9 ]', '[ 100, 10, 9, 1 ]', '[ 10, 9, 1, 100 ]'],
    correctOption: 1,
    answerInFull: `[ 1, 10, 100, 9 ]

With no comparator, sort converts each element to a string and compares the strings code unit by code unit. '1' is before '10', which is before '100', and all three are before '9' because the first character '1' is less than '9'.

To sort numbers numerically, pass a comparator: arr.sort((a, b) => a - b).`,
    explanation: `The numeric order is what everyone expects and what the default never gives for numbers.

Descending would need a comparator too.

Unchanged is what you would see if sort returned a copy and the original was printed. It sorts in place and returns the same array, so the printed array is sorted, just not the way you meant.`,
    hints: ['What type does the default comparison use?'],
    tags: ['arrays', 'sort'],
  },
  {
    id: 'chain-output-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const result = [3, 1, 2]
  .filter((n) => {
    console.log('filter', n)
    return n > 1
  })
  .map((n) => {
    console.log('map', n)
    return n * 10
  })
  .find((n) => {
    console.log('find', n)
    return n > 10
  })
console.log(result)`,
    items: ['filter 3', 'filter 1', 'filter 2', 'map 3', 'map 1', 'map 2', 'find 30', 'find 20'],
    correctOrder: [0, 1, 2, 3, 5, 6],
    answerInFull: `filter 3
filter 1
filter 2
map 3
map 2
find 30
30

Each method runs to completion over its whole input before the next one starts. filter visits all three elements and keeps 3 and 2. map visits those two and produces [30, 20]. find visits 30, the callback returns true, and find stops there without looking at 20.

The last line is 30 rather than the array, since find returns the element.`,
    explanation: `map 1 is the line you expect if you forget that filter removed 1 before map saw anything. Each stage receives the previous stage's output, not the original array.

find 20 would print if find carried on after a match. It stops at the first element that passes, which is what makes it cheaper than filter()[0].

A fused pipeline, where each element flows through all three callbacks before the next element starts, would print filter 3, map 3, find 30 and stop. That is how a lazy iterator chain behaves, and arrays are not lazy.`,
    hints: [
      'Does map start before filter has finished?',
      'How many elements does find look at once one has matched?',
    ],
    tags: ['arrays', 'chaining'],
  },
  {
    id: 'sort-in-place-bug',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A React list component does const sorted = props.items.sort(byName) and renders sorted. After it mounts, a sibling component that renders the same items from the parent shows them in sorted order too, although it never sorts. Why, and what is the fix?',
    options: [
      'React re-renders every sibling when one renders, so the sibling picked up the sorted prop. Memoise the sibling',
      'sort mutated the array the parent owns and both children receive, so the sibling is reading the reordered array. Sort a copy: props.items.toSorted(byName) or [...props.items].sort(byName)',
      'byName is stable, so the engine cached the sorted order for that array. Use an unstable comparator',
      'The parent passed the same array reference twice, which is a bug in the parent. Pass a fresh array to each child',
    ],
    correctOption: 1,
    answerInFull: `sort reorders the array in place and returns that same array. props.items is a reference to the parent's array, so the one call sorted the parent's data, and every other consumer of it now sees the sorted order. The variable named sorted was never a separate array.

Sort a copy instead:

  const sorted = props.items.toSorted(byName)

or, in environments without toSorted, [...props.items].sort(byName). The spread creates a fresh array, and sorting that leaves the parent's array alone.

This is the single most common mutation bug in React, because props and state are supposed to be read-only and sort is the method that looks harmless.`,
    explanation: `Memoising the sibling changes when it renders, not what the array contains. The array itself was reordered, and any render at any time will show that order.

There is no caching of sorted orders in any engine. Stability describes how ties are kept, not a cache.

Passing the same reference to two children is normal and correct; it is how React props work. The bug is in the child that mutated what it was given.`,
    hints: ['What does sort return?', 'How many arrays are there after the sort?'],
    tags: ['arrays', 'mutation', 'react'],
  },
  {
    id: 'group-by-reduce',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      "Write groupBy(items, key) that returns an object mapping each distinct value of item[key] to the array of items with that value, so groupBy([{ t: 'a' }, { t: 'b' }, { t: 'a' }], 't') gives { a: [...2 items], b: [...1 item] }. Which of these is correct?",
    options: [
      'function groupBy(items, key) {\n  return items.reduce((groups, item) => {\n    groups[item[key]] = [...(groups[item[key]] ?? []), item]\n    return groups\n  })\n}',
      'function groupBy(items, key) {\n  return items.reduce((groups, item) => {\n    const group = item[key]\n    ;(groups[group] ??= []).push(item)\n    return groups\n  }, {})\n}',
      'function groupBy(items, key) {\n  return items.map((item) => ({ [item[key]]: item }))\n}',
      'function groupBy(items, key) {\n  return items.reduce((groups, item) => ({\n    ...groups,\n    [item[key]]: [...groups[item[key]], item],\n  }), {})\n}',
    ],
    correctOption: 1,
    answerInFull: `function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const group = item[key]
    ;(groups[group] ??= []).push(item)
    return groups
  }, {})
}

reduce with an empty object as the initial value, and for each item, create the group's array if it is missing and push into it. The accumulator is the same object on every call, so pushing into it is a constant-time step and the whole function is linear.

The thing to say in an interview is why it mutates the accumulator: the object is created inside this function and nobody else can see it until it is returned, so mutating it is safe and cheaper than rebuilding it. Spreading the accumulator on every step, the "pure" version, copies every existing group on every item and makes the function quadratic.

Object.groupBy(items, (item) => item[key]) is the built-in since 2024, and it is the answer if the environment has it.`,
    explanation: `The version with no initial value takes the first item itself as the accumulator, so the first call tries to read a group off a plain item and the result is the first item with stray properties. It also throws on an empty array.

map returns one object per item and never merges, so two items with the same key become two separate objects in an array.

The spread version spreads groups[item[key]] when that group does not yet exist, which is spreading undefined inside an array literal, and that throws. Fixing it with ?? [] makes it work and leaves it quadratic: every step copies every group built so far.`,
    hints: [
      'What is the accumulator on the first call if you pass no initial value?',
      'Who can see the accumulator before reduce returns?',
    ],
    tags: ['arrays', 'reduce'],
  },
  {
    id: 'foreach-async-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A script does ids.forEach(async (id) => { await save(id) }) and then logs "done". "done" appears before any save has finished, and the saves all run at once and overload the API. What is happening, and how would you make them run one after another?',
    options: [
      'forEach is synchronous and ignores the promise each callback returns, so every save starts immediately and nothing waits. Use for (const id of ids) { await save(id) } inside an async function',
      'await inside an arrow function does not pause. Convert the callback to a regular function so await works',
      'forEach runs its callbacks in parallel by design. Use map, which runs them in sequence',
      'The saves run at once because the API is fast. Add await in front of forEach: await ids.forEach(...)',
    ],
    correctOption: 0,
    answerInFull: `forEach calls the callback once per element, synchronously, and throws away whatever the callback returns. An async callback returns a promise on its first await, so forEach starts every save, collects nothing, and returns undefined. The code after it runs immediately, and the saves all proceed concurrently.

For one at a time:

  for (const id of ids) {
    await save(id)
  }

inside an async function. Each await pauses the loop until that save settles.

For all at once, on purpose, with a wait for completion: await Promise.all(ids.map((id) => save(id))). That is the version that means "in parallel, then continue". The forEach version is the worst of both: parallel, and with no way to know when it is done.`,
    explanation: `await works the same in an arrow function as in any other async function. The pause happens; it is just that forEach is not waiting for it.

map does not run callbacks in sequence any more than forEach does. It does return the promises, which is what makes it usable with Promise.all.

await ids.forEach(...) awaits undefined, which resolves immediately. There is no promise there to wait for.`,
    hints: [
      'What does forEach do with the value a callback returns?',
      'Which construct awaits a promise per iteration?',
    ],
    tags: ['arrays', 'async'],
  },
  {
    id: 'pick-the-method-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'An interviewer hands you a list of requirements one at a time and asks which array method you would reach for and why: check whether any order is overdue, get the first overdue order, get the ids of all overdue orders, total the value of all orders, and remove one order from the list held in state. Walk through your choices.',
    answerInFull: `Whether any is overdue: some. It returns a boolean, stops at the first match, and reads as the question. filter(...).length > 0 walks the whole array and allocates for a yes or no.

The first overdue order: find. It returns the element or undefined and stops at the first match. filter(...)[0] works and does more work, and findIndex is for when the position is wanted rather than the element.

The ids of all overdue: filter then map. filter for the subset, map for the projection. Both return new arrays. One reduce could do it in a single pass, and for a list that fits in memory two clear passes beat one clever one. flatMap is the single-pass version that stays readable: return [id] to keep, [] to drop.

The total: reduce, with 0 as the initial value. It is the one case reduce is unambiguously for, and the initial value is what makes the empty list return 0 instead of throwing.

Removing one from state: filter, returning a new array without it, never splice. State is not mine to mutate, and React and every store compare by reference, so an in-place splice would not even trigger a re-render. With the index known, toSpliced(i, 1) is the direct copying version.

The thread through all five: pick the method whose name is the answer, and the return value tells the reader what you expected to get back.`,
    explanation: `The answer an interviewer is listening for is the distinction between "does the job" and "says what it means", and the mutation point on the last one. Reaching for reduce on anything but the total is the common way to lose points here: it works, and it makes the reader work out what the other four methods would have said in their name.`,
    hints: [],
    tags: ['arrays', 'design'],
  },
  {
    id: 'includes-vs-indexof-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const list = [NaN, 0]
console.log(list.indexOf(NaN), list.includes(NaN), list.includes(-0))`,
    options: ['-1 true true', '0 true false', '-1 false false', '0 true true'],
    correctOption: 0,
    answerInFull: `-1 true true

indexOf compares with ===, and NaN === NaN is false, so indexOf can never find NaN and returns -1. includes compares with SameValueZero, which says NaN equals NaN, so it returns true.

SameValueZero also says 0 and -0 are equal, the same as ===, so includes(-0) finds the 0 at index 1. The one value where includes and indexOf disagree is NaN.`,
    explanation: `0 for the first value is what you would get if indexOf used SameValueZero. It uses strict equality.

false for includes(-0) would need Object.is semantics, where 0 and -0 differ. SameValueZero is named for treating the two zeros as the same.

false for includes(NaN) is the === result, and includes does not use ===.`,
    hints: ['Which comparison does each method use?', 'What is the zero in SameValueZero about?'],
    tags: ['arrays', 'equality'],
  },
  {
    id: 'array-holes-output',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `const a = Array(3).map(() => 1)
const b = Array.from({ length: 3 }, () => 1)
const c = [...Array(3)].map(() => 1)
console.log(a.length, a[0], b, c)`,
    options: [
      '3 undefined [ 1, 1, 1 ] [ 1, 1, 1 ]',
      '3 1 [ 1, 1, 1 ] [ 1, 1, 1 ]',
      '0 undefined [ 1, 1, 1 ] [ 1, 1, 1 ]',
      '3 undefined [ 1, 1, 1 ] [ undefined, undefined, undefined ]',
    ],
    correctOption: 0,
    answerInFull: `3 undefined [ 1, 1, 1 ] [ 1, 1, 1 ]

Array(3) has length 3 and no elements: three holes. map skips holes and never calls the callback, so a is still three holes, with length 3 and a[0] reading as undefined.

Array.from with a length and a mapping function treats the object as having three indexes and calls the function for each, so b is [1, 1, 1].

Spreading Array(3) goes through the iterator, which yields undefined for each hole. That produces a real array of three undefineds, which map then visits, so c is [1, 1, 1].

The general rule: the callback methods skip holes; iteration, spread and Array.from do not.`,
    explanation: `1 for a[0] is what you expect if map visits every index. It visits every element, and holes are not elements.

Length 0 would mean Array(3) made an empty array. It made an array with length 3, which is exactly why it has holes: length without elements.

Three undefineds for c is what spreading gives before the map. The map then runs on a real array and replaces each one with 1.`,
    hints: [
      'Does Array(3) have elements?',
      'Which operations see a hole as undefined, and which skip it?',
    ],
    tags: ['arrays', 'holes'],
  },
  {
    id: 'comparator-bug',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      "names.sort((a, b) => a > b) works in one browser and leaves another browser's result unsorted. Why?",
    options: [
      'The comparator returns a boolean, which becomes 1 or 0. It never returns a negative number, so it never says "a before b", and engines with different algorithms read that differently. Return a.localeCompare(b), or -1, 0 and 1',
      'String comparison with > is locale dependent, so the two browsers disagree on the alphabet. Use localeCompare',
      'One browser has a stable sort and the other does not. Add a secondary key',
      'The comparator is called with (b, a) in some engines. Swap the parameters',
    ],
    correctOption: 0,
    answerInFull: `A comparator has to return a negative number to put a first, a positive number to put b first, and zero for a tie. a > b is a boolean, which is converted to 1 when true and 0 when false. The comparator therefore claims "b first" or "they are equal" and never "a first".

Whether that still produces a sorted array depends entirely on the algorithm the engine uses and which pairs it happens to compare, which is why it works in one browser and not another. The contract was violated in both; one of them got lucky.

  names.sort((a, b) => a.localeCompare(b))

for strings, or (a, b) => (a < b ? -1 : a > b ? 1 : 0) where plain code unit order is wanted.`,
    explanation: `> on strings compares code units in every engine; it is not locale dependent. localeCompare is still the right fix, for ordering accented characters sensibly, but that is not what was breaking.

Every engine has had a stable sort since ES2019. Stability is about ties, and this comparator's problem is that it never expresses "before".

No engine swaps the parameters. The order is what the spec says.`,
    hints: [
      'What three kinds of value can a comparator return, and which of them does a boolean give?',
    ],
    tags: ['arrays', 'sort'],
  },
  {
    id: 'map-parseint-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `console.log(['1', '2', '3'].map(parseInt))`,
    options: ['[ 1, 2, 3 ]', '[ 1, NaN, NaN ]', '[ NaN, NaN, NaN ]', '[ 1, 2, NaN ]'],
    correctOption: 1,
    answerInFull: `[ 1, NaN, NaN ]

map calls its callback with three arguments: the element, the index and the array. parseInt takes two: the string and the radix. So the calls are parseInt('1', 0), parseInt('2', 1) and parseInt('3', 2).

A radix of 0 is treated as "use the default", so '1' parses as 1. Radix 1 is not a valid base, so the result is NaN. In base 2, '3' is not a digit, so NaN again.

Write .map((s) => parseInt(s, 10)) or .map(Number).`,
    explanation: `[1, 2, 3] is what you get when you forget map passes the index.

All three NaN would need the first call to fail too, and radix 0 is accepted as the default.

[1, 2, NaN] would need radix 1 to mean something. There is no base 1.`,
    hints: ['How many arguments does map pass, and what is the second parameter of parseInt?'],
    tags: ['arrays', 'parsing'],
  },
]
