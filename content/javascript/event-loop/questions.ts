import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'ordering-basic',
    type: 'output',
    difficulty: 'medium',
    prompt: 'What is the output order, and why?',
    code: `console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')`,
    expectedAnswer: `1, 4, 3, 2

Synchronous code runs to completion first, so 1 and 4 print immediately. When the
call stack empties, the microtask queue is drained before anything else, so the
promise callback prints 3. Only then does the loop take a macrotask, printing 2.`,
    explanation: `The rule worth remembering is that microtasks are not a queue the loop visits in turn. They are drained completely after every task, before rendering and before the next macrotask. A zero-millisecond timer is not "as soon as possible"; it is "on the next macrotask turn, at the earliest".`,
    hints: ['What has to be true before any queued callback can run at all?'],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'microtask-vs-macrotask',
    type: 'concept',
    difficulty: 'medium',
    prompt:
      'What is the difference between a microtask and a macrotask, and which APIs produce each?',
    expectedAnswer: `A macrotask is one unit of work the event loop picks up per turn: timers, I/O callbacks, event handlers, message events. A microtask is work queued to run at the end of the current turn, before the loop picks up anything else.

Macrotasks: setTimeout, setInterval, setImmediate in Node, I/O, UI events.
Microtasks: promise reactions (.then, .catch, .finally), queueMicrotask, await continuations, MutationObserver.

The important asymmetry is that the entire microtask queue is drained after each macrotask, including microtasks queued by other microtasks. A macrotask queue is not drained; exactly one is taken per turn.`,
    explanation: `That asymmetry is what makes an infinite microtask loop freeze a page while an infinite chain of setTimeout does not. Microtasks starve everything below them, including rendering.`,
    hints: [],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'async-await-ordering',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `async function a() {
  console.log('a start')
  await b()
  console.log('a end')
}

async function b() {
  console.log('b')
}

console.log('script start')
a()
Promise.resolve().then(() => console.log('promise'))
console.log('script end')`,
    expectedAnswer: `script start
a start
b
script end
a end
promise`,
    explanation: `await splits the function in two. Everything up to the await runs synchronously, which is why "a start" and "b" print before "script end". What follows the await is scheduled as a microtask.

The subtle part is ordering between "a end" and "promise". The continuation of a() is queued when the await is reached, which happens before the Promise.resolve().then line runs, so a's continuation is first in the microtask queue.`,
    hints: [
      'How much of an async function runs synchronously?',
      'When exactly is each microtask queued?',
    ],
    tags: ['event-loop', 'async', 'promise'],
  },
  {
    id: 'blocking-loop',
    type: 'debugging',
    difficulty: 'medium',
    prompt:
      'A user reports the page freezes for two seconds when they click a button. The handler is below. What is wrong, and what would you do?',
    code: `button.addEventListener('click', () => {
  const result = expensiveSynchronousWork()
  render(result)
})`,
    expectedAnswer: `The work runs on the same thread as rendering and event handling. Until the handler returns, the call stack is occupied, so nothing else can run: no repaint, no other events, no timers, no promise callbacks. "Asynchronous" does not mean "parallel" and there is no second thread to fall back on.

Options, roughly in order of how much they help:
- Move the work to a Web Worker, which is the only way to genuinely run it elsewhere.
- Break it into chunks and yield between them, with setTimeout, scheduler.yield, or requestIdleCallback.
- Do less work: memoise, precompute, or do it on the server.

Wrapping it in a promise changes nothing, because the body still runs synchronously.`,
    explanation: `The last point is the one interviewers are usually probing. Promise.resolve().then(expensiveWork) still blocks; it just blocks slightly later. Only a worker moves the work off the main thread.`,
    hints: ['What else needs the main thread while this runs?'],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'nested-microtasks',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What order do these print?',
    code: `setTimeout(() => console.log('timeout'), 0)

Promise.resolve().then(() => {
  console.log('micro 1')
  Promise.resolve().then(() => console.log('micro 2'))
})`,
    expectedAnswer: `micro 1, micro 2, timeout`,
    explanation: `A microtask queued from inside a microtask joins the same drain, so micro 2 runs before the loop moves on. The queue is emptied, not merely visited once. This is exactly why an unbounded chain of microtasks can lock a page while a timer chain cannot.`,
    hints: ['Is the microtask queue drained once, or repeatedly until empty?'],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'settimeout-delay',
    type: 'interview',
    difficulty: 'medium',
    prompt: 'Does setTimeout(fn, 1000) guarantee fn runs in exactly one second? Explain.',
    expectedAnswer: `No. It guarantees a minimum delay, not an exact time. After 1000ms the callback becomes eligible, and it runs when the loop next takes a macrotask and the stack is empty. If synchronous work is running, or a long queue is ahead of it, it runs later.

Two extra details worth knowing:
- Nested timers are clamped to a minimum of about 4ms after several levels of nesting.
- Background or hidden tabs throttle timers heavily, often to once per second or worse.`,
    explanation: `The practical consequence is that timers are unsuitable for animation or precise scheduling. requestAnimationFrame exists for the former, and for measuring elapsed time you read the clock rather than counting timer fires.`,
    hints: [],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'render-timing',
    type: 'scenario',
    difficulty: 'hard',
    prompt:
      'You set an element to display a loading spinner, then immediately run a long synchronous task. The spinner never appears. Why?',
    expectedAnswer: `Changing the DOM does not paint. It marks the document as needing layout and paint, which happens when the browser gets the main thread back, after the current task and all its microtasks have finished. The long task never releases the thread, so the frame containing the spinner is never rendered.

Fixes: yield to the loop before starting the work, so a frame can be painted, or move the work to a worker.`,
    explanation: `Rendering sits between macrotasks in the loop, alongside them rather than above them. That single fact explains most "my UI does not update until the end" bugs, and it is also why forcing a synchronous layout read does not help.`,
    hints: ['When does a DOM change actually reach the screen?'],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'starvation',
    type: 'coding',
    difficulty: 'hard',
    prompt:
      'Write a function that processes a large array without blocking the page, yielding to the event loop between chunks.',
    expectedAnswer: `async function processInChunks(items, work, chunkSize = 500) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    for (const item of chunk) work(item)

    // Yield with a macrotask, so rendering and input get a turn.
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}`,
    explanation: `The critical detail is yielding with a macrotask rather than a microtask. Awaiting Promise.resolve() would queue a microtask, which runs in the same drain and never lets the browser render, so the page would still freeze.

In modern browsers scheduler.yield() is the purpose-built version of this.`,
    hints: ['What kind of task do you have to yield with for the browser to paint?'],
    tags: ['event-loop', 'performance', 'async'],
  },
]
