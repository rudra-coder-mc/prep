import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'states',
    type: 'concept',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What states can a promise be in, and what can move it between them?',
    answerInFull: `Three states: pending, fulfilled and rejected. Fulfilled and rejected are collectively "settled".

A promise starts pending and moves once, to either fulfilled with a value or rejected with a reason. That transition is irreversible, and calling resolve or reject again does nothing.

Attaching a handler does not change the state. Handlers registered after settling still run; they are scheduled immediately as microtasks.`,
    explanation: `"Settles once, irreversibly" is the property that makes promises composable, and it is the reason a promise can be handed to several consumers safely. It is also why a promise cannot be cancelled. There is no state to move it to.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'all-vs-allsettled',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt: 'Compare Promise.all, allSettled, race and any, with a practical use for each.',
    answerInFull: `- all: fulfils with every value, or rejects as soon as any one rejects. Use it when you need all of the results and any failure makes the whole thing pointless, such as loading data a page cannot render without.
- allSettled: never rejects; fulfils with an array of status objects. Use it when you want everything attempted and reported, such as sending several independent analytics calls or a batch where partial success is fine.
- race: settles with the first to settle, fulfilled or rejected. The classic use is a timeout.
- any: fulfils with the first to fulfil, ignoring rejections, and rejects with an AggregateError only if all reject. Use it for redundant sources such as several mirrors.

The one that catches people out is that all does not cancel the others when it rejects. They keep running, and their results are discarded.`,
    explanation: `That last point matters in practice. An unhandled rejection from one of the abandoned promises can still surface, and side effects still happen. Nothing in the promise API stops work, which is why AbortController exists separately.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'sequential-vs-parallel',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt: 'This takes three seconds when it should take one. Fix it.',
    code: `async function loadAll(ids) {
  const results = []
  for (const id of ids) {
    results.push(await fetchItem(id))
  }
  return results
}`,
    answerInFull: `Each await pauses the loop until that request finishes, so three one-second requests take three seconds. They do not depend on each other, so they should start together.

  async function loadAll(ids) {
    return Promise.all(ids.map((id) => fetchItem(id)))
  }

The map starts every request immediately and Promise.all waits for all of them, so the total is the slowest single request.`,
    explanation: `The rule of thumb is that await inside a loop is correct only when each iteration genuinely depends on the previous one, or when you are deliberately limiting concurrency. Otherwise it is an accidental sequential bottleneck, and it is one of the most common real performance bugs in async code.`,
    hints: ['When does each request actually start?'],
    tags: ['promise', 'async', 'performance'],
  },
  {
    id: 'all-rejection-output',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print, and in what order?',
    code: `const ok = () => Promise.resolve('ok')
const bad = () => Promise.reject(new Error('bad'))

Promise.all([ok(), bad(), ok()])
  .then((v) => console.log('all:', v))
  .catch((e) => console.log('all failed:', e.message))

Promise.allSettled([ok(), bad(), ok()]).then((r) =>
  console.log('settled:', r.map((x) => x.status).join(',')),
)`,
    answerInFull: `all failed: bad
settled: fulfilled,rejected,fulfilled`,
    explanation: `Promise.all rejects at the first rejection, so its then never runs and the catch receives the error. allSettled waits for everything and reports each outcome, so it always fulfils.

The ordering follows from allSettled needing to wait for all three, which takes an extra microtask turn, while all can reject as soon as the second one does.`,
    hints: ['Which of the two can settle early?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'forgotten-return',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt: 'This chain logs undefined instead of the user. What is wrong?',
    code: `fetchUser(id)
  .then((user) => {
    fetchPosts(user.id)
  })
  .then((posts) => {
    console.log(posts)
  })`,
    answerInFull: `The first callback does not return anything, so the promise it produces fulfils with undefined and the next then receives undefined. The inner fetchPosts promise is never linked into the chain, so nothing waits for it and a rejection from it goes unhandled.

Fix by returning it:

  .then((user) => fetchPosts(user.id))

With async/await the same bug is harder to write, because the value has to go somewhere:

  const user = await fetchUser(id)
  const posts = await fetchPosts(user.id)`,
    explanation: `A missing return in a then callback is one of the most common promise bugs, and it fails twice over. The value is lost, and errors escape the chain. It is the strongest practical argument for preferring async/await.`,
    hints: ['What does the first callback return?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'await-error-handling',
    type: 'scenario',
    form: 'open',
    difficulty: 'medium',
    prompt: 'How do you handle errors with async/await, and what is easy to get wrong?',
    answerInFull: `A rejected promise that is awaited throws, so try/catch works normally.

What is easy to get wrong:
- Wrapping too much. A broad try around ten awaits cannot tell you which one failed, and it catches your own bugs alongside the network error.
- Forgetting that a promise created but not awaited inside try is not caught by it.
- Losing concurrency by awaiting inside a loop while trying to be careful.
- Catching and returning a default, quietly turning a failure into a plausible-looking success.

For multiple independent calls, Promise.allSettled gives per-item outcomes rather than one catch for everything.`,
    explanation: `The "catch and return a default" habit is the one worth pushing back on in review. It converts a loud failure into a silent one, which is exactly the wrong trade in anything that touches data.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'timeout-race',
    type: 'coding',
    form: 'open',
    difficulty: 'medium',
    prompt: 'Write withTimeout(promise, ms) that rejects if the promise has not settled in time.',
    answerInFull: `function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(\`Timed out after \${ms}ms\`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}`,
    explanation: `Two details separate a good answer from a passable one. Clearing the timer in finally stops a pending timeout keeping the process alive in Node and leaking in long-running pages. And racing does not cancel the original work. It keeps running and its result is discarded, so for a real request you also want an AbortController.`,
    hints: [
      'What happens to the timer if the promise wins?',
      'Does racing actually stop the loser?',
    ],
    tags: ['promise', 'async'],
  },
  {
    id: 'unhandled-rejection',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'Does this produce an unhandled rejection? Explain.',
    code: `const p = Promise.reject(new Error('boom'))

setTimeout(() => {
  p.catch((e) => console.log('caught:', e.message))
}, 0)`,
    answerInFull: `Yes. The rejection is reported as unhandled first, and then "caught: boom" prints afterwards.

The runtime checks for handlers once the microtask queue has drained. The catch here is attached from a macrotask, which runs later, so at the moment of the check the promise had no handler.`,
    explanation: `The practical rule is to attach handlers in the same turn the promise is created. This is also why storing a promise now and awaiting it much later can produce a spurious unhandled rejection warning, and the usual workaround is to attach a no-op catch immediately.`,
    hints: ['When does the runtime decide a rejection was unhandled?'],
    tags: ['promise', 'async', 'event-loop'],
  },
  {
    id: 'then-returns-value-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does the second then receive?',
    code: `Promise.resolve(1)
  .then((n) => n + 1)
  .then((n) => console.log(n))`,
    options: ['2', '1', 'A promise for 2', 'undefined'],
    correctOption: 0,
    answerInFull:
      'then returns a new promise resolved with whatever the callback returned. A plain value is used as is; a returned promise is adopted and waited for, which is what makes chains flatten instead of nesting.',
    hints: [],
    tags: ['promises'],
  },
  {
    id: 'async-return-type-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does an async function return?',
    options: [
      'Always a promise, whatever the body returns',
      'The value returned by the body',
      'A promise, unless the body returns a plain value',
      'undefined, unless it is awaited',
    ],
    correctOption: 0,
    answerInFull:
      'Always a promise. A returned value resolves it, a thrown error rejects it. This is why a forgotten await gives you a pending promise where you expected a number, and why throwing inside an async function never produces a synchronous exception at the call site.',
    hints: [],
    tags: ['promises', 'async-await'],
  },
  {
    id: 'promise-all-rejection-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'One of four promises passed to Promise.all rejects. What happens?',
    options: [
      'It rejects immediately with that reason, and the others keep running',
      'It waits for all four, then rejects with an array of reasons',
      'It resolves with the three that succeeded',
      'It retries the rejected one before giving up',
    ],
    correctOption: 0,
    answerInFull:
      'Promise.all rejects on the first rejection without waiting. The others are not cancelled, because a promise cannot be cancelled, so their work continues and their results are discarded. Promise.allSettled is the one that waits for every outcome.',
    hints: [],
    tags: ['promises'],
  },
]
