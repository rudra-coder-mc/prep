import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'await-rejection-throws',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does awaiting a rejected promise do?',
    options: [
      'Returns the rejection reason as the value of the await expression',
      'Throws the rejection reason at the await, where surrounding try/catch can see it',
      'Swallows the rejection and continues with undefined',
      'Schedules the throw as a macrotask so it runs after the current script',
    ],
    correctOption: 1,
    answerInFull: `It throws. The rejection reason is raised as an exception at the await expression itself, which means ordinary try/catch around your awaits works exactly the way it does for synchronous code.

    try {
      const user = await fetchUser(id)
    } catch (error) {
      // network failure, 404 mapped to an error, anything fetchUser rejected with
    }

This is the core value of async/await for error handling. In promise chains you had to remember a catch on every chain; with await there is one mechanism for both worlds.

The corollary has teeth: if you do not await, nothing throws anywhere you can see. The rejection stays inside the promise, surfaces later as unhandled, and your catch never ran because no exception ever occurred in its block.`,
    explanation: `Returning the reason would make failures look like data, which is precisely what promises avoid — every consumer would need to check for error-shaped values forever.

Swallowing describes what a careless catch does, not what await does. Await does not handle anything; it just moves the rejection into the exception channel.

The macrotask option borrows real scheduling vocabulary. The resumption after an await is a microtask, and more importantly it happens only when the promise settles — a rejection is delivered as a throw into your function, not deferred past it.`,
    hints: [],
    tags: ['promise', 'async', 'error'],
  },
  {
    id: 'chain-throw-to-catch-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `Promise.resolve()
  .then(() => {
    console.log('one')
    throw new Error('boom')
  })
  .then(() => console.log('two'))
  .catch((e) => {
    console.log('caught', e.message)
    return 'safe'
  })
  .then((v) => console.log('after', v))`,
    options: [
      'one, two, caught boom, after safe',
      'one, caught boom, after safe',
      'one, caught boom',
      'one, after undefined',
    ],
    correctOption: 1,
    answerInFull: `one, caught boom, after safe

The first callback throws, which rejects the promise that then returned. A rejection flows past handlers that cannot deal with it — the second then is skipped entirely — until the catch receives it. The catch logs and returns normally, so the promise it produced fulfils with "safe", and the final then receives that recovered value.

Three rules cover every chain like this. A throw inside a then callback rejects that then's promise. A rejection skips subsequent thens until the nearest catch. And a catch that returns normally fulfils, making everything downstream read as success.

That third rule is why mid-chain catches deserve scrutiny: after this catch, no later handler can tell an error ever happened. Put catches where recovery is genuinely intended, or rethrow from them.`,
    explanation: `"one, two" together assumes then callbacks run in sequence regardless of state. Handlers only run when the state matches: fulfilled thens run on fulfilment, and a rejection skips them without ceremony.

Stopping at "caught boom" forgets that returning from catch is still a normal return. The chain continues with whatever the catch produced.

"after undefined" pairs the right flow with the wrong value. Undefined would appear if the catch returned nothing; here it returns the string, and adoption of return values is what carries it along.`,
    hints: ['Which handlers does a rejection run, and which does it skip?'],
    tags: ['promise', 'async', 'error'],
  },
  {
    id: 'unawaited-promise-escapes',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This logs neither "handled" nor the fallback. Where did the error go?',
    code: `async function main() {
  try {
    riskyOperation() // returns a promise
    console.log('started')
  } catch (error) {
    console.log('handled')
    return FALLBACK
  }
}`,
    options: [
      'riskyOperation threw before the catch was registered, so the error escaped main entirely',
      'catch cannot be used inside async functions; it needs .catch on the call',
      'The promise rejected after the try block had already exited, so the rejection became unhandled',
      'main returned before the promise settled, which cancels the pending work',
    ],
    correctOption: 2,
    answerInFull: `The promise rejected later, after the try block had already exited. Nothing was there to receive it, so it surfaced as an unhandled rejection: no "handled", no fallback, just the warning (or crash, depending on runtime policy).

Awaiting fixes it, because the await keeps main suspended until settlement and delivers the rejection as a throw inside the try:

    try {
      await riskyOperation()
    } catch (error) {
      return FALLBACK
    }

The general statement worth making in an interview: try/catch covers what throws while the block executes. A promise you start but do not await throws when the block is long gone. Every lost-error bug in asynchronous JavaScript is some variation of that gap.`,
    explanation: `The first option has the timing backwards. If riskyOperation threw synchronously, the catch would run — that is the case try handles fine. The whole problem is that it does not throw yet.

catch works perfectly well inside async functions once something actually throws within it. The missing piece is await, not a different syntax.

Nothing cancels the work. Returning from main does not reach into the pending promise; it keeps running, fails, and reports to nobody. That is also why fire-and-forget calls must always carry their own catch.`,
    hints: ['When does the rejection happen relative to the try block?'],
    tags: ['promise', 'async', 'error'],
  },
  {
    id: 'timer-throw-unreachable',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A teammate wrapped a timer in try/catch and the process still crashed. Why did the catch not run?',
    code: `try {
  setTimeout(() => {
    throw new Error('validation failed')
  }, 100)
} catch (error) {
  log.error(error)
}`,
    options: [
      'setTimeout swallows exceptions thrown by its callback and reports them nowhere',
      'The throw happens a hundred milliseconds later, in stack frames unrelated to the try block',
      'Arrow functions cannot propagate throws across a scheduling boundary',
      'Errors thrown inside timers are queued as microtasks and bypass catch blocks',
    ],
    correctOption: 1,
    answerInFull: `The callback runs long after the try block has finished executing. When it throws, the active stack is the timer machinery's, not yours — there is no try anywhere beneath the throw to catch it, so the error escapes to the top level.

You cannot catch across a scheduling boundary. You can only convert the failure into something with a destination:

    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(validate(input))
        } catch (error) {
          reject(error)
        }
      }, 100)
    })

Now the throw inside the callback becomes a rejection of the wrapping promise, and an await on it throws back in context that has a catch. This wrap-and-reject shape is how any callback-style API gets pulled into the promise world — the same thing util.promisify does generically.

The same rule explains event emitters, stream handlers and every other platform callback: register an error channel, because the caller's catch is unreachable.`,
    explanation: `Timers do not swallow anything. The error is reported loudly — as an uncaught exception that can take down a Node process. The problem is delivery, not suppression.

There is nothing special about arrow functions here; a function declaration in the same position behaves identically. Scheduling, not syntax, breaks the chain.

Microtasks are the wrong vocabulary twice over: timer callbacks are macrotasks, and neither queue changes who is on the stack when the callback body runs. Catchability is about the stack, and the stack belongs to whoever called the callback.`,
    hints: ['Whose stack is active when the callback finally runs?'],
    tags: ['async', 'error', 'timer'],
  },
  {
    id: 'finally-semantics-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'In a plain (non-async) function, the try block returns 1 and the finally block assigns a variable but returns nothing. What does the caller receive?',
    options: [
      'undefined, because finally always has the last word',
      '2, the value of the variable assigned in finally',
      'An error, because returning from inside try with a finally is illegal',
      '1 — the try result stands unless finally itself throws or returns',
    ],
    correctOption: 3,
    answerInFull: `1. A finally block without a return or throw changes nothing about the function's outcome; the try block's return value stands.

The precise rules, which interviewers like precisely because people half-know them:

- finally always runs, whichever way the try exits.
- If finally **throws**, that exception replaces everything, including an in-flight return.
- If finally **returns**, that value overrides the try's return — a classic trap, because it silently discards results and even swallows in-flight exceptions.
- Promise .finally follows the spirit and differs in the detail: a plain return value from its callback is ignored, but a thrown error or a returned rejected promise replaces the outcome.

So use finally for cleanup — clearing timers, hiding spinners, closing cursors — and never as a place where the result gets decided. If you feel tempted to return from finally, the logic belongs somewhere else.`,
    explanation: `"Finally always has the last word" is true about execution and false about values, which is exactly the confusion to clear up. It runs last; it overrides only by throwing or explicitly returning.

The assigned variable has no bearing unless the caller reads it through some other channel. Return values travel by return statements.

The illegality option invents a rule. Returning from try alongside a finally is completely standard, and it is the everyday shape: acquire in try, release in finally.`,
    hints: ['What can a finally block do that changes the outcome?'],
    tags: ['error', 'async'],
  },
  {
    id: 'selective-catch-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'readCache may legitimately fail (cold cache) and should fall back to null. fetchFresh failing must propagate to the caller. Which implementation draws that line correctly?',
    options: [
      'Wrap both awaits in one try/catch; on error check the error message and continue only if it mentions cache',
      'Attach .catch(() => null) to readCache alone, and leave fetchFresh outside any local handling',
      'Catch errors from both calls and rethrow whichever one came from fetchFresh, identified by call order',
      'Run both through Promise.allSettled and pick out the entries that succeeded',
    ],
    correctOption: 1,
    answerInFull: `Handle each call at its own boundary:

    async function load() {
      const cached = await readCache().catch(() => null)
      const fresh = await fetchFresh(cached)
      return render(fresh)
    }

The catch attached to readCache applies to that call only, converting its expected failure into the documented default. fetchFresh is awaited bare, so a failure throws straight out of load to whoever decided what failures mean there.

This is the readable version of a policy worth stating explicitly: expected, survivable failures are handled at the call site where the fallback is known; unexpected failures propagate untouched. One mechanism per policy, visible in the shape of the code.

If the two calls were independent rather than sequential, allSettled would earn its place — here they depend on each other, so it adds ceremony without changing anything.`,
    explanation: `String-matching messages to decide what failed is fragile twice over: messages change, and the broad try still intercepts bugs thrown by render, not just the two awaited calls. Error types narrow it slightly; separate boundaries remove the question entirely.

Rethrowing by call order encodes control flow in accidentals. Swap the order of two awaits and the classification quietly inverts — a bug class you have invented for yourself.

allSettled never rejects, which sounds ideal, but it flattens both outcomes into data. Now fetchFresh's genuine failure sits in a status field that this code must inspect and raise manually — the propagation the requirement asked for, rebuilt by hand.`,
    hints: [],
    tags: ['promise', 'async', 'coding', 'error'],
  },
  {
    id: 'framework-handler-boundary',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'An async request handler throws while processing a route. Where does the error end up?',
    code: `app.get('/orders', async (req, res) => {
  const orders = await ordersDb.list(req.user.id) // throws
  res.json(orders)
})`,
    options: [
      'The throw propagates synchronously to the HTTP server, which closes the connection',
      'It rejects the promise the handler returned, and whether the framework forwards that rejection depends on the framework and version',
      'Any rejection inside a handler crashes the Node process, by design',
      'The response hangs open forever, because nothing ever settles',
    ],
    correctOption: 1,
    answerInFull: `The handler being async means a throw inside it rejects the promise it returned instead of throwing synchronously at the registration site. What happens next is entirely up to the framework that received that promise.

Frameworks differ, and the difference has bitten real teams. Older Express ignores a rejected handler promise: the error vanishes from logs and the client hangs until timeout. Express 5 and frameworks built for async handlers — Fastify, Nest, Koa — forward the rejection to their central error path, producing a 500. Same code, opposite outcomes.

So the answer to give is the principle plus the verification habit: the rejection exists as a rejected promise, and I would check what my framework does with one rather than assume. In a framework that drops it, the defences are explicit per-route catching or wrappers that forward every rejection to next(error).

And the global net still matters. An unhandledrejection listener turns a silent drop into a logged signal, wherever the framework falls short.`,
    explanation: `Synchronous propagation is the pre-async world. With a non-async callback, a throw really does hit the framework's dispatch synchronously, which is why older Express handled sync errors fine while dropping async ones — the asymmetry that made this question worth asking.

Crashing the process is what Node does with an unhandled rejection under modern default policy, but a forwarded rejection is handled, not unhandled, so frameworks that forward it prevent exactly this.

"Hangs forever" is the observed symptom of the worst case, not the mechanism. The promise settled; the framework just never translated that into a response.`,
    hints: ['What does calling an async function produce, and who holds it?'],
    tags: ['promise', 'async', 'error', 'node'],
  },
  {
    id: 'lost-errors-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Where can an error get lost in asynchronous JavaScript? Walk me through the boundaries, and how you make sure nothing escapes unnoticed.',
    answerInFull: `Name the boundaries where a throw lands with nobody listening:

- A promise created but not awaited: the try block exits before the rejection exists, so it surfaces as unhandled.
- Callbacks the platform schedules later — setTimeout, event emitters, stream handlers — where the original stack is gone and no outer catch is reachable. These need their own destination: wrap in a promise, or use the source's error channel.
- Fire-and-forget calls whose promise is discarded; every such call needs a catch attached at creation.
- A mid-chain catch that returns a default: downstream sees success and cannot tell recovery from swallow.
- A broad try around many awaits: it catches everything but can say nothing about what failed, including your own bugs.

The defences follow directly. Await what you call, attach handlers when promises are created, keep one catch per policy at the boundary that knows the recovery, and maintain a global unhandledRejection listener as a detector — it fires once microtasks drain with no handler attached, which makes escaping errors visible in logs instead of invisible everywhere.

Two hygiene points worth adding unprompted: throw Error objects so stacks survive, and never let a logging path itself stringify an error into nothing.`,
    explanation: `The strongest answers order this list by how often each bites in practice — un-awaited promises first, by a distance. Naming boundaries in the order they occur in a request lifecycle shows the model rather than the memorised list.`,
    hints: [],
    tags: ['promise', 'async', 'error', 'design'],
  },
  {
    id: 'rejection-skip-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `Promise.reject(new Error('early'))
  .then(() => console.log('first'))
  .catch((e) => console.log('caught'))
  .finally(() => console.log('cleanup'))
  .then(() => console.log('last'))`,
    items: ['first', 'caught', 'cleanup', 'last', 'unhandled rejection: Error: early'],
    correctOrder: [1, 2, 3],
    answerInFull: `caught, cleanup, last

The initial rejection flows past the first then, which only runs on fulfilment, into the catch. The catch handles it and fulfils. finally runs next, purely for cleanup, changing nothing. The final then sees the recovered state and prints last.

Worth attaching words to: the promise passed to the chain is handled from the moment the catch is attached, so there is no unhandled rejection warning despite the rejection existing from time zero. Handlers attached late still count — late attachment only bites when nothing attaches until after the microtask drain.

finally printing between the catch and the last then is the detail people miss. It is part of the chain, sequenced like any other link, not something bolted on at the end.`,
    explanation: `"first" is the line everyone writes down who reads chains top to bottom like a script. Rejections skip fulfilment handlers; that skip is the mechanism the whole question tests.

The unhandled rejection line tempts anyone who has heard that early rejections warn. Here a catch is attached synchronously in the same turn, which is exactly the window the check looks at.

Ordering cleanup after "last" misreads finally as a post-chain hook rather than a link in the chain. Its position is literal.`,
    hints: ['Which single handler can act on a rejection?'],
    tags: ['promise', 'async', 'error'],
  },
  {
    id: 'foreach-async-swallow-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This validation loop is supposed to stop at the first bad record. Records after the invalid one still get processed, and the failure appears as an unhandled rejection warning. Why?',
    code: `records.forEach(async (record) => {
  if (!valid(record)) {
    throw new Error('invalid record ' + record.id)
  }
  await persist(record)
})`,
    options: [
      'forEach awaits each callback, and the throw aborts the loop but is reported asynchronously afterwards',
      'The throw rejects the callback’s promise, which forEach discards; the loop itself is synchronous and finishes immediately',
      'async callbacks run on the microtask queue, so the loop processes records in a different order than expected',
      'persist must be awaited before the validity check, otherwise valid records overwrite invalid ones',
    ],
    correctOption: 1,
    answerInFull: `forEach knows nothing of promises. It invokes the callback for each record synchronously and discards whatever comes back. Each async callback starts, hits its first await or throw, and hands back a promise nobody holds — so a throw rejects that orphaned promise, produces the unhandled rejection warning, and the loop rolls on through every remaining record regardless.

Neither property anyone wanted survives this construction: no stopping, no sequencing, no error reaching the caller.

The fix depends on which property mattered. To stop at the first bad record and surface the error:

    for (const record of records) {
      if (!valid(record)) throw new Error('invalid record ' + record.id)
      await persist(record)
    }

Sequential and loud. If the records are independent and should all be attempted, validate first, partition, and persist the good ones with Promise.all — reporting rejects rather than throwing mid-loop. What is never right is an async callback handed to forEach, map over ids being the idiomatic exception only because Promise.all adopts what map collects.`,
    explanation: `forEach awaiting its callbacks would change the language: it is defined to be synchronous iteration, and no version of it waits. That belief usually comes from for...of over an array of awaits, which genuinely does sequence.

Microtask ordering is a red herring here. The callbacks' bodies do start synchronously up to the first await; ordering was never the complaint, and nothing about queues reorders records.

The persist-before-check swap invents a data race that this code does not have. Invalid records are simply persisted too, since nothing stops the loop — but the mechanism is the discarded promise, not interleaving.`,
    hints: ['What does forEach do with the value each callback returns?'],
    tags: ['promise', 'async', 'error', 'arrays'],
  },
  {
    id: 'stringify-error-destroys',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Your error logger sends JSON.stringify(error) to your monitoring service, and failures arrive as "{}". What is wrong and what is the fix?',
    options: [
      'Errors must be serialised with a replacer function listing allowed properties',
      'JSON.stringify cannot read Error properties because message and stack are non-enumerable; send message and stack explicitly, or install a serializer that copies them',
      'Error objects are circular structures, so stringify bails out and emits an empty object',
      'The service requires base64 encoding; stringify output is being dropped by the transport',
    ],
    correctOption: 1,
    answerInFull: `JSON.stringify only includes enumerable own properties, and an Error's useful fields — name aside — are non-enumerable: message and stack live on the prototype or as hidden properties. So stringify(new Error('boom')) produces {} and the service receives an empty object.

Fix by sending the fields deliberately:

    JSON.stringify({ name: err.name, message: err.message, stack: err.stack })

or teach your logging layer to serialise errors once, centrally, so every call site benefits. Interpolating an error into a template string is the same trap in miniature: String(err) yields "Error: boom", losing the stack that says where.

This is a small bug with a large cost: it strikes exactly when things are already failing, so the one moment you need diagnostics is the moment your telemetry is blank. Worth checking your own logger after this topic — most teams have this bug live somewhere.`,
    explanation: `A replacer listing properties cannot help, because the problem is enumerability, not filtering — the replacer never sees the properties either. Subclassing errors with extra enumerable fields partially works, which is why the bug seems intermittent across error types.

Circularity is a real stringify failure mode, but it raises a TypeError rather than emitting {}, and plain Errors are not circular.

Transport-level explanations are unfalsifiable from here, but the empty object is fully explained before the transport is involved. Reproduce it locally in a node REPL and the mystery dissolves in ten seconds.`,
    hints: ['What does JSON.stringify actually enumerate?'],
    tags: ['error', 'scenario', 'debugging'],
  },
  {
    id: 'thrown-value-has-no-message',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'The handler runs, so the failure was caught. Why does it log "failed: undefined"?',
    code: `async function load() {
  throw 'not found'
}

load().catch((error) => console.log('failed:', error.message))`,
    options: [
      'A rejection reason is wrapped before it reaches the handler, so the string is on error.reason instead',
      'Throwing a value that is not an Error loses the reason, so the handler receives an empty object',
      'The handler receives exactly what was thrown, and what was thrown is a string. A string has no message property',
      'error.message is filled in when the stack is captured, and throwing a plain value skips that step',
    ],
    correctOption: 2,
    answerInFull: `Because a string was thrown. throw takes any value at all, and the handler receives that value untouched, so error is the string and a string has no message.

Throw an Error instead:

    throw new Error('not found')

An Error carries a message and a stack, and the stack is the half that says where. A string carries the sentence and nothing else, so the log tells you what went wrong and never where, at exactly the moment you need to know.

This matters more than it looks, because the handler is usually a long way from the throw and cannot check. Every line that reads error.message, logs error.stack, or narrows with instanceof is written against Errors and quietly does nothing useful for anything else. Rejecting with a plain object is the same problem in friendlier clothing.

Code at a real boundary is written to survive what other people throw:

    const message = error instanceof Error ? error.message : String(error)`,
    explanation: `Nothing wraps a rejection reason. That is the same rule that lets you reject with a custom error subclass and read your own fields off it in the handler, so it is worth getting right in both directions.

The reason plainly survived: the handler ran, which means it was given something to run with. It received the string and asked it for a property it does not have.

The stack option sounds like a real mechanism and is not one. An Error captures its stack when it is constructed, not when it is thrown, which is worth knowing separately: an error built far from where it is thrown carries a stack that points at the wrong place.`,
    hints: ['What exactly is the handler given?'],
    tags: ['error', 'async', 'debugging'],
  },
  {
    id: 'catch-placed-too-early-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `Promise.resolve()
  .catch((error) => console.log('caught', error.message))
  .then(() => {
    throw new Error('late')
  })`,
    options: [
      'caught late',
      'Nothing, and the error is discarded, because the chain already has a handler on it',
      'Nothing. There is no handler after the throw, so it surfaces as an unhandled rejection',
      'caught undefined, since the catch runs with no reason to report',
    ],
    correctOption: 2,
    answerInFull: `Nothing is printed. The throw rejects the promise that the last then returned, there is nothing attached below it, and the rejection is reported as unhandled. Node ends the process by default; a browser logs "Uncaught (in promise)".

A chain is a sequence of links, and a handler only sees what reaches it from above. This catch is attached to an already fulfilled promise, so it never runs, and it is finished long before the then underneath it throws.

Move it to the end, where everything above drains into it:

    Promise.resolve()
      .then(() => {
        throw new Error('late')
      })
      .catch((error) => console.log('caught', error.message))

The rule to carry away: a catch protects what is above it and never what is below. That is also the reason a catch in the middle of a long chain deserves a second look. Anything it does not rethrow, the rest of the chain reads as success.`,
    explanation: `"caught late" reads catch as covering the whole chain, the way a try block covers everything between its braces. Each handler is attached at one point in a sequence, and position is the entire answer here.

The discarded option gets the printing right and the consequence wrong. Nothing goes quietly. An unhandled rejection is reported, and under Node's default policy it takes the process down.

"caught undefined" has the catch running on a promise that was never rejected. A fulfilled promise skips catch handlers in exactly the way a rejected one skips thens.`,
    hints: ['What is each handler attached to?'],
    tags: ['promise', 'error', 'async'],
  },
  {
    id: 'catch-that-does-not-rethrow-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'An async function catches an error, logs it, and the catch block ends there. What does its caller get?',
    options: [
      'A rejected promise, since the error still happened',
      'A fulfilled promise holding the error object as its value',
      'Nothing. The function never settles, because the catch consumed the outcome',
      'A fulfilled promise holding undefined, so as far as the caller can tell the call succeeded',
    ],
    correctOption: 3,
    answerInFull: `A fulfilled promise holding undefined. Catching an error handles it, and a function that falls off the end of its catch block returns undefined, so the promise fulfils with undefined and the caller reads that as success.

    async function load(id) {
      try {
        return await fetchUser(id)
      } catch (error) {
        console.log(error)   // handled, and now invisible
      }
    }

The caller receives undefined and cannot tell whether the user was missing, the network was down, or fetchUser has a bug in it. Logging is not handling. Handling means deciding what the failure means, and a catch block has only three honest endings:

Return a deliberate fallback, when this is the layer that knows one is correct.

Rethrow with throw error, when it is not. Adding context on the way past is better still, since Error takes a cause: throw new Error('loading user ' + id, { cause: error }).

Or do not catch here at all, and let the layer that knows about it deal with it.

A catch that only logs is the most common way an error disappears in a codebase that has error handling everywhere.`,
    explanation: `A rejected promise is the intuition that an error which happened must still be visible somewhere. Catching it is precisely what stops it being visible, which is what catching is for.

Fulfilling with the error object is what a result-type API does, returning failures as ordinary values, and it is a real design used in other languages. JavaScript has two channels rather than one, and a caught error is in neither of them until you put it back.

A promise that never settles is a real failure mode, from an executor that neither resolves nor rejects. Reaching the end of a catch block is an ordinary return rather than a hang.`,
    hints: ['What does a function return when it falls off the end of a catch block?'],
    tags: ['error', 'async', 'design'],
  },
  {
    id: 'executor-throw-rejects-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `new Promise(() => {
  throw new Error('boom')
}).catch((error) => console.log('caught', error.message))`,
    options: [
      'Nothing. The throw happens at the line that constructs the promise, before there is a catch to reach it',
      'caught boom',
      'Nothing. The promise stays pending forever, since neither resolve nor reject was called',
      'caught undefined, because reject was never called with a reason',
    ],
    correctOption: 1,
    answerInFull: `caught boom

A throw inside the executor rejects the promise with whatever was thrown. The constructor catches it on your behalf, so there is no synchronous exception at the new Promise line, and the catch at the end receives the error exactly as if reject had been called with it.

This is worth knowing because the executor runs synchronously, which makes it look like ordinary code where an ordinary throw would apply. It is the one place where the promise machinery is already wrapped around your code before that code runs.

The rule stops at the first asynchronous boundary, and that is the part that catches people out:

    new Promise((resolve) => {
      setTimeout(() => {
        throw new Error('boom')   // rejects nothing
      }, 100)
    })

By the time the timer fires, the executor has long returned and nothing is wrapping the throw. Inside a scheduled callback you have to call reject yourself.`,
    explanation: `A synchronous throw at the construction is what the code looks like it should do, and the executor really does run synchronously, so the reasoning is sound right up to the last step. The constructor is a try block you did not write.

Staying pending forever is the correct behaviour for an executor that does nothing at all. This one does something: it throws, and throwing counts as settling.

"caught undefined" is what calling reject with no argument would give you, and nothing here calls reject. The thrown value is the reason.`,
    hints: ['Who is on the stack when the executor runs?'],
    tags: ['promise', 'error', 'async'],
  },
  {
    id: 'promise-finally-receives-nothing-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does a .finally callback receive, and what does the next .then in the chain get?',
    options: [
      'The settled value, and the next then gets whatever the finally callback returned',
      'The value if it fulfilled and the reason if it rejected, so the callback can tell which happened',
      'Nothing, and the next then gets the value the chain already had',
      'Nothing, and the next then gets undefined, since cleanup ends the chain it is in',
    ],
    correctOption: 2,
    answerInFull: `The callback is called with no arguments, and the value passes straight through it.

    Promise.resolve('value')
      .finally(() => console.log('done'))
      .then((v) => console.log(v))   // value

Both halves are deliberate. finally is for work that has to happen either way, and code that cannot see how things went cannot accidentally treat a failure as a success. Passing the outcome through untouched is what makes it safe to drop into the middle of a chain.

A rejection behaves the same way: it carries on past the finally to the next catch, so cleanup never swallows a failure.

There are exactly two ways to change the outcome from inside, and both are deliberate rather than accidental. Throwing replaces it with that rejection, and returning a promise that rejects does the same. A plain return value is ignored, which is the opposite of what returning from a then or a catch does.

Use it for clearing a timer, hiding a spinner, releasing a handle. If the code you are writing needs to know whether the thing succeeded, it belongs in then or catch instead.`,
    explanation: `Putting finally on the same footing as then is the natural reading, since every other handler in the chain passes its return value along. finally is the one whose return is ignored, and that asymmetry is what makes it cleanup rather than a step in the computation.

Receiving the value or the reason is what people want from it, and the API that provides it is the two-argument form of then, or a catch followed by a then. finally is blind on purpose.

The last option has cleanup destroying the result, which would make finally unusable anywhere except the end of a chain. Nothing is lost: the value it was handed is the value it passes on.`,
    hints: [],
    tags: ['promise', 'error', 'async'],
  },
]
