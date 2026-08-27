import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'states',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'A promise has been rejected. What can move it to fulfilled?',
    options: [
      'Calling resolve on it, since the last call inside the executor wins',
      'A catch handler that returns a value, which fulfils the promise it was attached to',
      'Nothing. A promise settles once, and the transition is irreversible',
      'Nothing, though a handler attached after it settled will never run either',
    ],
    correctOption: 2,
    answerInFull: `Nothing. A promise settles once and never moves again.

There are three states: pending, fulfilled and rejected. Fulfilled and rejected are collectively "settled". A promise starts pending and moves once, to either fulfilled with a value or rejected with a reason. That transition is irreversible, and calling resolve or reject afterwards does nothing at all.

Attaching a handler does not change the state either. Handlers registered after a promise has settled still run, scheduled immediately as microtasks.

"Settles once, irreversibly" is the property that makes promises composable, and it is why one promise is safe to hand to several consumers. It is also why a promise cannot be cancelled: there is no state to move it to, which is why AbortController exists separately.`,
    explanation: `The last call winning is how an ordinary assignment behaves, and an executor that calls resolve and then reject reads like one. The first call settles it, every later call is ignored, and nothing warns you.

The catch option is the one to be precise about. A catch handler returning a value really does produce a fulfilled promise, and it is a different promise: the one catch itself returned. The promise it was attached to is still rejected, and anything else holding that promise still sees a rejection.

The last option has the irreversibility right and the handlers wrong. Attaching then to a promise that settled an hour ago schedules the callback immediately. That is what makes a promise a value you can pass around rather than an event you had to be present for.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'all-vs-allsettled',
    type: 'interview',
    form: 'open',
    tier: 'swe-2',
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
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This takes three seconds when it should take one. Which change fixes it?',
    code: `async function loadAll(ids) {
  const results = []
  for (const id of ids) {
    results.push(await fetchItem(id))
  }
  return results
}`,
    options: [
      'Drop the await inside the loop, since fetchItem already returns a promise and an array can hold promises',
      'Replace the for...of with forEach, so the iterations stop waiting for each other',
      'Return Promise.all(ids.map((id) => fetchItem(id))), so every request starts before anything is awaited',
      'Await inside a Promise.resolve, so the loop can carry on while each request is in flight',
    ],
    correctOption: 2,
    answerInFull: `Each await pauses the loop until that request finishes, so three one-second requests take three seconds. They do not depend on each other, so they should start together.

  async function loadAll(ids) {
    return Promise.all(ids.map((id) => fetchItem(id)))
  }

The map starts every request immediately and Promise.all waits for all of them, so the total is the slowest single request rather than the sum.

The rule of thumb is that await inside a loop is correct only when each iteration genuinely depends on the previous one, or when you are deliberately limiting concurrency. Otherwise it is an accidental sequential bottleneck, and it is one of the most common real performance bugs in async code.`,
    explanation: `Dropping the await is half of the right answer and the half people ship. It really does start every request immediately, and it leaves results holding promises, so every caller has to await each element instead. Wrapping that array in Promise.all is what finishes the job, and doing both is the option above written the long way.

forEach makes it worse rather than better. An async callback returns a promise that forEach discards, so the loop finishes with results empty and the function returns before any request has landed.

The last option is the shape people reach for when "make it async" is the goal rather than "start them together". Wrapping an await in a promise changes when the function resumes and never changes when the request began.`,
    hints: ['When does each request actually start?'],
    tags: ['promise', 'async', 'performance'],
  },
  {
    id: 'settles-once-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `console.log('script start')

const p = new Promise((resolve, reject) => {
  console.log('executor')
  resolve('first')
  reject(new Error('second'))
  console.log('after settling')
})

p.then((v) => console.log('then ' + v)).catch((e) => console.log('catch ' + e.message))

console.log('script end')`,
    items: [
      'executor',
      'catch second',
      'script start',
      'then first',
      'after settling',
      'then second',
      'script end',
    ],
    correctOrder: [2, 0, 4, 6, 3],
    answerInFull: `script start, executor, after settling, script end, then first

Two rules account for all of it.

The executor runs synchronously, the moment the promise is constructed. A promise is not lazy and it is not scheduled: calling new Promise runs that function immediately, which is why "executor" prints between the two script lines and why fetchUser() starts its request at the call rather than at the await.

resolve is an ordinary function call, not a return. It settles the promise and control carries straight on, so "after settling" prints. The reject on the line after it does nothing, because the promise has already settled and that move is irreversible.

Everything registered with then is a microtask, so "then first" runs after the synchronous script has finished, with the value the first settling gave it.`,
    explanation: `"catch second" is in the pool because the code really does call reject with that error. The call is ignored, so nothing is ever rejected, and the catch at the end of the chain has nothing to catch. If the two calls were the other way round, "catch second" would print and "then first" would not.

"then second" is the same misreading in its other form, where the last call inside the executor wins the way a reassignment would. The first call settles it.

Nothing here is affected by the timing of the promise. Replacing resolve('first') with a resolve fired from a timer would move only the last line, since the four before it are all synchronous.`,
    hints: ['When does the function passed to new Promise run?'],
    tags: ['promise', 'async', 'event-loop'],
  },
  {
    id: 'forgotten-return',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This chain logs undefined instead of the posts. What is wrong?',
    code: `fetchUser(id)
  .then((user) => {
    fetchPosts(user.id)
  })
  .then((posts) => {
    console.log(posts)
  })`,
    options: [
      'fetchPosts is called before user is available, so it is passed an undefined id',
      'The first callback returns nothing, so the promise it produces fulfils with undefined and the inner promise is never linked into the chain',
      'The second then runs before the first has finished, because then does not wait for a callback that starts async work',
      'console.log in a then callback prints the promise rather than its value, so it needs one more then',
    ],
    correctOption: 1,
    answerInFull: `The first callback does not return anything, so the promise it produces fulfils with undefined and the next then receives undefined. The inner fetchPosts promise is never linked into the chain, so nothing waits for it and a rejection from it goes unhandled.

Fix by returning it:

  .then((user) => fetchPosts(user.id))

With async/await the same bug is harder to write, because the value has to go somewhere:

  const user = await fetchUser(id)
  const posts = await fetchPosts(user.id)

A missing return in a then callback fails twice over. The value is lost, and errors escape the chain. It is the strongest practical argument for preferring async/await.`,
    explanation: `The first option describes a bug that would throw rather than log undefined. user is exactly what the first callback receives, and fetchPosts is called with a real id. The request is made, its result is simply dropped.

The second option is worth ruling out precisely, because it inverts the rule. then does wait, for whatever its callback returns. That is the entire mechanism, and the bug here is that what the callback returns is undefined.

The last option is the version of this bug people reach for when a log shows a Promise object. That happens when a promise really is passed along, which is the opposite of what happened here.`,
    hints: ['What does the first callback return?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'await-error-handling',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt: 'Reviewing this, which criticism is the one worth making?',
    code: `async function load(id) {
  try {
    const user = await fetchUser(id)
    const posts = await fetchPosts(user.id)
    return render(user, posts)
  } catch (error) {
    return EMPTY_PAGE
  }
}`,
    options: [
      'try/catch cannot catch a rejected promise, so each call needs its own .catch',
      'The two awaits run one after the other, so the try should wrap a Promise.all instead',
      'The catch turns every failure into a plausible looking success, including bugs in render, and no caller can tell',
      'A catch that returns rather than rethrows leaves the function fulfilling with undefined',
    ],
    correctOption: 2,
    answerInFull: `The catch is the problem. It converts a loud failure into a silent one: a network error, a missing user and a TypeError thrown by render all come out as an empty page, and nothing upstream can tell the difference between "there is nothing to show" and "we failed".

A rejected promise that is awaited throws, so try/catch works normally. What is easy to get wrong is everything around it:

- Wrapping too much. A broad try around several awaits cannot say which one failed, and it catches your own bugs alongside the expected error.
- Catching and returning a default, which is this code. If a default really is right, decide it at the call site, where the caller knows whether an empty page is acceptable.
- Forgetting that a promise created but not awaited inside a try is not caught by it. The try is over before it rejects.
- Losing concurrency by awaiting in a loop while trying to be careful.

For several independent calls, Promise.allSettled gives per-item outcomes rather than one catch for everything.`,
    explanation: `The first option is the misconception the whole syntax exists to remove. await on a rejected promise throws, which is what makes try/catch work again after a decade of .catch chains.

Sequential awaits are usually the bug worth reporting, and not here: fetchPosts needs user.id, so it cannot start any earlier. Reaching for Promise.all on two calls where the second depends on the first is the reflex this question exists to catch.

The last option misreads what returning from a catch does. It fulfils the promise with EMPTY_PAGE, which is exactly the problem: the value is plausible, and that is what makes the failure invisible.`,
    hints: ['What can a caller tell about what happened?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'timeout-race',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are writing withTimeout(promise, ms), which rejects if the promise has not settled in time. Which implementation is right?',
    options: [
      'Await the promise inside a setTimeout callback, and reject if it has not settled by then',
      'Race the promise against one that rejects from a setTimeout, and clear the timer in a finally',
      'Race the promise against one that rejects from a setTimeout, and let the timer expire on its own',
      'Use Promise.any, so the timeout only wins when the promise has actually failed',
    ],
    correctOption: 1,
    answerInFull: `  function withTimeout(promise, ms) {
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timed out after ' + ms + 'ms')), ms)
    })

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
  }

Two details separate a good answer from a passable one.

Clearing the timer in finally. Without it, a promise that settles in 10ms leaves a 30 second timer pending, which keeps a Node process alive that long and accumulates in a long-running page. finally is the right place because it runs whichever way the race went.

And racing does not cancel the loser. The original work keeps running and its result is discarded, so for a real request you also want an AbortController wired to the same timeout. Say that out loud: a timeout that leaves the request running is a timeout on your waiting, not on the work.`,
    explanation: `Awaiting inside a setTimeout callback is the shape people try before they know race, and it cannot work. By the time the callback runs the promise is either settled or not, and there is nothing to reject from there: the value has to come back out of withTimeout, and the timer callback returns to nobody.

Leaving the timer to expire is the version that passes every test and leaks. It is the difference between code that works and code that can run all day.

Promise.any is race's optimistic sibling: it ignores rejections and waits for the first fulfilment, so a rejecting timeout would be discarded and any would keep waiting for the promise. It only rejects once everything has, which is the opposite of a timeout.`,
    hints: [
      'What happens to the timer if the promise wins?',
      'Does racing actually stop the loser?',
    ],
    tags: ['promise', 'async'],
  },
  {
    id: 'unhandled-rejection',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'Does this produce an unhandled rejection?',
    code: `const p = Promise.reject(new Error('boom'))

setTimeout(() => {
  p.catch((e) => console.log('caught:', e.message))
}, 0)`,
    options: [
      'No, since a catch is attached before anything could report it',
      'Yes, and nothing is printed, because the rejection was already reported',
      'Yes. It is reported first, and "caught: boom" prints afterwards',
      'No in Node, yes in a browser, which reports as soon as the promise rejects',
    ],
    correctOption: 2,
    answerInFull: `Yes. The rejection is reported as unhandled first, and then "caught: boom" prints afterwards.

The runtime checks for handlers once the microtask queue has drained. The catch here is attached from a macrotask, which by definition runs after that drain, so at the moment of the check the promise had no handler at all.

Attaching it late does still work: the handler runs and the message prints. What it cannot do is undo the report, though a browser will fire rejectionhandled to say a rejection it complained about has since been dealt with.

The practical rule is to attach handlers in the same turn the promise is created. This is also why storing a promise now and awaiting it much later produces a spurious warning, and why the usual workaround is a no-op catch attached immediately.`,
    explanation: `The first option is the intuition that a handler attached at any point counts. What matters is whether one was attached by the end of the turn, which is a much shorter window than it feels like.

The second option is the sharper version of the same mistake, where being reported is taken to mean the rejection was consumed. Nothing is consumed. The promise is still a rejected promise holding its reason, and a catch attached later still receives it.

The last option is a reasonable guess about runtimes differing, and they do differ, in what they do rather than in when they decide. Node can be configured to throw on an unhandled rejection and a browser logs it, and both make the decision after the microtask queue drains.`,
    hints: ['When does the runtime decide a rejection was unhandled?'],
    tags: ['promise', 'async', 'event-loop'],
  },
  {
    id: 'then-returns-value-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does the second then receive?',
    code: `Promise.resolve(1)
  .then((n) => n + 1)
  .then((n) => console.log(n))`,
    options: ['1', '2', 'A promise for 2', 'undefined'],
    correctOption: 1,
    answerInFull: `2

then returns a new promise, resolved with whatever its callback returned. The first callback returns 1 + 1, so the promise that then produced fulfils with 2, and the second callback receives it.

The part worth saying out loud is what happens when a callback returns a promise: it is adopted rather than wrapped, so the next then waits for it and receives its value. That is what makes chains flatten instead of nesting, and it is the same rule a forgotten return breaks.

A callback that returns nothing fulfils with undefined, and a callback that throws rejects the promise then returned, which is how a throw anywhere in a chain reaches the catch at the end of it.`,
    explanation: `1 is the answer if then is read as a subscription handing the same value to every handler, the way an event listener would. Each then makes a new promise, and the value moves along the chain rather than staying put.

"A promise for 2" is the nesting answer, and it is what a design without adoption would give you: a callback returning a promise, and the next then receiving that promise rather than its value. Adoption is exactly what stops chains turning into a promise inside a promise.

undefined is what the second callback receives when the first one has a body and no return, which is the bug in the forgotten return question in this topic.`,
    hints: [],
    tags: ['promises'],
  },
  {
    id: 'async-return-type-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does an async function return?',
    options: [
      'The value returned by the body',
      'A promise, unless the body returns a plain value',
      'Always a promise, whatever the body returns',
      'undefined, unless it is awaited',
    ],
    correctOption: 2,
    answerInFull: `Always a promise, whatever the body returns.

A returned value fulfils it, a thrown error rejects it, and a returned promise is adopted rather than wrapped, so an async function that returns a promise still hands back one promise rather than two layers.

Two consequences are worth naming. A forgotten await gives you a pending promise where you expected a value, which usually surfaces as [object Promise] in a string or as undefined after a property access. And throwing inside an async function never produces a synchronous exception at the call site, so a try around a call you did not await catches nothing.`,
    explanation: `"The value returned by the body" is what the code looks like it says, and it is what await makes it feel like from the inside. From the outside there is always a promise in between.

"Unless the body returns a plain value" is the exception people invent to explain why awaiting a non-promise works. await accepts any value and wraps a non-promise itself, so the rule needs no exception.

undefined unless awaited is the reading where an async function is lazy, producing nothing until something pulls on it. Calling it runs the body immediately, up to the first await, and hands back the promise straight away.`,
    hints: [],
    tags: ['promises', 'async-await'],
  },
  {
    id: 'promise-all-rejection-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'One of four promises passed to Promise.all rejects. What happens?',
    options: [
      'It waits for all four, then rejects with an array of reasons',
      'It rejects immediately with that reason, and the others keep running',
      'It resolves with the three that succeeded',
      'It retries the rejected one before giving up',
    ],
    correctOption: 1,
    answerInFull: `It rejects immediately with that reason, and the other three keep running.

Promise.all rejects on the first rejection without waiting for anything else. The others are not cancelled, because a promise cannot be cancelled, so their work continues and their results are discarded.

That matters for two practical reasons. Side effects from the abandoned promises still happen, and an unhandled rejection from one of them can still surface after you thought the failure had been dealt with. Nothing in the promise API stops work, which is why AbortController exists separately.

Promise.allSettled is the one that waits for every outcome and never rejects.`,
    explanation: `Waiting for all of them and rejecting with every reason is a real behaviour and belongs to a different combinator. Promise.any collects reasons into an AggregateError when everything rejects. all rejects with the single first reason it sees.

Resolving with the three that succeeded is allSettled in a different shape, and wanting it here usually means all was the wrong combinator rather than that all behaves wrongly.

Retrying is something no combinator does. A retry policy is written around a promise, never by one.`,
    hints: [],
    tags: ['promises'],
  },
]
