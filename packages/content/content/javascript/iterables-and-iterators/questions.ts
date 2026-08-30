import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'iterable-vs-iterator',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is the difference between an iterable and an iterator?',
    options: [
      'An iterable is an array-like with a length; an iterator is anything you can call for...of on',
      'An iterable has a Symbol.iterator method that returns an iterator; an iterator has a next() method returning { value, done }',
      'They are the same thing: any object with next() is both',
      'An iterable is synchronous and an iterator is the asynchronous version',
    ],
    correctOption: 1,
    answerInFull: `An iterable is an object with a method under Symbol.iterator. Calling it produces an iterator. An iterator is an object with next(), which returns { value, done } and advances one step per call.

They are different roles. An array is iterable and is not an iterator: it has no next(). Its iterator is a separate object, a fresh one per loop, which is why the array can be looped twice.

The built-in iterators also have a Symbol.iterator that returns themselves, so they can be used wherever an iterable is expected. That is a convenience layered on top, not the definition, and it makes those iterators one-shot iterables.`,
    explanation: `Array-likes with a length are a separate idea. Array.from accepts them, for...of does not, and length is not part of either protocol.

"Any object with next() is both" is true only of the built-in iterators that chose to return themselves from Symbol.iterator. A hand-written object with only next() cannot be used in for...of.

Async iteration is a parallel protocol with Symbol.asyncIterator, not the other half of this one.`,
    hints: ['Which of the two does an array have, and which does for...of call?'],
    tags: ['iteration', 'protocols'],
  },
  {
    id: 'spread-object-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const point = { x: 1, y: 2 }
console.log({ ...point })
console.log([...point])`,
    options: [
      '{ x: 1, y: 2 } then [ 1, 2 ]',
      "{ x: 1, y: 2 } then [ [ 'x', 1 ], [ 'y', 2 ] ]",
      '{ x: 1, y: 2 } then a TypeError: point is not iterable',
      'A TypeError on the first line: point is not iterable',
    ],
    correctOption: 2,
    answerInFull: `The first line prints { x: 1, y: 2 }. The second throws TypeError: point is not iterable.

Object spread, inside curly braces, copies own enumerable properties. It does not use the iteration protocol at all, so it works on any object.

Array spread, inside square brackets, calls the value's Symbol.iterator. A plain object has none, so there is nothing to call and it throws. To get the values or the entries, say which: [...Object.values(point)] or Object.entries(point).`,
    explanation: `[1, 2] assumes array spread reads values off an object. It reads from an iterator, and there is no iterator.

The entries array is what Object.entries gives. Spread does not guess that you wanted entries.

Object spread never throws for a missing iterator, because it never looks for one.`,
    hints: ['Which of the two spreads uses Symbol.iterator?'],
    tags: ['iteration', 'spread'],
  },
  {
    id: 'for-of-by-hand-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const countdown = {
  [Symbol.iterator]() {
    console.log('iterator created')
    let n = 2
    return {
      next() {
        console.log('next', n)
        return n > 0 ? { value: n--, done: false } : { value: undefined, done: true }
      },
      return() {
        console.log('return called')
        return { done: true, value: undefined }
      },
    }
  },
}

for (const n of countdown) {
  console.log('body', n)
}
console.log('after')`,
    items: [
      'iterator created',
      'next 2',
      'body 2',
      'next 1',
      'body 1',
      'next 0',
      'return called',
      'after',
    ],
    correctOrder: [0, 1, 2, 3, 4, 5, 7],
    answerInFull: `iterator created
next 2
body 2
next 1
body 1
next 0
after

for...of calls Symbol.iterator once, then alternates: next, body, next, body, until a next returns done: true. The third next sees n at 0 and reports done, so the body does not run for it.

return() is not called. The sequence finished on its own, and return() exists for the case where the consumer leaves before that happens. Put a break in the body and "return called" appears.`,
    explanation: `"return called" is the distractor, and the reason is the one thing worth knowing about return(): it runs on early exit only. A loop that reads to done never triggers it.

Printing "body 0" would need the body to run for the step that reported done. The value on a done step is ignored by for...of.`,
    hints: ['How many times is Symbol.iterator called?', 'When does a consumer call return()?'],
    tags: ['iteration', 'protocols'],
  },
  {
    id: 'once-only-iterable-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'The Range below spreads correctly the first time and gives [] the second time. Why, and what is the fix?',
    code: `class Range {
  constructor(from, to) {
    this.current = from
    this.to = to
  }
  [Symbol.iterator]() {
    return {
      next: () =>
        this.current <= this.to
          ? { value: this.current++, done: false }
          : { value: undefined, done: true },
    }
  }
}
const r = new Range(1, 3)
console.log([...r], [...r])`,
    options: [
      'The position is stored on the instance, so the first spread advances it to the end and the second finds it already there. Move the counter into the Symbol.iterator call so each call starts fresh',
      'Spread consumes the object and leaves it empty, as it does with any iterable. Create a new Range for each spread',
      'The arrow function captures this from the class, so current is shared across instances. Use a regular function for next',
      'Symbol.iterator is only called once per object and cached. Return this from next to reset it',
    ],
    correctOption: 0,
    answerInFull: `Every call to Symbol.iterator is supposed to start a new sequence, and this one cannot, because the only counter is this.current on the instance. The first spread runs it up to 4. The second spread asks for an iterator, whose very first next() sees current > to and reports done, so the array is empty.

Keep the state in the call:

  [Symbol.iterator]() {
    let current = this.from
    const to = this.to
    return {
      next: () => (current <= to ? { value: current++, done: false } : { value: undefined, done: true }),
    }
  }

Now each iterator has its own counter and the instance is iterable as many times as you like. The arrow function is still right: it closes over current and to, and next can be detached without losing them.`,
    explanation: `Spread does not consume an iterable. It consumes the iterator it asked for, and a well-written iterable hands out a fresh one each time. Arrays survive being spread twice for exactly that reason.

The arrow function's this is the instance, which is what was wanted; the problem is what is stored on the instance. this is not shared across instances.

Symbol.iterator is called every time a consumer starts, never cached. Returning this from next would break next's contract entirely.`,
    hints: ['Where does the position live, and how many sequences share it?'],
    tags: ['iteration', 'state'],
  },
  {
    id: 'make-iterable-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Make a LinkedList with a head of { value, next } nodes iterable, without a generator, so that [...list] gives the values from head to tail. Which implementation is correct?',
    options: [
      'class LinkedList {\n  [Symbol.iterator]() {\n    let node = this.head\n    return {\n      next() {\n        if (!node) return { value: undefined, done: true }\n        const value = node.value\n        node = node.next\n        return { value, done: false }\n      },\n    }\n  }\n}',
      'class LinkedList {\n  [Symbol.iterator]() {\n    let node = this.head\n    return {\n      next() {\n        node = node.next\n        return { value: node?.value, done: !node }\n      },\n    }\n  }\n}',
      'class LinkedList {\n  next() {\n    const value = this.head?.value\n    this.head = this.head?.next\n    return { value, done: value === undefined }\n  }\n}',
      'class LinkedList {\n  [Symbol.iterator]() {\n    const values = []\n    for (let node = this.head; node; node = node.next) values.push(node.value)\n    return values\n  }\n}',
    ],
    correctOption: 0,
    answerInFull: `class LinkedList {
  [Symbol.iterator]() {
    let node = this.head
    return {
      next() {
        if (!node) return { value: undefined, done: true }
        const value = node.value
        node = node.next
        return { value, done: false }
      },
    }
  }
}

The cursor, node, lives inside the Symbol.iterator call, so each consumer walks from the head independently. next reads the current node's value, advances, and reports done only when it has run off the end. The value on the done step is undefined, which is what consumers expect.

Say the generator version too, because an interviewer wants to see you know it is the same thing: *[Symbol.iterator]() { for (let node = this.head; node; node = node.next) yield node.value }.`,
    explanation: `Advancing before reading skips the head: the first next moves to the second node and returns its value. It also reports done with the last value still unread, because done is computed from the node after the one being returned.

A class with only next() is an iterator without being iterable. Spread calls Symbol.iterator, which this class lacks, so it throws. It also destroys the list as it walks, by moving head.

Returning an array from Symbol.iterator returns an iterable, not an iterator. The protocol expects next() on what comes back, and an array has no next(), so for...of throws.`,
    hints: [
      'What must the object returned from Symbol.iterator have?',
      'When should done become true?',
    ],
    tags: ['iteration', 'protocols'],
  },
  {
    id: 'pagination-iterable-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'staff',
    prompt:
      'You wrap a paginated API in an iterable so that for...of walks every record across pages. Each page fetch opens a connection that must be released, and callers often break out of the loop after finding what they want. What does the iterator need beyond next(), and when will it run?',
    options: [
      'A close() method the caller must invoke after the loop, since the protocol has no way to know the loop ended',
      'A return() method that releases the connection. for...of calls it when the loop exits early through break, return or throw, and does not call it when the sequence completes on its own',
      'A return() method that releases the connection. for...of calls it after every loop, whether it completed or not',
      'Nothing: when the loop exits, the iterator is garbage and the connection is released with it',
    ],
    correctOption: 1,
    answerInFull: `Give the iterator a return() method. Every built-in consumer, including for...of, spread, destructuring and Array.from, calls it when the consumer leaves before done was reported: a break, a return from the enclosing function, a throw inside the body, or a destructuring pattern that wanted fewer elements.

It is not called when next() reports done, because at that point the iterator finished on its own terms and is responsible for its own cleanup. So release the connection in two places: in next() when the last page is exhausted, and in return() for early exit.

The one consumer that does not call return() is code that drives next() by hand. If you expose the iterator for that, document it, or wrap the manual loop in try/finally.

A generator does this for you: a finally block around the yield loop runs on both completion and early exit, and the generator's built-in return() triggers it.`,
    explanation: `A close() the caller must remember is the thing the protocol exists to avoid, and every caller who breaks out of a loop will forget it.

After every loop is wrong in the direction that matters for correctness: on normal completion, return() is not called, so cleanup on the done path has to be in next() itself. Releasing in return() alone leaks on every full read.

Garbage collection is not deterministic and does not close connections. A connection held by an unreachable object is still open until something explicitly closes it.`,
    hints: [
      'Which method does the protocol define for early exit?',
      'Who is responsible for cleanup when next() reports done?',
    ],
    tags: ['iteration', 'resources'],
  },
  {
    id: 'explain-protocol-interview',
    type: 'interview',
    form: 'choice',
    tier: 'senior',
    prompt:
      'An interviewer asks why the language bothered with an iteration protocol rather than giving every collection a toArray() method. Which answer shows the deepest understanding?',
    options: [
      'A protocol lets any object, including user-defined ones, work with every consumer that speaks it, and it is lazy: values are produced one at a time, so a sequence can be infinite or backed by a resource without ever building an array',
      'Arrays are slow for large data, so the protocol lets the engine skip allocating them',
      'toArray would not work on strings, and the protocol is what makes strings iterable',
      'The protocol exists so that generators have something to return; without it there would be no for...of',
    ],
    correctOption: 0,
    answerInFull: `Two reasons, and both matter.

Decoupling: for...of, spread, destructuring, Array.from, Promise.all, new Map and yield* all speak one contract, and anything that implements it works with all of them. A toArray method would have to be called by every consumer explicitly, and a user-defined collection would need to know about every consumer. With the protocol, a LinkedList you wrote today works with a consumer written next year.

Laziness: a toArray method builds the whole result before anything can read it. An iterator produces one value per next() call, so a sequence can be infinite, can stop early without having done the remaining work, and can be backed by a file or a network cursor without holding everything in memory. Destructuring two values from a million-element range makes three calls to next, not a million.

The cost is that an iterator is one-shot and stateful, which is why the iterable is a separate role that hands out fresh iterators.`,
    explanation: `Speed is a side effect of laziness, not the reason, and arrays are not slow. The point is that the protocol does not require building anything.

Strings could have had a toArray. They chose the protocol for the same reasons everything else did.

Generators came along with the protocol and are a convenient way to implement it, but the protocol is the contract and a generator is one of many implementations.`,
    hints: [
      'What does a consumer need to know about a collection under each design?',
      'When does each design do its work?',
    ],
    tags: ['iteration', 'design'],
  },
  {
    id: 'one-shot-iterator-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const set = new Set(['a', 'b'])
const keys = set.keys()
console.log([...keys].length, [...keys].length, [...set].length)`,
    options: ['2 2 2', '2 0 2', '2 0 0', 'It throws: keys is not iterable'],
    correctOption: 1,
    answerInFull: `2 0 2

set.keys() returns an iterator. It is also iterable, because its Symbol.iterator returns itself, so the first spread works and drains it. The second spread asks the same iterator for its iterator, gets the same exhausted object back, and reads nothing.

The Set itself hands out a fresh iterator on every Symbol.iterator call, so spreading it gives 2 every time.

The rule: spread the collection, not a stored iterator, unless you mean to consume it once.`,
    explanation: `2 2 2 treats the iterator as reusable. A Set is; its iterator is not.

2 0 0 would mean spreading the iterator somehow exhausted the Set. The Set was never touched, only read through a fresh iterator at the end.

The built-in iterators are iterable, so nothing throws. That is precisely what makes the second 0 surprising rather than loud.`,
    hints: ['What does keys() return, and what does its Symbol.iterator return?'],
    tags: ['iteration', 'collections'],
  },
  {
    id: 'for-in-on-array-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Why is for...in the wrong loop for an array?',
    options: [
      'It iterates in reverse order',
      'It yields the indexes as strings, includes any enumerable property added to the array or its prototype, and is not the iteration protocol at all',
      'It skips holes, while for...of visits them',
      'It cannot be used with break',
    ],
    correctOption: 1,
    answerInFull: `for...in enumerates the enumerable string keys of an object and everything it inherits. On an array that means "0", "1", "2" as strings rather than numbers, plus any property someone attached to the array, plus anything enumerable someone added to Array.prototype. It has nothing to do with Symbol.iterator.

for...of goes through the array's iterator and yields the elements, which is what a loop over an array means.

The practical tell: arr[i] + 1 in a for...in body does string concatenation, because i is "0" rather than 0.`,
    explanation: `Order for integer keys is ascending in practice, which is not the problem.

for...in does skip holes, and so does every callback method. for...of visits them as undefined. Skipping holes is not the reason to avoid it.

break works in for...in as in any loop.`,
    hints: ['What does for...in walk, and what type are the things it yields?'],
    tags: ['iteration', 'loops'],
  },
  {
    id: 'string-iteration-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `const s = 'a😀'
console.log(s.length, [...s].length, s.split('').length)`,
    options: ['3 2 3', '2 2 2', '3 3 3', '3 2 2'],
    correctOption: 0,
    answerInFull: `3 2 3

length counts UTF-16 code units. The emoji is outside the basic plane, so it is stored as a surrogate pair: two code units. 'a' plus two is 3.

The string iterator walks code points, not code units. It yields 'a' and then the whole emoji as one element, so spread gives 2.

split('') cuts between code units, so it gives the 'a' and two half-characters: 3, with the middle and last entries being lone surrogates that do not render.

This is the one case where [...str] and str.split('') disagree, and the iterator is the one that is right.`,
    explanation: `2 2 2 assumes length counts characters. It counts code units, and has since the language was designed around UCS-2.

3 3 3 assumes the iterator walks code units like length does. It was designed later and walks code points.

3 2 2 assumes split('') is code point aware. It is a plain split on the empty string between every code unit.`,
    hints: ['What unit does length count, and what unit does the string iterator yield?'],
    tags: ['iteration', 'strings'],
  },
]
