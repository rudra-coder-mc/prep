import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'frames-alive-at-once',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Why does a deep recursion run out of stack when a loop doing the same work does not?',
    options: [
      'A recursive call costs more time than a loop iteration, and the engine aborts work that runs too long',
      'A frame cannot be popped until every call it made has returned, so all the levels of a recursion are alive at once; a loop enters and leaves a single frame',
      'Stack frames are freed by the garbage collector, which cannot run while the function is still calling itself',
      'It does not, unless the recursion is infinite: a recursion that reaches its base case cannot overflow',
    ],
    correctOption: 1,
    answerInFull: `The call stack is the engine's record of which calls are in progress. Every call pushes a frame holding its parameters, its local variables and the position to return to, and the frame is popped when the call returns - not before.

That last clause is the whole answer. None of the frames in a recursion can return until the innermost call does, so a recursion a thousand deep has a thousand frames alive at once, each with its own copy of the locals. A loop doing the same work enters and leaves one frame over and over, so only one is ever alive.

When there is no room for another frame the engine throws RangeError: Maximum call stack size exceeded. The limit is around ten thousand frames in a browser, but it depends on the engine and on the size of each frame, so it is not a number to design around.`,
    explanation: `The timing option confuses the stack with a watchdog. Nothing aborts work for being slow; a loop can run for an hour without the engine objecting, because time costs no frames.

The garbage collector has no say over the stack. Frames are popped by returning, never collected, which is its own question in this topic - the stack is not the heap.

"Only infinite recursion overflows" is the belief that makes this topic's production incident surprising. Termination and depth are different properties: a walk that would finish in a millisecond still dies if the data nests deeply enough, because the frames exist all at once whether or not the end is coming.`,
    hints: ['What has to be true before a frame can be removed?'],
    tags: ['call-stack', 'recursion'],
  },
  {
    id: 'countdown-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-1',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function countdown(n) {
  if (n === 0) return
  console.log('down', n)
  countdown(n - 1)
  console.log('up', n)
}

countdown(3)`,
    items: ['up 1', 'down 3', 'down 0', 'up 3', 'down 1', 'up 0', 'down 2', 'up 2'],
    correctOrder: [1, 6, 4, 0, 7, 3],
    answerInFull: `down 3, down 2, down 1, then up 1, up 2, up 3

The first log sits before the recursive call, so the three down lines print on the way in, as the stack grows: each call logs its own n and then descends.

The second log sits after the call, and a line after a recursive call cannot run until that call has completely finished. By the time the base case returns, three frames are each waiting to run their second log, and they run innermost first as the stack unwinds. That is why the up lines come out in the opposite order to the down lines.

Anything you write after a recursive call happens on the way back up. That is the mechanism behind post-order traversal, and behind reversing a list by recursion.`,
    explanation: `down 0 and up 0 are the frame everybody adds. countdown(0) is a real call and a real frame, but the base case returns before either log runs, so the deepest call prints nothing. The logging stops one call short of where the calls stop.

The other misreading is not in the pool because it uses the pool's own words: up 3, up 2, up 1, mirroring the downs. Building that sequence out of the real lines is the wrong answer this question exists to catch - the up lines run innermost first, not in the order their frames were created.`,
    hints: ['Which log is before the recursive call, and which is after?'],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'base-case-missing',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This throws RangeError: Maximum call stack size exceeded for every input, even an empty array. Why?',
    code: `function sum(list) {
  const total = list[0] + sum(list.slice(1))
  if (list.length === 0) return 0
  return total
}`,
    options: [
      'slice(1) returns a copy of the whole array rather than removing the first element, so every call sees the same list',
      'Each slice allocates a new array, and the heap fills up before the base case can be reached',
      'The base case is unreachable: the first line recurses before the check, and slicing an empty array gives another empty array, so the descent never stops',
      'list[0] is undefined once the array is empty, and adding undefined to a number throws before the base case runs',
    ],
    correctOption: 2,
    answerInFull: `The base case exists but can never run. The first line of every invocation calls sum again, so the length check is dead code: even sum([]) recurses before it can return 0, and slicing an empty array gives another empty array, so the descent never stops until the stack does.

The fix is to check the base case before recursing:

  function sum(list) {
    if (list.length === 0) return 0
    return list[0] + sum(list.slice(1))
  }

That is correct, and it is still a poor use of recursion. Each level allocates a new array with slice, so summing n elements allocates n arrays and holds n frames to add numbers. A loop, or reduce, does it in one frame with no allocation. Recursion pays for itself on tree shaped data, not on a flat list.

The rule this illustrates: a recursive function has to be able to stop before it can be allowed to continue. The base case comes first, always.`,
    explanation: `The slice option misremembers the API: slice(1) really does drop the first element. It is slice with no arguments, or a confusion with splice, that copies everything - and notice the conclusion would be right anyway, which is why checking the stated mechanism matters more than checking where an option ends up.

The heap option blames the right allocations for the wrong failure. The arrays pile up too, but each frame costs stack the moment the call is made, and the stack is thousands of times smaller than the heap, so it dies first - and the error names it.

The last option invents a throw. Adding undefined to a number makes NaN, silently; and in this program no addition ever completes at all, because every call descends before its + has both operands.`,
    hints: ['Which line runs first in every call?', 'What does slice do on an empty array?'],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'flatten-explicit-stack',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are rewriting a recursive flatten(list) as a loop, so that input nesting depth can no longer overflow the stack. What replaces the call stack?',
    options: [
      'A depth counter, incremented on the way into a nested array and decremented on the way out',
      'A closure per level of nesting, which the engine keeps alive on the heap automatically',
      'Nothing can: enough iterations overflow the stack just as enough calls do, so the rewrite only raises the limit',
      'An array of items still to visit: the loop takes one off, and a nested array puts its contents back on, so depth costs heap instead of frames',
    ],
    correctOption: 3,
    answerInFull: `An array holding the work not yet done, which is exactly what the call stack was holding for the recursive version.

// Recursive: reads well, and its depth is the nesting depth of the input.
function flatten(list) {
  const out = []
  for (const item of list) {
    if (Array.isArray(item)) out.push(...flatten(item))
    else out.push(item)
  }
  return out
}

// Iterative: the same traversal with the stack held in an array, so nesting
// depth costs heap rather than frames.
function flattenIterative(list) {
  const out = []
  const pending = [...list]

  while (pending.length > 0) {
    const item = pending.shift()
    if (Array.isArray(item)) pending.unshift(...item)
    else out.push(item)
  }

  return out
}

Using shift and unshift preserves order at the cost of moving the array on every step; pushing and popping from the end is faster and reverses the result, so it needs a final reverse. Say which trade you took.

One more limit worth naming: out.push(...flatten(item)) spreads an array into arguments, so a flattened chunk of a hundred thousand elements is a call with a hundred thousand arguments, which has its own limit. Pushing in a loop, or concat, avoids that.`,
    explanation: `The depth counter remembers how deep you are, not what is left to do. The stack's job was never the depth - it was the pending work, and only a collection can hold that.

The closure option is a true fact from the closures topic applied to nothing. Closures do outlive their frames on the heap, but a loop body creates no closure per level of nesting, and the engine automates none of this.

"Enough iterations overflow the stack" confuses iterations with depth. Frames accumulate because calls nest before returning; a loop's millionth iteration runs in the same frame as its first, so there is nothing to run out of.`,
    hints: ['What was the call stack holding for the recursive version?'],
    tags: ['recursion', 'arrays'],
  },
  {
    id: 'fib-call-count',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `let calls = 0

function fib(n) {
  calls += 1
  return n < 2 ? n : fib(n - 1) + fib(n - 2)
}

fib(10)
console.log(calls)`,
    options: ['55', '109', '1024', '177'],
    correctOption: 3,
    answerInFull: `177

Each call above the base case makes two more, so the number of calls follows the same recurrence as the sequence itself: calls(n) = 1 + calls(n - 1) + calls(n - 2). That gives 1, 1, 3, 5, 9, 15, 25, 41, 67, 109, 177.

The growth is exponential, roughly 1.6 to the n, because the same subtrees are recomputed over and over. fib(8) alone is calculated twice, fib(7) three times, and so on down.

The important part is that this is not a stack depth problem. The deepest the stack ever gets is 10. Memoising the results fixes it and rewriting it as a loop fixes it, but neither is fixing the stack, because the stack was never the issue.`,
    explanation: `55 is fib(10) itself. The program prints the counter, not the result, and reading past the calls variable is a misread this question is deliberately inviting.

109 is the count one step early: calls(9). The recurrence has to be run all the way out, and an off by one is the natural way to lose it.

1024 is 2 to the 10, from rounding "each call makes two more" up to a full binary tree. The tree is not full - the n < 2 calls make none, and every fib(n - 2) branch bottoms out sooner - which is why the real count grows at about 1.6 to the n rather than 2 to the n.`,
    hints: ['How many calls does each non-base call make?'],
    tags: ['recursion', 'performance'],
  },
  {
    id: 'deep-json-walker',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'A recursive function that walks API responses to redact fields has started throwing RangeError in production. It has worked for a year. What do you do?',
    answerInFull: `The function is almost certainly fine and the data has changed. Something upstream is now returning a document nested deeper than the stack allows, or nested in a way that never ends.

What I would check first:

- Is the data actually cyclic? A response assembled by an ORM can easily contain an object that references itself, and no depth limit will save a walker with no cycle detection. A WeakSet of visited objects is the fix.
- If it is genuinely deep, rewrite the walk with an explicit stack: an array of nodes still to visit, and a loop that runs until it is empty. Depth then costs heap, which is far larger than the stack.
- Either way, add a depth limit and reject beyond it. This walks data that came from outside the process, so the caller currently chooses the stack depth, and that is worth closing regardless of what caused this incident.

For an immediate mitigation, catching the RangeError lets the request fail cleanly instead of taking the process down, but it is not a fix: the stack has already unwound and the work is lost.`,
    explanation: `The reasoning that matters is that "it worked for a year" points at the input, not the code. Recursion over untrusted data is a control the caller has over your process, in the same family as an unbounded request body, and the durable answer is a depth limit plus an iterative walk rather than a bigger stack.`,
    hints: ['What changed, given the function did not?'],
    tags: ['recursion', 'call-stack', 'reliability'],
  },
  {
    id: 'recursion-or-loop',
    type: 'interview',
    form: 'choice',
    tier: 'senior',
    prompt: 'How do you decide between recursion and a loop?',
    options: [
      'Prefer whichever reads better: modern engines make recursion and loops equivalent in both speed and depth',
      'Let the data decide: recursion for tree shaped data whose depth something bounds, a loop for flat data, and a loop with an explicit stack when the depth comes from outside the program',
      'Prefer a loop whenever performance matters, since the function calls are always the dominant cost',
      'Write the recursion as a tail call, which the engine eliminates, and the choice stops mattering',
    ],
    correctOption: 1,
    answerInFull: `The shape of the data decides it more than taste does.

Recursion when the data is a tree or a graph. A tree walk written as a loop has to carry its own stack, so the recursive version is shorter and reads much closer to the problem. Parsers, traversals and divide-and-conquer algorithms are all this case.

A loop when the data is flat, or when the depth is not bounded by anything you control. Recursing down a list to add numbers costs a frame per element and buys nothing, and recursing over data that came from outside the program lets the caller choose your stack depth.

Worth weighing alongside the shape: whether the recursion is doing repeated work, in which case memoising matters more than the choice of loop or recursion, and which version the next reader will understand faster - usually recursion for a tree and a loop for a list.

And the practical note: JavaScript has no reliable tail call elimination, so a recursion that would be safe in a language that does have it is not safe here.`,
    explanation: `"Equivalent in both speed and depth" would be true in a language with tail call elimination, and JavaScript is not one in practice. Readability is a real criterion; the equivalence claimed to make it the only one is not.

The performance option optimises the wrong cost. Call overhead is rarely what hurts: the fib question in this topic makes 177 calls to compute a number that needs eleven, and that redundancy dwarfs the price of any individual call. A slow recursion is usually recomputing, and memoising fixes that in either style.

Tail calls are in the specification and shipped only by JavaScriptCore, so writing one changes nothing in V8 or SpiderMonkey. The frames stay, and so does the choice.`,
    hints: [],
    tags: ['recursion', 'design'],
  },
  {
    id: 'catching-the-overflow',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `function depth(n) {
  try {
    return depth(n + 1)
  } catch (error) {
    return n
  }
}

console.log(typeof depth(0))`,
    options: [
      'number',
      'object',
      'undefined',
      'Nothing: the RangeError from a stack overflow cannot be caught',
    ],
    correctOption: 0,
    answerInFull: `number

Each call recurses until pushing another frame fails, at which point the engine throws a RangeError. That error is an ordinary throwable, so the catch in the frame that was trying to make the call handles it and returns n.

That number then travels back up through every waiting frame, because each one returns the result of its own call unchanged, so depth(0) evaluates to the depth that was reached.

The reason the question asks for the type is that the number itself is not fixed. It depends on the engine, on how much stack the surrounding code has already used, and on the size of this frame, so the same program prints a different value on a different day. That variability is the reason not to design around the limit.`,
    explanation: `object is the right type for the wrong value. The catch really does receive a RangeError, and typeof on an error says object - but the function returns n, a number it had all along, not the thing it caught.

undefined imagines the failed call returning nothing. The call that hit the limit never started: pushing its frame is what failed. The frame that tried to push it is intact, runs its catch, and returns normally.

Treating the overflow as fatal imports the rule from other platforms. Running out of heap really is unrecoverable; running out of stack here is an ordinary RangeError thrown at the point of the call, and any frame on the way down can catch it.`,
    hints: ['Is a RangeError catchable, and which frame catches it?'],
    tags: ['recursion', 'call-stack', 'errors'],
  },
  {
    id: 'overflow-error-choice',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does a runaway recursion throw?',
    options: [
      'InternalError, in every engine',
      'RangeError: Maximum call stack size exceeded',
      'Nothing; the tab freezes until it is killed',
      'StackOverflowError',
    ],
    correctOption: 1,
    answerInFull:
      'V8 reports a RangeError with that message. SpiderMonkey throws an InternalError with a different wording, so the message is not something to match on, but RangeError is the answer expected. A frozen tab is what an infinite loop does, and it is a useful contrast: a loop never runs out of stack because it never pushes a frame.',
    hints: [],
    tags: ['recursion', 'errors'],
  },
  {
    id: 'tail-call-choice',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt: 'What is the state of tail call optimisation in JavaScript?',
    options: [
      'It is in the specification and implemented by every modern engine',
      'It is not in the specification, and never was',
      'It is in the specification, but only JavaScriptCore implements it',
      'It applies automatically to any function whose last statement is a call',
    ],
    correctOption: 2,
    answerInFull:
      'Proper tail calls landed in ES2015, and JavaScriptCore, which is Safari, is the only engine that shipped them. V8 and SpiderMonkey declined, mostly over the effect on stack traces and debugging. So the feature is real and unusable in practice: write tail calls if you prefer them, and never rely on them for depth. The last option is also wrong on its own terms, since a tail call means the call result is returned directly with nothing left to do, which excludes something like return n * f(n - 1).',
    hints: [],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'frame-lifetime-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When is a stack frame removed?',
    options: [
      'When the function returns or throws',
      'When the last line of the function is reached',
      'When the garbage collector next runs',
      'When the function makes its own next call',
    ],
    correctOption: 0,
    answerInFull:
      'A frame lives until its call completes, whether that is by returning a value or by an exception unwinding through it. Reaching the last line is not enough on its own, since that line may itself be a call that has to finish first. The garbage collector has no say: the stack is not the heap, and frames are not collected. And a function making a call adds a frame on top rather than removing its own, which is exactly why recursion accumulates them.',
    hints: [],
    tags: ['call-stack'],
  },
]
