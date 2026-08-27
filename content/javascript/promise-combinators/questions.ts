import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'any-aggregate-error',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-2',
    prompt:
      'Every promise passed to Promise.any rejects. What does the returned promise reject with?',
    options: [
      'An array of every rejection reason, in input order',
      'The last rejection reason, since it completed the set',
      'The first rejection reason, the way Promise.all would',
      'An AggregateError whose errors array holds every reason',
    ],
    correctOption: 3,
    answerInFull: `An AggregateError, whose errors array holds every rejection reason in the order the rejections happened.

    Promise.any([a, b]).catch((e) => e.errors) // [reasonFromA, reasonFromB]

Its message is "All promises were rejected". This is different from Promise.all, which rejects with the single first reason it saw and throws away the rest, and from allSettled, which never rejects at all and reports each outcome instead.

So when a caller needs to know why everything failed — say three mirrors each failed differently — any is the right combinator and errors is where the detail lives. Logging just err.message gives you only the aggregate wrapper's message.`,
    explanation: `An array of reasons is what allSettled produces if you map over its rejected entries, and it is close enough that people conflate the two. The difference is that allSettled reports successes too and never rejects.

The first reason is what Promise.all rejects with. It fails fast and discards whatever comes after, so it never has a collection of reasons to give you.

The last reason sounds plausible because the set is complete by then, but nothing about any is interested in completion order. It settles on the first success, or once it knows there will not be one.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'all-reject-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const slow = new Promise((resolve) => {
  setTimeout(() => {
    console.log('slow done')
    resolve('ok')
  }, 50)
})

const fast = Promise.reject(new Error('fast'))

Promise.all([slow, fast]).catch((e) => {
  console.log('all:', e.message)
})

console.log('sync end')`,
    items: ['sync end', 'all: fast', 'slow done', 'then ok', 'unhandled rejection: Error: fast'],
    correctOrder: [0, 1, 2],
    answerInFull: `sync end, all: fast, slow done

Promise.all attaches handlers to both inputs the moment it is called, so the fast rejection is handled and there is no unhandled rejection warning. all sees it first and rejects immediately; its catch runs as a microtask, printing "all: fast".

The slow timer was already scheduled before any of that. A combinator rejecting does not stop work it was handed, so when the timer fires, "slow done" still prints, and the value "ok" is discarded because nobody is waiting anymore.

That is the whole lesson in three lines: all rejects at the first failure, and everything else keeps running regardless.`,
    explanation: `"slow done" is in the pool because people who know all rejects early often believe the losers are somehow cancelled or abandoned mid-flight. Neither is true. The setTimeout callback runs no matter what all did.

"then ok" tempts anyone who pictures the slow promise still being awaited after the rejection. Nothing consumes its value once all has settled.

The unhandled rejection line is the sharpest distractor. It would be right if fast had been created and left alone, but passing it to Promise.all attached a handler immediately, which is exactly what being "handled" means.`,
    hints: ['Does rejecting all stop the slow timer?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'dashboard-partial-failure',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A dashboard loads user, notifications and stats together. The notifications endpoint returns 404 and the whole dashboard renders empty. Which change keeps the working widgets rendering?',
    code: `const [user, notifications, stats] = await Promise.all([
  fetchUser(),
  fetchNotifications(),
  fetchStats(),
])
renderDashboard({ user, notifications, stats })`,
    options: [
      'Wrap the await in try/catch and render an empty dashboard state on failure',
      'Reorder the array so notifications is requested last, giving the other two time to finish',
      'Use Promise.allSettled, then render the fulfilled values and report the rejected ones',
      'Retry fetchNotifications inside the same Promise.all until it succeeds',
    ],
    correctOption: 2,
    answerInFull: `Switch to Promise.allSettled:

    const results = await Promise.allSettled([
      fetchUser(),
      fetchNotifications(),
      fetchStats(),
    ])

It never rejects. Split the entries on status: pass the fulfilled values to renderDashboard, and log or surface the rejected reasons separately. Two widgets render and one failure is visible instead of everything being lost.

The alternative worth naming is attaching a catch per promise before the all — .catch(() => null) on just notifications — which works when each failure has an obvious default. What both fixes share is deciding per item whether failure is survivable, instead of letting one 404 decide for the whole page.`,
    explanation: `The try/catch version is the code that produced the bug, moved down a level. One empty-state branch now covers three unrelated failures, and the working data still does not render.

Reordering changes which request starts first and nothing else. all rejects on the first rejection whenever it happens; position in the array has no bearing on the outcome.

Retrying inside the same all keeps the all-or-nothing shape. A transient failure eventually succeeds, but a real 404 never does, so the dashboard is blank again after burning several requests.`,
    hints: ['What does the caller actually need when one part fails?'],
    tags: ['promise', 'async'],
  },
  {
    id: 'retry-backoff-implementation',
    type: 'coding',
    form: 'choice',
    difficulty: 'hard',
    tier: 'swe-2',
    prompt:
      'You are writing withRetry(task, attempts), which retries a failing async task with backoff and gives up after attempts tries. Which implementation is right?',
    options: [
      'Call Promise.allSettled in a loop until an entry comes back fulfilled, sleeping between rounds',
      'Race task() against a delay in a loop, treating whichever loses as the failure to retry',
      'Loop: await the task in a try, catch to sleep with growing delay, and rethrow on the final attempt',
      'Pass a retries option through to the underlying request library and return its result directly',
    ],
    correctOption: 2,
    answerInFull: `    async function withRetry(task, attempts = 3) {
      for (let i = 0; ; i++) {
        try {
          return await task()
        } catch (error) {
          if (i === attempts - 1) throw error
          await sleep(100 * 2 ** i)
        }
      }
    }

The loop awaits the task, so a failure lands in the catch where the retry decision lives. The delay grows — backoff — so a struggling server is not hit at full rate. On the last attempt the error is rethrown rather than swallowed, so callers can tell total failure from success.

Two details make the difference between a demo and production code. First, task must be a function called again each round; retrying means doing the work again, and a promise already in flight cannot be restarted. Second, the give-up path throws, keeping the failure loud.

Say out loud that retries belong around the operation. No combinator retries anything, because a settled promise cannot be asked to try again.`,
    explanation: `allSettled in a loop cannot retry, because allSettled never re-runs anything. It reports the same settled entry every round, so the loop either spins forever or exits without having retried at all.

The race version confuses timeout with failure. Losing a race to a delay means the task was slow, not that it failed — and racing it again abandons the first attempt while it may still be about to succeed, piling up duplicate work.

Delegating to a library option is fine when the requirement really is "use the library's retry", but as an implementation of withRetry it answers nothing: no control over delays, no way to count across libraries, and nothing to show in an interview.`,
    hints: [
      'What does retrying mean for a promise that has already settled?',
      'Where does the error land so a decision can be made about it?',
    ],
    tags: ['promise', 'async', 'coding'],
  },
  {
    id: 'analytics-fire-and-forget',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'On page unload you send three analytics beacons. They are independent, nobody reads their responses, and one failing must neither break the page nor produce an unhandled rejection. Which approach is right?',
    options: [
      'await Promise.all(beacons) inside a try/catch that ignores errors',
      'Start each beacon and attach a no-op catch to each one, without awaiting anything',
      'Promise.race the beacons against a short timeout and discard the losers',
      'Chain the beacons so each waits for the previous one to settle first',
    ],
    correctOption: 1,
    answerInFull: `Start each beacon, attach a no-op catch to each, and do not await anything:

    beacons.forEach((send) => void send().catch(() => {}))

Nothing is awaited because nobody uses the result, and the page should not wait on analytics anyway. Each promise carries its own handler, so no rejection can ever become unhandled, and one beacon failing has no way to affect the others.

This is the rare case where fire-and-forget is correct, and the discipline is in the catch. A bare call whose rejection nobody handles is a console error at best and a crash-on-unhandled-rejection policy at worst. Attaching even an empty catch converts it into deliberately ignored work.

If the beacons mattered, the design would change: allSettled to report outcomes, or a queue that retries. The scenario says they do not, so the lightest safe thing wins.`,
    explanation: `Awaiting Promise.all makes the caller block on analytics, and the surrounding try/catch exists only to undo the damage of using all for independent work. The failures are handled, but the code now waits for the slowest beacon for no benefit.

Racing against a timeout adds machinery for a problem this scenario does not have, and the losing beacons keep running anyway.

Chaining serialises independent requests. It is the reflex from code where order matters, applied where it does not, and it makes the last beacon wait for the slowest failure of the first two.`,
    hints: ['Who consumes these results, and what is there to wait for?'],
    tags: ['promise', 'async', 'scenario'],
  },
  {
    id: 'mirror-fallback-design-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'Design loadWithFallback(urls): fetch the same resource from several mirrors and get a result even if some mirrors fail. How do you decide between trying them in order and asking them all at once?',
    answerInFull: `- Sequential fallback: reduce over the urls, chaining each attempt onto the previous one's catch. Latency stacks — worst case is the sum of every mirror's timeout — but only one mirror gets hit at a time, which matters if mirrors rate-limit or bill per request.
- Parallel with any: start every request at once and take Promise.any. You get the fastest success, and it only rejects with an AggregateError once all have failed. Cost: every mirror is hit every time, even when the first succeeds.

The decision is about load and latency, not correctness. Both return the same data.

Whichever shape, wrap each attempt in a per-mirror timeout — race against a timer, cleared in finally, or better an AbortSignal.timeout wired to the actual fetch so the loser's request is genuinely aborted rather than merely ignored. Without that, a hung mirror stalls the sequential chain forever, or leaks a connection in the parallel version.

Give up loudly: let the AggregateError or the last error propagate rather than returning a default, unless the caller has said what a total failure should mean.`,
    explanation: `The follow-up interviewers push on is the hung mirror. Any fallback design built only from combinators stops work waiting, not work doing, and saying "and I would abort the losers with AbortController" is usually the moment the interviewer moves on.

Worth naming too: starting all requests eagerly versus lazily. In the parallel version the requests start when created; in the sequential version each starts only when the previous one fails, which is what makes it sequential.`,
    hints: [],
    tags: ['promise', 'async', 'design'],
  },
  {
    id: 'when-inputs-start',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-2',
    prompt: 'When do the two requests behind Promise.all([fetchA(), fetchB()]) actually start?',
    options: [
      'When Promise.all is called, which schedules them as microtasks',
      'When their handlers are first attached by then calls',
      'When fetchA() and fetchB() are called, before Promise.all ever sees them',
      'One after the other, as all walks the array',
    ],
    correctOption: 2,
    answerInFull: `When fetchA() and fetchB() are called. That happens while building the array, before Promise.all is invoked at all.

Promises are eager. Calling an async function or fetch starts the work immediately; awaiting or combining it only decides who waits for the result. This is why ids.map(fetchItem) followed by Promise.all is the idiomatic fan-out: the map starts everything, all just collects.

The useful flip side is that you can start work now and decide later how to combine it — or accidentally start work you never needed, since there is no way to un-start a promise. Cancellation is a separate mechanism entirely.`,
    explanation: `"Scheduled by all as microtasks" misplaces the whole model. By the time all runs, both promises exist and their work is underway. Microtasks are involved later, when settlement is delivered to handlers.

Handler attachment has nothing to do with starting. A promise runs to completion whether or not anyone ever listens, which is also why detached promises can produce unhandled rejections.

Walking the array one at a time describes sequential execution, which is what an await-in-a-loop bug looks like — precisely what Promise.all exists to avoid.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'any-first-success-timing',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'What does this print, and when?',
    code: `const a = new Promise((_, rej) =>
  setTimeout(() => rej(new Error('a')), 100),
)
const b = new Promise((res) => setTimeout(() => res('b'), 200))
const c = Promise.reject(new Error('c'))

Promise.any([a, b, c]).then((v) => console.log(v))`,
    options: [
      'b, roughly 200ms later, after a rejects and b fulfils',
      'c, immediately, because c rejected first',
      'b, roughly 200ms later; the rejections are ignored',
      'An AggregateError listing a and c, at 100ms',
    ],
    correctOption: 2,
    answerInFull: `b, roughly 200ms later.

Promise.any waits for the first fulfilment and ignores rejections along the way. c rejects immediately and a rejects at 100ms; neither ends the race, they are simply recorded in case everything fails. At 200ms b fulfils, any fulfils with "b", and that prints.

Contrast race, which would have settled at time zero with c's rejection — race counts a failure as a winner. any's patience is its entire purpose: redundant sources where individual failures are expected noise.

Had b also rejected, any would have rejected at 200ms with an AggregateError whose errors array holds c's and a's reasons in the order they occurred.`,
    explanation: `"c, immediately" is the race reading. It is the most common confusion between the two, and the question exists to separate them: race settles on first settlement of any kind, any holds out for the first success.

The AggregateError option is what actually happens if every input rejects. Here it cannot, because b fulfils — and it could never happen at 100ms anyway, since a alone rejecting proves nothing about b, which is still pending.

"b after a rejects" gets the value right but invents a dependency. b fulfils on its own timer; nothing waits for a.`,
    hints: ['Which single event ends Promise.any early?'],
    tags: ['promise', 'async', 'timing'],
  },
  {
    id: 'all-results-input-order',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-1',
    prompt:
      'Three promises passed to Promise.all settle in the order C, A, B. In what order are the values found in the results array?',
    options: [
      'C, A, B — the order they settled in',
      'Undefined until you sort them yourself',
      'Input order — A, B, C — regardless of settlement order',
      'Settlement order, unless one of them rejects',
    ],
    correctOption: 2,
    answerInFull: `Input order: results[0] is always the value of the first promise, whatever order they settled in.

Promise.all allocates a slot per input and fills each slot when that promise settles. The array is complete — and the combined promise fulfils — only when every slot is filled, so by the time you read it, positions match inputs.

This is what makes the fan-out pattern pleasant: zip inputs with results by index and you never need to tag results with identities.

    const [user, posts, stats] = await Promise.all([
      fetchUser(), fetchPosts(), fetchStats(),
    ])

If you genuinely need completion order — first finished first served — that is a different requirement, and Promise.race per item, or pushing into an array from each then, expresses it honestly.`,
    explanation: `Settlement order is what you would get from collecting values as each then fires, and code written that way breaks the moment timing shifts. The fixed positions are a guarantee, not luck.

"Undefined until sorted" describes no promise API. If someone has written a sort after Promise.all, it is dead code at best.

The rejection clause is a real behaviour of all — it rejects instead of fulfilling — but it does not modify ordering of results, because there are no results on that path at all.`,
    hints: [],
    tags: ['promise', 'async'],
  },
  {
    id: 'batched-concurrency-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'You must process 300 ids against an API that allows 3 concurrent requests. Which approach caps concurrency correctly?',
    options: [
      'ids.map(fetchItem) collected by Promise.all, trusting the API to queue the rest',
      'Slice the ids into groups of three and await Promise.all per group in a for...of loop',
      'Fire all 300 and attach a .catch to each, since failures are already handled',
      'Promise.any over chunks of three, moving to the next chunk when the first of each succeeds',
    ],
    correctOption: 1,
    answerInFull: `Batch:

    for (const batch of chunks(ids, 3)) {
      const results = await Promise.all(batch.map(fetchItem))
      all.push(...results)
    }

The slice creates groups of three; the await inside the loop is deliberate — each batch finishes before the next starts, so no more than three requests are ever in flight. Results stay grouped, which you flatten at the end.

Note this is the exception to "await in a loop is a bottleneck": here the serialization is the requirement. The general rule stands — accidental sequencing is a bug; deliberate sequencing for a concurrency cap is a design.

For finer control — start the next request the moment one of the three finishes, instead of waiting for the whole batch — you need a worker pool pulling from a shared queue. Say that as the scaling path rather than writing it unprompted.`,
    explanation: `Firing all 300 and hoping is the bug being asked about. The API's limit shows up as 429s and dropped connections under load, not as polite queuing, and per-promise catches do not reduce concurrency at all.

any over chunks is subtly wrong twice: it resolves each chunk on the first success, discarding the other two results you needed, and it still started all three.

The trust-the-API option inverts responsibility. Client-side concurrency limits exist precisely because servers reject rather than queue.`,
    hints: ['What does awaiting inside the batch loop buy you here?'],
    tags: ['promise', 'async', 'performance'],
  },
  {
    id: 'map-async-undefined-results',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'results logs [undefined, undefined]. Why?',
    code: `const ids = ['a1', 'a2']

const results = await Promise.all(
  ids.map(async (id) => {
    await save(id)
  }),
)

console.log(results)`,
    options: [
      'map does not understand async callbacks, so it collected promises that Promise.all could not read',
      'save mutates state rather than returning, and Promise.all passes through only explicit return values',
      'The second await in each callback cancels the implicit return of save',
      'The async callback returns nothing, so each element fulfils with undefined',
    ],
    correctOption: 3,
    answerInFull: `The arrow function has a body and no return statement, so it returns undefined. Being async wraps that undefined in a fulfilled promise, Promise.all dutifully collects [undefined, undefined], and everything worked except the part where a value was supposed to come out.

Fix by returning:

    const results = await Promise.all(
      ids.map(async (id) => {
        await save(id)
        return { id, savedAt: Date.now() }
      }),
    )

or, when the awaited call's result is the result, collapse the body to an expression: ids.map((id) => save(id)) — no async keyword needed, and the promise save returns is adopted directly.

This is the async-flavoured version of the classic forgotten return. The mechanics differ slightly — the function returns a promise either way, it just happens to be a promise for undefined — but the review comment is identical.`,
    explanation: `The map-and-promises option describes a world without adoption. map handles async callbacks perfectly well — it collects whatever they return, which here is promises, which is exactly what Promise.all wants.

Returning only explicit values is invented semantics. Every function returns something; the question is only whether it is the something you meant.

There is no cancelling await. That option is a guess shaped like a mechanism, which is usually a sign to check the simplest explanation first: read the callback and ask what it returns.`,
    hints: ['What does the callback return?'],
    tags: ['promise', 'async', 'debugging'],
  },
]
