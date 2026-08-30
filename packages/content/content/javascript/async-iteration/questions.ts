import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'async-iterator-protocol',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What makes an object consumable by for await...of?',
    options: [
      'A next() method that returns values synchronously, the same as for...of',
      'A Symbol.asyncIterator method returning an object whose next() returns a promise of { value, done }',
      'Being an array of promises; the loop awaits each element',
      'A listen() method that registers a callback per value',
    ],
    correctOption: 1,
    answerInFull: `It needs Symbol.asyncIterator: a method returning an iterator whose next() returns a promise resolving to { value, done }. The protocol is the sync iterator protocol one promise deeper, and that is nearly the whole idea.

    const asyncIterable = {
      async *[Symbol.asyncIterator]() {
        yield 1
        yield 2
      },
    }

for await (const v of asyncIterable) is the consumer side. Each pass asks next(), awaits the answer, and runs the body with the value until done is true.

Two adjacent facts round out the answer. Async generators — async function* — produce objects with Symbol.asyncIterator automatically, which is why they are the usual way to build these. And yielded promises are awaited transparently: yielding Promise.resolve(1) delivers 1 to the loop, not a promise.`,
    explanation: `The sync protocol describes plain iterators. for...of looks for Symbol.iterator, and its absence on async iterables is exactly why mixing the two loops throws rather than misbehaving quietly.

Arrays of promises are iterable but not async-iterable, and awaiting each element inside the body is a different pattern with different concurrency — the loop would still pull synchronously.

Callbacks invert the control entirely: registration is push, where the source decides timing, while async iteration is pull, where the consumer does. That inversion is what the protocol formalises.`,
    hints: [],
    tags: ['async', 'iteration'],
  },
  {
    id: 'for-of-on-async-generator-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This loop never logs a value; it throws immediately. What is the mistake?',
    code: `async function* results() {
  yield await load(1)
  yield await load(2)
}

for (const r of results()) {
  console.log(r)
}`,
    options: [
      'results() must be awaited before iterating, since async generators return promises',
      'The generator yields before load resolves, so every value is still pending when logged',
      'for...of looks for Symbol.iterator, which an async generator does not have — it wants for await...of',
      'Generators cannot use await between yields without wrapping the whole body in try/catch',
    ],
    correctOption: 2,
    answerInFull: `An async generator's product has Symbol.asyncIterator, not Symbol.iterator. Plain for...of reads only the latter, finds nothing, and throws a TypeError on the spot — before a single value is requested.

Fix by matching loop to protocol:

    for await (const r of results()) {
      console.log(r)
    }

The distinction worth stating precisely: this fails loudly at construction of the iteration, not subtly during it. That makes it one of the friendlier bugs in async JavaScript — the error message names the exact mismatch.

Where the quiet version lives is one step over: for...of over an *array* of promises succeeds, because arrays have Symbol.iterator, and hands you pending promise objects as values. Same root confusion, no exception to wake you.`,
    explanation: `Awaiting the call first is doubly wrong: calling an async generator function returns a generator object synchronously, not a promise — there is nothing to await, and the loop type was the actual problem.

Pending yields get the mechanism backwards. Inside an async generator, await completes before the yield delivers; consumers never see unresolved values through for await.

await between yields is half the reason async generators exist. No wrapping or ceremony is involved — the syntax carries it.`,
    hints: ['Which symbol does each loop read?'],
    tags: ['async', 'iteration', 'debugging'],
  },
  {
    id: 'yield-promise-unwrapped-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `async function* vals() {
  yield Promise.resolve(1)
  yield 2
}

;(async () => {
  for await (const v of vals()) {
    console.log(typeof v, v)
  }
})()`,
    options: [
      'number 1 then number 2 — yielded promises are awaited automatically',
      'object Promise then number 2 — only explicit awaits unwrap',
      'number 1 then undefined, because the second yield has no await',
      'It rejects: a generator cannot yield a promise directly',
    ],
    correctOption: 0,
    answerInFull: `number 1, then number 2.

for await...of awaits whatever next() resolves with, and an async generator folds that further: a promise you yield is adopted like a return value in an async function, so the consumer receives 1, never a promise wrapper. Mixed yields — one returning a promise, one a plain value — come out uniform.

That uniformity is deliberate and useful. A producer whose values arrive sometimes-as-promises (a cache hit versus a fetch) can yield both shapes and let the loop normalise them:

    async function* users(ids) {
      for (const id of ids) {
        yield cache.get(id) ?? fetchUser(id)
      }
    }

Every value the body sees is a settled user, whichever path produced it.

The corollary catches people writing generic code: if you consume an async iterable manually with next(), the unwrapping is yours to do — next() gives you { value, done } where value may itself be a promise depending on how the producer yielded.`,
    explanation: `Only-explicit-awaits describes manual consumption via next(), where indeed nobody unwraps for you. The loop and the generator protocol do it as part of their contract.

The second yield needs no await to be well-formed. Plain values pass through untouched; await matters only when the thing being produced is asynchronous.

Rejection is impossible here by construction. Yielding a rejected promise would surface as a throw from the loop — errors propagate through iteration, but yielding a pending-or-fulfilled promise never throws.`,
    hints: ['Who awaits the yielded value, and when?'],
    tags: ['async', 'iteration', 'generators'],
  },
  {
    id: 'sequential-body-concurrency-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A for-await loop consumes 100 URLs from an async generator, fetching inside the body. Each fetch takes one second. How long does the loop take?',
    options: [
      'About one second — pulls overlap with bodies automatically',
      'About one hundred seconds — the body finishes before the next value is pulled',
      'Depends on the generator: it controls whether pulls run concurrently',
      'About ten seconds, since the runtime pipelines roughly ten requests at once',
    ],
    correctOption: 1,
    answerInFull: `About a hundred seconds. for await is strictly sequential: pull a value, run the whole body, finish it, pull the next. One request in flight at a time, a hundred times over.

That sequentiality is a feature when order matters, memory argues against holding everything, or the source trickles. For independent work it is a self-inflicted bottleneck, and the fix separates acquisition from processing:

    // bounded concurrency, then iterate settled results
    for (const batch of chunks(urls, 10)) {
      const pages = await Promise.all(batch.map(fetch))
      for (const p of pages) render(p)
    }

Or start everything and process on arrival — the honest phrasing is that async iteration answers "consume a stream one at a time", not "process independent work fast". Choosing between those two sentences per problem is what the question tests.

Worth naming too: moving the fetch into the generator does not change this. Where the await sits relative to the loop decides concurrency, and inside either the loop or the pulled producer means serial.`,
    explanation: `No overlap happens automatically. Overlap requires multiple requests in flight, which requires starting work before awaiting it — the loop's shape forbids exactly that.

The generator genuinely could matter if it pre-fetched ahead of the consumer, but that is machinery someone writes explicitly. The default protocol pulls lazily and waits patiently.

Pipelining ten at once invents behaviour no runtime has. JavaScript offers no implicit concurrency; every parallel request exists because code started it deliberately.`,
    hints: ['When does the second pull happen relative to the first body?'],
    tags: ['async', 'iteration', 'performance'],
  },
  {
    id: 'emitter-to-async-iterator-coding',
    type: 'coding',
    form: 'choice',
    tier: 'senior',
    prompt:
      'You need to consume an event emitter ("data" events, occasional "error") with a for-await loop. Which design converts push into pull correctly?',
    options: [
      'An async generator that adds listeners, yields a promise per event, and removes all listeners in finally — queueing values that arrive between pulls',
      'A listener that pushes events into an array, with the loop reading the array after each await of a fixed sleep',
      'One promise per event stored in an object keyed by index, with the loop awaiting them in numeric order',
      'Wrap the emitter in a ReadableStream and rely on streams being async-iterable, forwarding errors manually',
    ],
    correctOption: 0,
    answerInFull: `Queue plus resolver — the canonical converter:

    async function* events(emitter, signal) {
      const queue = []
      let notify
      const onValue = (v) => {
        queue.push(v)
        notify?.()
      }
      emitter.on('data', onValue)

      const onError = (e) => notify?.(e)
      emitter.once('error', onError)

      try {
        while (true) {
          if (queue.length === 0) {
            await new Promise((res, rej) => { notify = res })
          }
          yield queue.shift()
        }
      } finally {
        emitter.off('data', onValue)
        emitter.off('error', onError)
      }
    }

Values arriving while nobody is pulling go into the queue; an empty queue suspends the generator until the next event resolves the wait. The consumer's pace governs everything — pull-based, though the source is push-based.

The finally block is not decoration. Breaking out of the consuming loop calls return() on the generator, which runs that finally, removing listeners — cleanup guaranteed by the protocol rather than remembered by the caller. Forwarding errors by rejecting keeps them surfacing as throws from the loop, where catch belongs.`,
    explanation: `Array-plus-sleep polls, and polling gets both failure modes wrong: it processes late, and it drops anything arriving between checks unless the sleep is tuned forever. Queues exist precisely so nothing is dropped and nothing waits unnecessarily.

Index-keyed promises assume you know how many events will ever arrive, which events contradict by nature. It also buffers unboundedly and orders artificially.

The stream option is not wrong in spirit — Node streams ARE async-iterable — but it answers a different question. This emitter is arbitrary; converting it yourself is the exercise, and saying "I would reach for streams if this were flow-controlled binary data, otherwise here is the converter" is the complete answer.`,
    hints: [
      'Where does a value sit if it arrives while the consumer is still processing the previous one?',
      'Who unsubscribes the listeners when the loop breaks?',
    ],
    tags: ['async', 'iteration', 'events', 'coding'],
  },
  {
    id: 'break-runs-finally-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A team iterates a database cursor with for-await and breaks on a match. In review, what guarantees the connection closes?',
    options: [
      'Nothing — breaking leaks the cursor; the code must drain the remaining rows first',
      'break calls return() on the iterator, which resumes the generator into its finally block where the close lives',
      'The garbage collector finalises the cursor once the loop scope exits',
      'for await loops always exhaust their source internally, so the cursor closes naturally',
    ],
    correctOption: 1,
    answerInFull: `The break triggers return() on the iterator. That resumes the async generator one last time — as though the current yield threw a completion signal — which unwinds into its finally block. If the close lives there, it runs, awaited, before the loop statement finishes.

    async function* cursor(query) {
      const handle = db.open(query)
      try {
        while (true) yield await handle.next()
      } finally {
        await handle.close()
      }
    }

    for await (const row of cursor(q)) {
      if (row.id === stop) break // close() runs
    }

This division of labour is the design point: cleanup knowledge belongs to the producer, delivery belongs to the protocol. Consumers break freely without knowing a handle exists, and producers stay leak-free without trusting consumers to notify them.

Same rule as sync generators and even file handles in other languages — early exit is modelled as completion, not abandonment. Throwing from the loop body triggers it identically, which matters more than break in practice: the error path is the one people forget to test.`,
    explanation: `"Must drain first" describes the workaround teams ship before learning the protocol — reading rows nobody wants to appease a handle. It works and it is the wrong shape.

GC finalisation is real eventually and useless now: timing is unbounded, and in most drivers nothing deterministic ever runs. Connections held against a pool until collection is how pools empty.

Internal exhaustion contradicts break's meaning. If the loop drained its source behind your back, early exit would be meaningless and infinite generators impossible.`,
    hints: ['What does the loop send back to the generator when you walk away?'],
    tags: ['async', 'iteration', 'scenario'],
  },
  {
    id: 'push-pull-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Explain push versus pull in the context of async iteration. Why do async generators make good converters, and where does each model win?',
    answerInFull: `- Push: the source decides timing. Events, streams, sockets, webhooks. The consumer registers callbacks and must be ready for values at any moment, including overlapping ones. Backpressure — telling the source to slow down — is the hard problem, and unhandled, it means buffering without bound or dropping.
- Pull: the consumer decides timing. Loops, requests, generator.next(). Work happens only when asked, so pacing, pausing and stopping are structural rather than negotiated. The cost is latency: a pull-based consumer sees nothing until it asks.

Async generators convert push to pull because the protocol gives them both sides. Listeners receive pushed values into a queue — the push side — and next() drains that queue one value at a time under the consumer's control — the pull side. Between the two sits suspension: the generator awaits when the queue is empty instead of polling, and breaks call return(), which unsubscribes in finally.

Push wins when values arrive whether or not anyone is watching — UI events, live feeds — and when lowest latency matters. Pull wins when the consumer needs control: ordered processing, bounded memory, clean cancellation, testability (a fake producer is just another generator).

The senior-shaped ending: backpressure is the whole game. Pull models have it for free — the consumer simply asks again later. Push models must build it, which is why streams grow plumbing like pause and pipe, and why "wrap it in an async generator" is often the cheapest backpressure mechanism available.`,
    explanation: `Interviewers probe two places. First, what actually queues between push and pull — vague answers reveal people who have used the pattern without building it. Second, when NOT to convert: a high-frequency feed consumed slowly turns any converter into a growing buffer, and naming that limit shows judgement beyond mechanics.`,
    hints: [],
    tags: ['async', 'iteration', 'design'],
  },
  {
    id: 'generator-execution-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'staff',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `async function* gen() {
  console.log('body start')
  yield 1
  console.log('body resumed')
}

const g = gen()
console.log('created')
g.next().then(({ done }) => console.log('next1 done=' + done))
g.next().then(({ done }) => console.log('next2 done=' + done))
console.log('sync end')`,
    items: [
      'created',
      'body start',
      'sync end',
      'next1 done=false',
      'body resumed',
      'next2 done=true',
      'next2 done=false',
    ],
    correctOrder: [0, 1, 2, 3, 4, 5],
    answerInFull: `created, body start, sync end, next1 done=false, body resumed, next2 done=true

Calling gen() creates the generator object and prints nothing from the body — generators are lazy; no line of the body runs until the first next(). That first next() runs synchronously up to yield 1: "body start" prints, and the returned promise resolves with { value: 1, done: false }, delivering "next1 done=false" as a microtask.

The second next() was already queued — generators execute one step at a time, so it waited. Only after the first segment settles does it run: it resumes the body, printing "body resumed", the function returns, and its promise resolves with done: true, delivered as the final microtask.

Three durable lessons: creation runs nothing; each next() drives exactly one segment of the body; and a second next() queues behind the first rather than racing it.`,
    explanation: `"next2 done=false" is what falls out of assuming both nexts observe the same state, or that the second call somehow re-runs from the top. Each call receives its own step's result, and the second step is completion.

Placing "sync end" anywhere earlier forgets that the first next() executes body code synchronously up to the yield — created and body start are neighbours in the same turn.

Reading the body as eager — printing body start at creation — misses the single most examinable property of generators. Nothing inside runs until asked.`,
    hints: [
      'What runs at gen() call time?',
      'Can the second next() execute before the first settles?',
    ],
    tags: ['async', 'generators', 'iteration'],
  },
  {
    id: 'queued-next-calls-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You call next() twice on an async generator in quick succession, before either resolves. What happens?',
    options: [
      'Both run concurrently, interleaving the generator body across the two calls',
      'The second call rejects; a generator accepts one pending next() at a time',
      'The second call queues and resolves with the following step, once the first has settled',
      'The second call returns the same result object as the first',
    ],
    correctOption: 2,
    answerInFull: `It queues. An async generator runs one segment at a time: the second next() waits until the first's segment settles, then executes the next segment and resolves with that step's result. There is no concurrency inside a generator, ever.

    const g = someGen()
    const p1 = g.next() // starts segment one
    const p2 = g.next() // queued

    const a = await p1 // { value: v1, done: false }
    const b = await p2 // { value: v2, ... } — computed after a

This guarantee is what makes generators safe state machines: internal variables cannot race, because only one execution context ever advances the body. It is also why naive prefetching — firing many nexts hoping to pipeline — gains nothing and mostly confuses bookkeeping.

If you want genuine concurrency from a producer, say where it belongs: start the underlying operations eagerly (fetches kicked off before yielding), or skip generators for the concurrent section and use Promise.all over tasks. Generators coordinate; they do not parallelise.`,
    explanation: `Interleaving would require two execution contexts inside one function body, which the language does not provide for generators any more than for ordinary functions.

Rejecting duplicate calls is a plausible API design and not this one. The spec chose queuing, which keeps manual consumption forgiving — though relying on the order of resolution across queued calls is exactly the kind of cleverness reviews flag.

Sharing one result object would break the contract visibly: each next() reports its own step, with its own value and done flag. Distinct steps, distinct results.`,
    hints: [],
    tags: ['async', 'generators'],
  },
  {
    id: 'error-ends-generator-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'After one bad record, this import stops entirely — the catch around the loop ran, and restarting re-processes from scratch. What happened and what is the fix?',
    code: `try {
  for await (const record of records()) {
    await import(record)
  }
} catch (e) {
  log.error('import failed', e)
}`,
    options: [
      'The catch caught the error and swallowed it, so the loop silently continued from the next record',
      'records() kept producing after the failure but the loop ignored new values after catching',
      'A rejection from the generator throws out of the loop and ends the iteration permanently; the generator cannot resume',
      'import must be wrapped in its own try/catch, or the whole event loop crashes',
    ],
    correctOption: 2,
    answerInFull: `A rejection anywhere in the iteration — the generator failing, or import throwing — propagates as a throw from the for-await statement. The catch received it, but by then the iteration was over: a thrown error terminates the generator permanently. There is no resuming a failed iterator, and the restart-from-scratch behaviour follows.

If bad records should be skipped rather than fatal, the boundary moves inward:

    for await (const record of records()) {
      try {
        await import(record)
      } catch (e) {
        failures.push({ record, error: e })
      }
    }

Each record now owns its failure; the iteration survives, and failures collects the report. Choose deliberately per policy: fail-fast when partial imports are dangerous, isolate-and-continue when one poisoned row should not veto thousands of good ones.

Worth adding unprompted: the generator-side variant behaves symmetrically — a throw inside the async generator rejects the next() promise, surfaces at the loop, and ends the producer. Errors travel in both directions through the same channel.`,
    explanation: `Swallowing would require the catch to be inside the loop body. An outer catch observes the failure precisely because the iteration threw it outward and stopped.

No post-catch continuation exists. The loop statement exited via throw; nothing holds iteration state to continue from, and the generator is closed regardless.

Crashing the event loop is the uncaught-rejection story, not the caught one. This error was handled — the complaint is that handling came too late to preserve position.`,
    hints: ['What state remains in the iterator after a rejection passes through it?'],
    tags: ['async', 'iteration', 'error', 'debugging'],
  },
  {
    id: 'collecting-async-iterables-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You have an async iterable and need all its values in an array. What is the idiomatic approach?',
    options: [
      'Array.from(iterable), which awaits internally for async iterables',
      'Loop with for await, pushing each value — there is no built-in async reduce or map over async iterables',
      '[...iterable], spreading resolves each promise as it is collected',
      'Promise.all over the iterable, which gathers values as they resolve',
    ],
    correctOption: 1,
    answerInFull: `Pull them yourself:

    const all = []
    for await (const v of iterable) {
      all.push(v)
    }

The language ships almost no combinators over async iterables. Array methods — map, filter, reduce — work on arrays and sync iterables, not async ones, so the loop is the standard tool. Wrapping it once in a helper (toArray, or one of the small libraries offering async map/reduce) pays for itself the second time you need it.

Also worth knowing: Array.from accepts any iterable with Symbol.iterator and optionally a mapper — it neither reads Symbol.asyncIterator nor awaits, so it produces an array of pending promises at best. Spreading has the same requirement and fails outright on async-only sources.

And note what collecting costs: it defeats the laziness that motivated the iterator. Fine when you truly want everything; wrong when the point was processing values as they arrive.`,
    explanation: `Awaiting internally is not something Array.from does — its signature predates async iterables and its contract is purely synchronous collection.

Spread syntax consults Symbol.iterator specifically. On async iterables it throws the same TypeError plain for...of does, for the same reason.

Promise.all over an iterable of promises is a real pattern for arrays of tasks — but an async iterable is not an array of promises, and handing Promise.all a source with Symbol.asyncIterator does not drain it. Different shape, different tools.`,
    hints: [],
    tags: ['async', 'iteration'],
  },
]
