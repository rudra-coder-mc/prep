import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-a-frame-holds',
    type: 'concept',
    difficulty: 'easy',
    prompt:
      'What is the call stack, what does one frame hold, and why does recursion run out of it when a loop does not?',
    expectedAnswer: `The call stack is the engine's record of which calls are currently in progress. Every call pushes a frame holding that call's parameters, its local variables, and the position to return to. The frame is popped when the function returns, and not before.

Recursion runs out because none of the frames can return until the innermost one does, so a recursion a thousand deep has a thousand frames alive at once, each with its own copy of the locals. A loop doing the same work enters and leaves one frame repeatedly, so only one is ever alive.

When there is no room for another frame the engine throws RangeError: Maximum call stack size exceeded. The limit is roughly ten thousand frames in a browser, but it depends on the engine and on how big each frame is, so it is not a number to rely on.`,
    explanation: `The detail that makes this answer sound like experience rather than a definition is "popped when the function returns, and not before". It explains the memory cost, it explains why the work in a recursion happens on the way back up, and it is the same fact the event loop topic builds on, since the loop can only take a turn once the stack is empty.`,
    hints: ['What has to be true before a frame can be removed?'],
    tags: ['call-stack', 'recursion'],
  },
  {
    id: 'countdown-order',
    type: 'output',
    difficulty: 'easy',
    prompt: 'What does this print, in order?',
    code: `function countdown(n) {
  if (n === 0) return
  console.log('down', n)
  countdown(n - 1)
  console.log('up', n)
}

countdown(3)`,
    expectedOutput: `down 3
down 2
down 1
up 1
up 2
up 3`,
    explanation: `The first log runs before the recursive call, so all three "down" lines print as the stack grows. The recursive call then has to finish completely before the line after it runs.

By the time the base case returns, three frames are sitting there each waiting to run their own second log, and they run innermost first as the stack unwinds. That is why the "up" lines come out in the opposite order.

Anything you write after the recursive call happens on the way back up, and that is the mechanism behind post-order traversals and behind reversing a list by recursion.`,
    hints: ['Which log is before the recursive call, and which is after?'],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'base-case-missing',
    type: 'debugging',
    difficulty: 'medium',
    prompt:
      'This throws RangeError: Maximum call stack size exceeded for every input, including a two-element array. Explain why and fix it.',
    code: `function sum(list) {
  const total = list[0] + sum(list.slice(1))
  if (list.length === 0) return 0
  return total
}`,
    expectedAnswer: `There are two problems and they compound.

The base case is written after the recursive call, so it is unreachable. The first line of every invocation calls sum again, and slicing an empty array gives another empty array, so the descent never stops.

The fix is to check the base case before recursing:

  function sum(list) {
    if (list.length === 0) return 0
    return list[0] + sum(list.slice(1))
  }

That is correct, but it is still a poor use of recursion. Each level allocates a new array with slice, so summing n elements allocates n arrays and uses n frames to add numbers. A loop, or reduce, does it in one frame with no allocation. Recursion pays for itself on tree-shaped data, not on a flat list.`,
    explanation: `The rule this illustrates is that a recursive function has to be able to stop before it can be allowed to continue: the base case comes first, always. The second half of the answer is what an interviewer is really hoping for, since noticing that the recursion is wrong for the shape of the data is a better observation than fixing the ordering.`,
    hints: ['Which line runs first in every call?', 'What does slice do on an empty array?'],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'flatten-both-ways',
    type: 'coding',
    difficulty: 'medium',
    prompt:
      'Write flatten(list), which flattens an arbitrarily nested array into a single level, first recursively and then iteratively, without using Array.prototype.flat.',
    expectedAnswer: `// Recursive: reads well, and its depth is the nesting depth of the input.
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
}`,
    explanation: `The recursive version is the one to write first, because it is shorter and says what it means. Its limit is that the depth of the recursion is the nesting depth of the input, so data that came from outside the program can choose your stack depth.

The iterative version moves the pending work into an array. Using shift and unshift preserves order at the cost of shifting the array each time; pushing and popping from the end is faster and reverses the result, so it needs a final reverse or a reversed push. Say which trade you took.

Worth mentioning either way: out.push(...flatten(item)) spreads an array into arguments, so a flattened chunk of a hundred thousand elements is a call with a hundred thousand arguments, which has its own limit. out.push(item) inside a loop, or concat, avoids that.`,
    hints: [
      'What is the base case, and what is the recursive case?',
      'What plays the part of the stack in the iterative version?',
      'What happens if the input is nested ten thousand deep?',
    ],
    tags: ['recursion', 'arrays'],
  },
  {
    id: 'fib-call-count',
    type: 'output',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `let calls = 0

function fib(n) {
  calls += 1
  return n < 2 ? n : fib(n - 1) + fib(n - 2)
}

fib(10)
console.log(calls)`,
    expectedOutput: '177',
    explanation: `Each call above the base case makes two more, so the number of calls follows the same recurrence as the sequence itself: calls(n) = 1 + calls(n - 1) + calls(n - 2). That gives 1, 1, 3, 5, 9, 15, 25, 41, 67, 109, 177.

The growth is exponential, roughly 1.6 to the n, because the same subtrees are recomputed over and over. fib(8) alone is calculated twice, fib(7) three times, and so on down.

The important part is that this is not a stack depth problem. The deepest the stack ever gets is 10. Memoising the results fixes it and rewriting it as a loop fixes it, but neither is fixing the stack, because the stack was never the issue.`,
    hints: ['How many calls does each non-base call make?'],
    tags: ['recursion', 'performance'],
  },
  {
    id: 'deep-json-walker',
    type: 'scenario',
    difficulty: 'hard',
    prompt:
      'A recursive function that walks API responses to redact fields has started throwing RangeError in production. It has worked for a year. What do you do?',
    expectedAnswer: `The function is almost certainly fine and the data has changed. Something upstream is now returning a document nested deeper than the stack allows, or nested in a way that never ends.

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
    difficulty: 'medium',
    prompt: 'How do you decide between recursion and a loop?',
    expectedAnswer: `The shape of the data decides it more than taste does.

Recursion when the data is a tree or a graph. A tree walk written as a loop has to carry its own stack, so the recursive version is shorter and reads much closer to the problem. Parsers, traversals and divide-and-conquer algorithms are all this case.

A loop when the data is flat, or when the depth is not bounded by anything you control. Recursing down a list to add numbers costs a frame per element and buys nothing.

The things I would weigh:
- How deep can the input get, and does that depth come from outside the program?
- Is the recursion doing repeated work, in which case memoising matters more than the choice of loop or recursion?
- Which version will the next reader understand faster? That is usually recursion for a tree and a loop for a list.

And the practical note: JavaScript has no reliable tail call elimination, so a recursion that would be safe in a language that does have it is not safe here.`,
    explanation: `The answer interviewers want is a criterion rather than a preference. "Recursion for tree-shaped data, a loop for flat data, and an explicit stack when the depth is not mine to bound" is a rule they can hear you applying. Adding the tail call point shows you know why the advice differs from what you may have been taught in another language.`,
    hints: [],
    tags: ['recursion', 'design'],
  },
  {
    id: 'catching-the-overflow',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `function depth(n) {
  try {
    return depth(n + 1)
  } catch (error) {
    return n
  }
}

console.log(typeof depth(0))`,
    expectedOutput: 'number',
    explanation: `Each call recurses until pushing another frame fails, at which point the engine throws a RangeError. That error is an ordinary throwable, so the catch in the frame that was trying to make the call handles it and returns n.

That number then travels back up through every waiting frame, because each one returns the result of its own call unchanged, so depth(0) evaluates to the depth that was reached.

The reason the question asks for the type is that the number itself is not fixed. It depends on the engine, on how much stack the surrounding code has already used, and on the size of this frame, so the same program prints a different value on a different day. That variability is the reason not to design around the limit.`,
    hints: ['Is a RangeError catchable, and which frame catches it?'],
    tags: ['recursion', 'call-stack', 'errors'],
  },
  {
    id: 'overflow-error-mcq',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'What does a runaway recursion throw?',
    options: [
      'InternalError, in every engine',
      'RangeError: Maximum call stack size exceeded',
      'Nothing; the tab freezes until it is killed',
      'StackOverflowError',
    ],
    correctOption: 1,
    explanation:
      'V8 reports a RangeError with that message. SpiderMonkey throws an InternalError with a different wording, so the message is not something to match on, but RangeError is the answer expected. A frozen tab is what an infinite loop does, and it is a useful contrast: a loop never runs out of stack because it never pushes a frame.',
    hints: [],
    tags: ['recursion', 'errors'],
  },
  {
    id: 'tail-call-mcq',
    type: 'mcq',
    difficulty: 'medium',
    prompt: 'What is the state of tail call optimisation in JavaScript?',
    options: [
      'It is in the specification and implemented by every modern engine',
      'It is not in the specification, and never was',
      'It is in the specification, but only JavaScriptCore implements it',
      'It applies automatically to any function whose last statement is a call',
    ],
    correctOption: 2,
    explanation:
      'Proper tail calls landed in ES2015, and JavaScriptCore, which is Safari, is the only engine that shipped them. V8 and SpiderMonkey declined, mostly over the effect on stack traces and debugging. So the feature is real and unusable in practice: write tail calls if you prefer them, and never rely on them for depth. The last option is also wrong on its own terms, since a tail call means the call result is returned directly with nothing left to do, which excludes something like return n * f(n - 1).',
    hints: [],
    tags: ['recursion', 'call-stack'],
  },
  {
    id: 'frame-lifetime-mcq',
    type: 'mcq',
    difficulty: 'medium',
    prompt: 'When is a stack frame removed?',
    options: [
      'When the function returns or throws',
      'When the last line of the function is reached',
      'When the garbage collector next runs',
      'When the function makes its own next call',
    ],
    correctOption: 0,
    explanation:
      'A frame lives until its call completes, whether that is by returning a value or by an exception unwinding through it. Reaching the last line is not enough on its own, since that line may itself be a call that has to finish first. The garbage collector has no say: the stack is not the heap, and frames are not collected. And a function making a call adds a frame on top rather than removing its own, which is exactly why recursion accumulates them.',
    hints: [],
    tags: ['call-stack'],
  },
]
