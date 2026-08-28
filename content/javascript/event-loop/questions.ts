import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'ordering-basic',
    type: 'output',
    form: 'ordering',
    tier: 'swe-1',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve()
  .then(() => console.log('3'))
  .catch(() => console.log('caught'))
console.log('4')`,
    items: ['3', '1', 'caught', '2', '4'],
    correctOrder: [1, 4, 0, 3],
    answerInFull: `1, 4, 3, 2

Synchronous code runs to completion first, so 1 and 4 print immediately. When the
call stack empties, the microtask queue is drained before anything else, so the
promise callback prints 3. Only then does the loop take a macrotask, printing 2.

Nothing prints "caught". The promise is already resolved, so the chain has no
rejection to handle and the catch callback is never called at all.`,
    explanation: `The rule is that microtasks are not a queue the loop visits in turn. They are drained completely after every task, before rendering and before the next macrotask. A zero-millisecond timer is not "as soon as possible"; it is "on the next macrotask turn, at the earliest".`,
    hints: ['What has to be true before any queued callback can run at all?'],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'microtask-vs-macrotask',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Which of these runs as a macrotask?',
    options: [
      'The callback passed to queueMicrotask',
      'A click handler, when the user clicks',
      'The code after an await inside an async function',
      'A .finally handler on a promise that has already settled',
    ],
    correctOption: 1,
    answerInFull: `The click handler. A UI event is a macrotask, the same as a timer or an I/O callback, and it is worth saying out loud because most answers list setTimeout and stop.

A macrotask is one unit of work the event loop picks up per turn: timers, I/O callbacks, event handlers, message events. A microtask is work queued to run at the end of the current turn, before the loop picks up anything else.

Macrotasks: setTimeout, setInterval, setImmediate in Node, I/O, UI events.
Microtasks: promise reactions (.then, .catch, .finally), queueMicrotask, await continuations, MutationObserver.

The important asymmetry is that the entire microtask queue is drained after each macrotask, including microtasks queued by other microtasks. The macrotask queue is not drained: exactly one is taken per turn.

That asymmetry is what makes an infinite microtask loop freeze a page while an infinite chain of setTimeout does not. Microtasks starve everything below them, including rendering.`,
    explanation: `queueMicrotask names itself, which is why it is in the list. It is the control the other three are read against.

The code after an await is the one people miss. An async function looks like a function, so its second half looks like ordinary code, and it is a promise reaction like any other.

.finally is tempting because it sounds like cleanup that happens outside the chain, in the way a finally block does. It is a promise reaction, so it queues a microtask, and whether the promise had already settled changes when it is queued rather than which queue it joins.`,
    hints: [],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'async-await-ordering',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
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
    options: [
      'script start, a start, b, script end, promise, a end',
      'script start, script end, a start, b, a end, promise',
      'script start, a start, b, script end, a end, promise',
      'script start, a start, script end, b, a end, promise',
    ],
    correctOption: 2,
    answerInFull: `script start, a start, b, script end, a end, promise

await splits the function in two. Everything up to the await runs synchronously, which is why "a start" and "b" print before "script end": calling a() runs its body, calling b() runs its body, and only then does the await suspend a() and hand the thread back to the script.

What follows the await is scheduled as a microtask. The subtle part is the order of the last two lines. The continuation of a() is queued at the moment the await is reached, which happens before the Promise.resolve().then line has run at all, so it sits first in the microtask queue and prints first.

The rule to state is two sentences. An async function is synchronous up to its first await, and microtasks run in the order they were queued.`,
    explanation: `Swapping the last two lines is the most common wrong answer, and it comes from reading a() as scheduling something rather than running it. The .then is written later in the file, so it looks later in the queue. What decides the queue is when the await was reached, and that had already happened.

Putting "script end" straight after "script start" is the belief that async defers a whole function. It does not. async makes the function return a promise and allows await inside it, and neither of those postpones the body.

The last order suspends a() at the call to b() rather than at the await, which pushes "b" past "script end". b() is an ordinary call: its body runs immediately, and the promise it returns is what the await then waits on.`,
    hints: [
      'How much of an async function runs synchronously?',
      'When exactly is each microtask queued?',
    ],
    tags: ['event-loop', 'async', 'promise'],
  },
  {
    id: 'blocking-loop',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A user reports the page freezes for two seconds when they click the button. Which change fixes it, for the right reason?',
    code: `button.addEventListener('click', () => {
  const result = expensiveSynchronousWork()
  render(result)
})`,
    options: [
      'Wrap the work in a promise and await it, so the rest of the page keeps running while it resolves',
      'Schedule the work with setTimeout(fn, 0), so the handler returns and the page stays responsive',
      'Move the work to a Web Worker, which is the only one of these that runs it anywhere else',
      'Mark the handler async, so the browser can interleave rendering with its body',
    ],
    correctOption: 2,
    answerInFull: `Move the work to a Web Worker.

The work runs on the same thread as rendering and event handling. Until the handler returns, the call stack is occupied, so nothing else can run: no repaint, no other events, no timers, no promise callbacks. "Asynchronous" does not mean "parallel" and there is no second thread to fall back on.

Options, roughly in order of how much they help:
- Move the work to a Web Worker, which is the only way to genuinely run it elsewhere.
- Break it into chunks and yield between them, with setTimeout, scheduler.yield or requestIdleCallback. The page then freezes in slices rather than in one block, which is enough for a spinner and for input.
- Do less work: memoise, precompute, or do it on the server.

Wrapping it in a promise changes nothing, because the body still runs synchronously.`,
    explanation: `The promise is what interviewers are usually probing for, because it is the reflex. Promise.resolve().then(expensiveWork) still blocks, it just blocks slightly later, in the microtask drain rather than in the handler.

setTimeout is the one to argue with rather than dismiss. It does let the click's own frame paint, so a spinner set beforehand appears, and then the page freezes for two seconds on the next turn. It moves the block, and chunking is what turns that into a fix.

async on the handler does nothing to its body. It makes the function return a promise and allows await inside, and neither of those interleaves anything with the work.`,
    hints: ['What else needs the main thread while this runs?'],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'nested-microtasks',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What order do these print?',
    code: `setTimeout(() => console.log('timeout'), 0)

Promise.resolve().then(() => {
  console.log('micro 1')
  Promise.resolve().then(() => console.log('micro 2'))
})`,
    options: [
      'timeout, micro 1, micro 2',
      'micro 1, micro 2, timeout',
      'micro 1, timeout, micro 2',
      'micro 1 and micro 2, and timeout never runs, because the nested microtask starves the loop',
    ],
    correctOption: 1,
    answerInFull: `micro 1, micro 2, timeout

A microtask queued from inside a microtask joins the same drain, so micro 2 runs before the loop moves on. The queue is emptied, not merely visited once.

That is the asymmetry of the loop in three lines: one macrotask per turn, but microtasks until there are none left. It is also exactly why an unbounded chain of microtasks can lock a page while a chain of timers cannot.`,
    explanation: `micro 1, timeout, micro 2 is the answer if the queue were drained by snapshot: everything waiting when the drain began, with anything queued during it left for next time. Engines do not do that, and the difference is what makes microtask starvation possible at all.

timeout first is the reading where a zero millisecond delay means "now". It is a minimum, and the microtask queue is drained before the loop takes any macrotask, however long the timer has been eligible.

The starvation option over-applies a true rule. An unbounded chain of microtasks really does starve the timer forever, but this chain is two long and it ends, so the loop carries on immediately afterwards.`,
    hints: ['Is the microtask queue drained once, or repeatedly until empty?'],
    tags: ['event-loop', 'async'],
  },
  {
    id: 'settimeout-delay',
    type: 'interview',
    form: 'open',
    tier: 'swe-2',
    prompt: 'Does setTimeout(fn, 1000) guarantee fn runs in exactly one second? Explain.',
    answerInFull: `No. It guarantees a minimum delay, not an exact time. After 1000ms the callback becomes eligible, and it runs when the loop next takes a macrotask and the stack is empty. If synchronous work is running, or a long queue is ahead of it, it runs later.

Two more details:
- Nested timers are clamped to a minimum of about 4ms after several levels of nesting.
- Background or hidden tabs throttle timers heavily, often to once per second or worse.`,
    explanation: `The practical consequence is that timers are unsuitable for animation or precise scheduling. requestAnimationFrame exists for the former, and for measuring elapsed time you read the clock rather than counting timer fires.`,
    hints: [],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'render-timing',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You set an element to show a loading spinner, then immediately run a long synchronous task. The spinner never appears. Which explanation fits?',
    options: [
      'The DOM change is queued as a microtask, so it only runs once the task has finished',
      'A DOM change marks the page as needing paint, and the browser cannot paint until the task releases the thread',
      'The browser drops frames it cannot deliver on time, so the spinner frame is skipped and the next one is already up to date',
      'Reading a layout property first would force the paint through, and nothing here reads one',
    ],
    correctOption: 1,
    answerInFull: `Changing the DOM does not paint. It marks the document as needing layout and paint, which happens when the browser gets the main thread back, after the current task and all its microtasks have finished. The long task never releases the thread, so the frame containing the spinner is never rendered.

Rendering sits between macrotasks in the loop, alongside them rather than above them. That single fact explains most "my UI does not update until the end" bugs.

Fixes: yield to the loop before starting the work, so a frame can be painted, or move the work to a worker.`,
    explanation: `Calling the DOM change a microtask is wrong in a useful way, because microtasks are also drained before rendering. Even if it were one, the spinner still would not appear.

Dropped frames are real and are the wrong scale of explanation. The browser is not choosing to skip this frame, it is never asked to produce one.

Forcing layout is the sophisticated wrong answer. Reading offsetHeight really does force a synchronous layout, which is why people reach for it, and layout is not paint. Nothing you can call from inside the task puts pixels on the screen.`,
    hints: ['When does a DOM change actually reach the screen?'],
    tags: ['event-loop', 'performance'],
  },
  {
    id: 'starvation',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are processing a large array in chunks so the page keeps painting. Which yield between chunks does that?',
    options: [
      'await Promise.resolve(), so the loop gets a turn between chunks',
      'await a promise that resolves from a setTimeout of zero, so the browser can take a turn and paint',
      'Mark the function async and await every item, so each one yields',
      'Wrap the whole loop in a promise and await it, so the work leaves the main thread',
    ],
    correctOption: 1,
    answerInFull: `Yield with a macrotask:

  async function processInChunks(items, work, chunkSize = 500) {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      for (const item of chunk) work(item)

      // Yield with a macrotask, so rendering and input get a turn.
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

The critical detail is yielding with a macrotask rather than a microtask. Awaiting Promise.resolve() queues a microtask, which runs in the same drain, so the browser never gets between two tasks and never renders.

In modern browsers scheduler.yield() is the purpose-built version, and it resumes sooner than a timer because it is prioritised above ordinary tasks.

Chunk size is the other half of the answer. Yielding after every item makes the whole thing many times slower, and yielding once every few thousand still blocks a frame, so the number comes from measuring rather than from a principle.`,
    explanation: `await Promise.resolve() is the version almost everyone writes first, and it is the trap the question exists for. It suspends the function, which feels like yielding, and resumes it inside the same microtask drain, so the loop never reaches the point where it renders.

Awaiting each item is the same mistake made expensive: a microtask per item, still no frame painted, and a loop that now runs far slower than the one it replaced.

A promise around the whole loop moves nothing anywhere. The body runs synchronously from wherever it is called, and awaiting it only decides when the caller continues.`,
    hints: ['What kind of task do you have to yield with for the browser to paint?'],
    tags: ['event-loop', 'performance', 'async'],
  },
  {
    id: 'log-order-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'In what order do these print?',
    code: `console.log('a')
setTimeout(() => console.log('b'), 0)
Promise.resolve().then(() => console.log('c'))
console.log('d')`,
    options: ['a d b c', 'a b c d', 'a d c b', 'a c d b'],
    correctOption: 2,
    answerInFull: `a d c b

Synchronous code first, so a and d. The stack then empties and the microtask queue is drained, which runs c. Only then does the loop take a macrotask, running b.

A zero millisecond timeout is still a macrotask and still loses to any pending microtask, however early it was scheduled.`,
    explanation: `a d b c is what you get by reading the two queues as one queue in scheduling order: b was queued before c, so it looks like it should run first. Which queue a callback is in decides everything here, and when it was queued decides nothing across queues.

a b c d treats a zero delay as "run this now" and interleaves the timer with the synchronous code. Nothing queued runs while the stack is busy, whatever its delay.

a c d b drains the microtask between the two synchronous lines, which would mean a promise callback can interrupt code that is still running. Nothing preempts the stack.`,
    hints: [],
    tags: ['event-loop', 'microtasks'],
  },
  {
    id: 'microtask-drain-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'How much of the microtask queue runs between two macrotasks?',
    options: [
      'Exactly one microtask',
      'As many as were queued when the macrotask started',
      'None, microtasks only run when the call stack is idle',
      'All of it, including microtasks queued by other microtasks',
    ],
    correctOption: 3,
    answerInFull: `All of it, including anything queued while the drain is already in progress.

The queue is drained completely, and a microtask that queues another microtask has that work done in the same pass. This is why an endlessly self queueing microtask starves the loop and freezes the page, while an endlessly self queueing setTimeout does not: the timer version hands control back between every one.

Said as a rule: one macrotask per turn, microtasks until there are none left. Almost everything else in this topic follows from that asymmetry.`,
    explanation: `One at a time is the macrotask rule applied to the wrong queue, and it is the answer that makes the two queues sound symmetrical. They are not, and the asymmetry is the whole topic.

Draining only what was queued at the start is the most careful wrong answer, because it is how you would implement this if you were worried about starvation. Engines do not, which is why starvation is possible.

The last option confuses an empty stack with an idle page. An empty stack is the condition for a drain, not a reason to postpone one.`,
    hints: [],
    tags: ['event-loop', 'microtasks'],
  },
  {
    id: 'queue-microtask-vs-timeout-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which callback runs first?',
    code: `setTimeout(() => console.log('timeout'), 0)
queueMicrotask(() => console.log('microtask'))`,
    options: [
      'timeout, because it was scheduled first',
      'Whichever the engine happens to pick, it is not specified',
      'microtask, because the microtask queue is drained first',
      'They run at the same time, in parallel',
    ],
    correctOption: 2,
    answerInFull: `The microtask.

Scheduling order between the two queues does not matter. Once the stack empties, microtasks are drained before the loop takes its next macrotask, so the microtask always wins regardless of which line came first.

Swapping the two lines changes nothing, and neither does the delay: there is no number small enough to put a macrotask ahead of a pending microtask.`,
    explanation: `Scheduling order is the intuition this question exists to break, which is why the timer is written first. It is the only fact in the code that points the wrong way.

"Not specified" is worth ruling out rather than leaving as a possibility. The order between the two queues is specified, engines agree on it, and it is the same in Node.

Nothing here runs two callbacks at once. One thread means one callback at a time, and parallelism needs a worker.`,
    hints: [],
    tags: ['event-loop', 'microtasks'],
  },
  {
    id: 'callback-value-read-too-early',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'This logs undefined, and raising the delay does not help. Why?',
    code: `function loadUser() {
  let user

  setTimeout(() => {
    user = { name: 'Ada' }
  }, 0)

  return user
}

console.log(loadUser())`,
    options: [
      'The assignment creates a variable local to the callback, so the outer user is never written',
      'setTimeout runs its callback on another thread, and the main thread reads user before that thread has finished',
      'A delay of zero is too short for the assignment to land, so a real delay would fix it',
      'The callback runs after loadUser has already returned, so the return happens while user is still undefined',
    ],
    correctOption: 3,
    answerInFull: `The callback has not run yet when the return runs.

setTimeout hands the function to the runtime and returns immediately. Nothing queued can run while the stack is busy, so loadUser reaches its return with user still undefined, console.log prints that, and only then does the callback run and assign to a variable nobody is reading any more.

The value cannot be returned, because at the moment of the return it does not exist. It has to be delivered rather than fetched, which is what a callback, a promise and await each do:

    function loadUser() {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ name: 'Ada' }), 0)
      })
    }

    console.log(await loadUser())

This is the shape underneath almost every "why is my data undefined" question. The code reads correctly from top to bottom, and the lines run in a different order from the one they are written in.`,
    explanation: `The scoping answer is worth checking yourself against rather than dismissing. Assigning with no declaration writes the outer variable, and the closure is exactly what reaches it, so the assignment is fine. Writing const user inside the callback really would create a second variable and produce the same log, for a different reason.

There is no other thread. The assignment has not been done slightly too late, it has not been done at all, and adding threads to the explanation removes the thing worth learning.

Raising the delay is what people try first, and it is the most useful wrong answer here because it is testable in ten seconds. Every delay behaves the same way, including one, because the return happens before any of them.`,
    hints: ['At the moment the return runs, has the callback run?'],
    tags: ['event-loop', 'async', 'callbacks'],
  },
  {
    id: 'who-counts-the-delay-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'While setTimeout(fn, 5000) is waiting, what is doing the waiting?',
    options: [
      'The engine, which pauses at that line for five seconds and then carries on',
      'The runtime around the engine holds the timer and queues fn when it expires, while the engine carries straight on to the next line',
      'A second thread, which runs fn when the time comes, which is why the rest of the program is not blocked',
      'Nothing waits. The engine checks the elapsed time each time it reaches the end of the script',
    ],
    correctOption: 1,
    answerInFull: `The host, which is the browser or Node rather than the engine. setTimeout is not part of the JavaScript language at all: it is a function the runtime provides, and the timer lives on that side.

The sequence is worth being able to say out loud. Calling setTimeout hands over the function and the delay and returns immediately, so the next line runs at once. The runtime counts the time. When the delay has elapsed it puts the function on the callback queue. The event loop picks it up from there, once the call stack is empty.

Two things follow directly, and they are the two things people find surprising about timers.

The delay is a minimum rather than an appointment, because being queued and being run are separate events with a possibly busy stack between them.

And nothing runs in parallel. The counting happens outside the engine and the callback happens inside it, so there is still only ever one thing executing.`,
    explanation: `The engine pausing is what a sleep does in other languages, and what a while loop watching the clock does here. Not blocking is the entire reason setTimeout exists, and a version that paused would freeze the page for five seconds.

A second thread is the tempting one, because half of it is true: the waiting genuinely does happen outside the engine. The callback does not. It runs on the same single thread as everything else, which is why a long synchronous task delays it and why two callbacks never overlap.

The last option is close to the event loop's real job and wrong about who holds the deadline. The loop does not inspect your timers to see which are due; it takes what the runtime has already decided to queue.`,
    hints: [],
    tags: ['event-loop', 'async', 'timers'],
  },
  {
    id: 'callback-does-not-mean-async-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these callbacks runs asynchronously?',
    options: [
      'The one passed to array.forEach',
      'The one passed to setTimeout',
      'The one passed to array.sort',
      'All three, since passing a function to be called later is what makes code asynchronous',
    ],
    correctOption: 1,
    answerInFull: `Only the one passed to setTimeout.

forEach and sort call their callback immediately, as many times as they need, and do not return until they are finished. By the time the line below them runs, every call has already happened. Passing a function as an argument defers nothing by itself: a function is a value like any other.

setTimeout is different because of what it does with the function rather than because it takes one. It gives it to the runtime to hold, and returns before it has been called even once.

The test that works without memorising a list is to ask where the result comes out. forEach and sort finish before the next line, so the result is available there. setTimeout, fetch, addEventListener and readFile all return before their work is done, so the result has to come back through the callback, and the line after the call cannot use it.

Worth naming the confusion this clears up: callback and asynchronous get used as if they were the same word. One is how a function is passed, the other is a question about when it runs.`,
    explanation: `forEach is the belief this question exists for, and it usually comes from code that hands forEach an async callback and finds the loop does not wait. forEach is a plain loop with a function call in the middle of it.

sort looks more like machinery than forEach does, and its comparator is called an unpredictable number of times in an order you do not control. All of that happens before sort returns.

The last option states the rule the question is breaking. Keep the half of it that is true: a callback is how a genuinely asynchronous API hands you a result, which is why the two ideas got tangled together in the first place.`,
    hints: [],
    tags: ['event-loop', 'async', 'callbacks'],
  },
]
