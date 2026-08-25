import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'abort-in-flight-fetch',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'A fetch is in flight when its signal is aborted. What happens?',
    options: [
      'The request is cancelled server-side and the promise fulfils with a partial response',
      'The fetch promise rejects with an AbortError, and the browser stops the request where it can',
      'The promise stays pending forever, because a settled-once promise cannot be moved',
      'The fetch promise fulfils with whatever bytes had arrived by then',
    ],
    correctOption: 1,
    answerInFull: `The fetch promise rejects with an AbortError, and the browser or Node cancels the underlying request as far as it can — closing the connection, dropping buffered work.

    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .catch((e) => {
        if (e.name === 'AbortError') return // cancelled on purpose
        throw e
      })
    controller.abort()

Two things make this more than trivia. First, AbortError is control flow: the cancellation was deliberate, so handling it means quietly exiting, not reporting failure. Second, abort takes an optional reason, and passing one — controller.abort(new Error('user navigated away')) — makes that reason arrive at the catch instead of a generic AbortError, which lets callers distinguish "superseded" from "cancelled for cause".

What abort never does is fulfil with partial data. There is no half-answer to accidentally render.`,
    explanation: `Cancellation server-side cannot be promised from the client; all the client controls is its own connection. The guarantee worth stating is about your code: the promise settles, deterministically.

Pending forever would be true of a bare promise handed to nothing — but fetch watches the signal, which is exactly what opting in means. A promise nobody watches is the case that motivates the API.

Partial fulfilment is the dangerous misreading, because it produces plausible garbage. Aborting means you did not want the response, so the design delivers none of it.`,
    hints: [],
    tags: ['promise', 'async', 'abort'],
  },
  {
    id: 'race-is-not-cancellation-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A teammate added a timeout by racing requests against timers. Server logs show every slow request still completing minutes later. Why?',
    code: `async function fetchWithTimeout(url, ms) {
  return Promise.race([
    fetch(url),
    sleep(ms).then(() => {
      throw new Error('timeout')
    }),
  ])
}`,
    options: [
      'Promise.race keeps both promises alive until they settle, so nothing is released',
      'Racing only decides who you wait for. Nothing told the request to stop, so it runs to completion in the background',
      'fetch ignores rejections that happen while it is pending and continues regardless of any race',
      'sleep resolves rather than rejects, so the race actually fulfilled and the throw never ran',
    ],
    correctOption: 1,
    answerInFull: `Race manages your waiting, not the work. When the timer wins, the race's combined promise rejects and your await throws — but the fetch promise keeps running, unobserved, until the server eventually answers into a void.

Stopping the request itself needs the signal:

    async function fetchWithTimeout(url, ms) {
      return fetch(url, { signal: AbortSignal.timeout(ms) })
    }

One line, because AbortSignal.timeout builds a self-aborting signal, and fetch genuinely cancels the request when it fires. For cases where you already have a controller — say a user gesture should also be able to cancel — pass its signal instead and combine deadlines with AbortSignal.any.

This is the sentence interviewers listen for: combinators decide whose result matters. Cancellation is a separate mechanism, and wiring it in is what separates a demo from production code.`,
    explanation: `Both racers do stay referenced until settlement, but that is bookkeeping, not the complaint. The observable problem is the request continuing, which reference-counting neither causes nor fixes.

fetch does not ignore anything. It was never given anything to listen to — no signal crossed the boundary between your timeout and the request.

sleep rejecting correctly is what makes the timeout fire at all, so the last option has the mechanism backwards. The bug is upstream of any rejection semantics.`,
    hints: ['Which object knows how to stop an HTTP request?'],
    tags: ['promise', 'async', 'abort', 'network'],
  },
  {
    id: 'late-abort-noop',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A fetch completes successfully. Five seconds later the code calls controller.abort(). What happens?',
    options: [
      'An AbortError is thrown at the next await anywhere in scope',
      'Nothing. The signal settled once already, and late aborts are ignored',
      'The completed response object is invalidated and later reads fail',
      'The abort event fires, letting cleanup run, but the response stands',
    ],
    correctOption: 1,
    answerInFull: `Nothing. A signal, like a promise, settles once. By the time fetch resolved, the operation was over; aborting afterwards is a silent no-op — no error, no event worth reacting to, no effect on data already delivered.

That irreversibility is the design working. If late aborts could retroactively poison completed operations, every shared signal would be a hazard: one consumer cancelling could corrupt another's finished result.

Where people actually meet this: controllers stored on components and aborted on unmount. The first unmount aborts in-flight work — correct. A second lifecycle event calling abort again finds nothing left to do, which is fine and needs no guarding.

The pattern that follows naturally: abort eagerly when work becomes unwanted, and treat "already done" as the harmless case it is. No state to reset, nothing to roll back.`,
    explanation: `There is no mechanism for throwing at "the next await". Abort reaches only code watching that particular signal, and only while it is still relevant — there is no global interrupt.

Responses are plain values once delivered. Nothing marks them expired; if you hold a response object, you may read it forever.

The abort event option is the subtle one, and wrong in an instructive way: signals built around a controller fire their event at the moment abort is called — but since the signal had already settled before this call, this abort produces no transition and nothing observes a change.`,
    hints: ['How many times can a signal change state?'],
    tags: ['promise', 'async', 'abort'],
  },
  {
    id: 'stale-search-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'In a search box, each keystroke fires a request. Responses arrive out of order and older results overwrite newer ones. Which fix addresses the actual defect?',
    options: [
      'Debounce the input so fewer requests fire, and accept occasional staleness',
      'Attach sequence numbers to responses and discard any that arrive out of order',
      'One AbortController per request; abort the previous one before starting the next, and treat its AbortError as expected',
      'Await all responses with Promise.allSettled and pick whichever arrived last',
    ],
    correctOption: 2,
    answerInFull: `Keep a current controller; on every keystroke abort the previous request and start a new one with a fresh controller. The superseded request dies mid-flight, its promise rejects with an AbortError, and your catch treats that specific error as success-shaped silence — the mechanism doing its job.

    let current
    async function search(q) {
      current?.abort()
      const controller = (current = new AbortController())
      try {
        const res = await fetch('/search?q=' + q, { signal: controller.signal })
        return await res.json()
      } catch (e) {
        if (e.name === 'AbortError') return
        throw e
      }
    }

Say why this beats the alternatives out loud. Debouncing reduces collisions but guarantees none — a slow response can still outrun a fast one. Sequence numbering patches the symptom after full cost has been paid: the stale response arrived, was parsed, and only then got discarded. Aborting prevents the work and the race at once, which also saves bandwidth and server load.

The discipline being tested: match on AbortError narrowly. A broad catch here would swallow genuine failures — network down, 500s — and render them as quiet no-ops too.`,
    explanation: `Debouncing is a genuine improvement to request volume, but it changes probability, not correctness. As a sole fix it ships the bug with better odds.

Sequence numbers do produce correct rendering, and are worth knowing for APIs you cannot abort — but they pay for every stale response in full and add bookkeeping to maintain. Where a signal exists, prevention beats detection.

allSettled waits for everything, including requests you already know are obsolete, then applies a selection rule that "arrived last" makes a synonym for "raced". It is the original bug expressed as architecture.`,
    hints: ['When does the stale response become impossible rather than merely detected?'],
    tags: ['abort', 'async', 'scenario', 'ui'],
  },
  {
    id: 'abort-event-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `console.log('start')

const ac = new AbortController()

setTimeout(() => {
  console.log('timer')
  ac.abort(new Error('stop'))
}, 0)

ac.signal.addEventListener('abort', () => console.log('event'))

await sleep(20)
console.log('end')`,
    items: ['start', 'timer', 'event', 'end', 'uncaught Error: stop'],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `start, timer, event, end

The script runs synchronously to the first await, printing start and registering the listener. The zero-millisecond timer fires next: it prints "timer" and calls abort, and the abort event dispatches synchronously to registered listeners — "event" prints within that same callback, before control returns to the event loop. Then sleep finishes and end prints.

Worth saying precisely: abort() flips the flag and notifies listeners immediately, synchronously. Unlike promise reactions, there is no microtask hop between abort and its listeners. That is why "event" lands inside the timer callback rather than after it.

The reason passed to abort travels to anyone who reads the event or awaits the signal — but nothing here consumes it, and nobody is awaiting an aborted fetch, so the reason goes nowhere dramatic.`,
    explanation: `"uncaught Error: stop" assumes passing a reason to abort throws something. A reason is payload for consumers, not an exception in search of a catcher; without a watcher awaiting rejection, it simply sits on the signal.

Swapping event and timer imagines listeners notified asynchronously, on a queue. The synchronous dispatch is the fact this question exists to test — it is the one behavioural difference from promise-style notification people need to absorb.

Placing end before the timer pair forgets that await suspends the function. The macrotask queue drains — timer included — before sleep's own timer resolves and the final line prints.`,
    hints: ['Does the abort event wait for a turn, or fire on the spot?'],
    tags: ['abort', 'async', 'events'],
  },
  {
    id: 'ignored-signal-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'generateReport accepts a signal, callers abort it correctly, yet the function always runs to completion. What is missing?',
    code: `async function generateReport(signal) {
  const data = await queryDb({ signal })
  const shaped = shapeData(data)
  return renderPdf(shaped)
}

// elsewhere:
const controller = new AbortController()
generateReport(controller.signal)
controller.abort()`,
    options: [
      'queryDb must be called with the raw controller rather than the signal for propagation to work',
      'shapeData and renderPdf never consult the signal, and nothing checks between steps; the signal was accepted but never read again',
      'abort() fired before queryDb started, and signals only take effect for operations started after the abort',
      'Async functions cannot observe signals; only platform APIs like fetch respond to them',
    ],
    correctOption: 1,
    answerInFull: `Accepting a signal obliges you to check it. Here only queryDb does — and once it resolves, nothing ever looks at the flag again, so shapeData and renderPdf run regardless. The caller believes the report was cancelled; the CPU disagrees.

Fix by making checkpoints explicit between steps that do not natively watch the signal:

    async function generateReport(signal) {
      const data = await queryDb({ signal })
      signal.throwIfAborted()
      const shaped = shapeData(data)
      signal.throwIfAborted()
      return renderPdf(shaped)
    }

throwIfAborted turns the flag into a throw — specifically an AbortError carrying whatever reason the caller passed — at a moment of your choosing. In loops, check per iteration; for sources with handles, close them from an abort listener.

The deeper point worth volunteering: cooperative cancellation is a protocol, not plumbing. Every layer either honours the signal or silently breaks the contract, and nothing warns you which kind you wrote. That is why accepting a signal you will not check is worse than not accepting one.`,
    explanation: `Passing the whole controller is a category error the API prevents by shape: consumers receive the signal, the readable side. Even done somehow, it would not help — the failure is downstream of queryDb entirely.

Signals absolutely apply to operations begun after an abort — those see aborted immediately and throw at once. This scenario is the opposite failure: the abort landed fine and was subsequently ignored.

Dismissing signals as fetch-only inverts the design. Fetch is just the most prominent cooperator; anything you write can watch a signal, and throwIfAborted exists precisely so hand-written code can honour the same contract.`,
    hints: ['After queryDb resolves, who ever reads signal.aborted again?'],
    tags: ['abort', 'async', 'debugging'],
  },
  {
    id: 'cancellable-delay-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'You are writing delay(ms, signal), a cancellable sleep. Which implementation aborts correctly?',
    options: [
      'setTimeout that checks signal.aborted inside the callback and returns early if it flipped',
      'Wrap setTimeout in a promise, and reject from an abort listener registered on the signal, removing the listener and clearing the timer on settle',
      'Busy-wait in a loop comparing Date.now against the deadline, checking signal.aborted each iteration',
      'Race the timer against signal, using Promise.race([sleep, signal]) directly',
    ],
    correctOption: 1,
    answerInFull: `    function delay(ms, signal) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(signal.reason)
        const timer = setTimeout(resolve, ms)
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            reject(signal.reason)
          },
          { once: true },
        )
      })
    }

Four details carry the answer. Check upfront, because the signal may already be aborted — settling a promise that should have failed instantly hides the abort. Reject from the listener rather than resolving-with-a-flag: the caller's catch should see an AbortError, not a mysteriously short sleep. Clear the timer on abort, so a cancelled delay leaves nothing pending keeping the process alive. And register with once: true, so a long-lived signal does not accumulate dead listeners.

Then usage is ordinary try/catch, with AbortError as control flow:

    try {
      await delay(5000, signal)
    } catch (e) {
      if (e.name !== 'AbortError') throw e
    }

Volunteering the cleanup reasoning — timer cleared, listener removed — is usually what separates a strong answer from a working one.`,
    explanation: `Checking aborted inside the timer callback produces a resolve five seconds after cancellation was requested. Nothing happened sooner; the caller waited out the full delay for a result labelled cancelled.

Busy-waiting works and burns the exact resource cancellation exists to save. It also blocks the main thread, freezing everything else — the cure failing the disease.

Racing against a raw signal fails on types: a signal is not a promise, so race accepts it as a non-promise value and fulfils with the signal object itself almost immediately. Wrapping the signal's abort event in a promise — which is what the right answer does internally — is the actual technique, and naming it shows you know where the boundary lies.`,
    hints: [
      'What should the caller observe at the moment of abort?',
      'What is left behind if the delay is cancelled halfway?',
    ],
    tags: ['promise', 'abort', 'coding'],
  },
  {
    id: 'abort-reason-vs-aborterror-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this log?',
    code: `const ac = new AbortController()

delay(5000, ac.signal).catch((e) => {
  console.log(e.name, e.message)
})

ac.abort(new Error('shutdown'))

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const t = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}`,
    options: [
      'AbortError This operation was aborted',
      'Error shutdown',
      'undefined shutdown',
      'Nothing logs; the catch never runs',
    ],
    correctOption: 1,
    answerInFull: `Error shutdown

abort(reason) delivers your reason verbatim. The listener rejects the delay promise with signal.reason — the Error you passed — so the catch receives a plain Error whose message is "shutdown", not a DOMException named AbortError.

This is the distinction worth drawing in an interview. Without a reason, abort produces a standard AbortError, and code matches on e.name === 'AbortError' to recognise deliberate cancellation. With a reason, the reason replaces it, and callers can tell superseded from shut-down from timed-out by inspecting what arrived rather than by string-matching messages.

Practical consequence: if you rely on matching e.name, either do not pass reasons, or attach the name deliberately — abort(Object.assign(new Error('shutdown'), { name: 'ShutdownError' })) keeps both a precise type and a human message.`,
    explanation: `AbortError with the default message is what arrives when abort is called with no argument — the common case, and exactly why it tempts here. The reason parameter is the whole difference.

message without a name comes from reading the fields half-right; the logged pair is name then message, and the name printed is the Error constructor's.

The silent-catch option misreads timing. The abort happens before the timer, the listener fires synchronously, rejection is delivered, and the catch runs — order of registration does not matter, only that the handler exists.`,
    hints: ['Whose Error object does the catch actually receive?'],
    tags: ['abort', 'async', 'error'],
  },
  {
    id: 'cpu-bound-cancellation-limits',
    type: 'concept',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A tight numeric loop runs ten seconds on the main thread, driven by a function that accepted a signal. Why does aborting have no visible effect until it finishes?',
    options: [
      'Signals propagate only through promises, and a loop creates none',
      'The loop never yields the main thread, so nothing — including the abort event — gets a chance to run',
      'abort() queues a macrotask that fires only after the current stack unwinds, and the loop is that stack',
      'Numeric loops are optimised into web worker threads that ignore shared signals',
    ],
    correctOption: 1,
    answerInFull: `Cooperative cancellation needs cooperation, and a tight loop never cooperates. JavaScript runs your loop to completion; no other code — abort listeners, timers, even user input — executes until it returns. The flag flips the instant abort is called, but nobody is available to look at it.

The fix is giving the runtime breathing room so the check can actually happen:

    async function crunch(signal) {
      for (const chunk of chunks) {
        signal.throwIfAborted()
        process(chunk)
        await yieldToEventLoop() // setTimeout 0, or scheduler.yield
      }
    }

Each await ends the current run of synchronous code, letting pending events — including abort notifications — execute before the next chunk starts. Latency cost is tiny; responsiveness restored is total.

For genuinely heavy computation the honest answer moves the work off the thread entirely: a Web Worker or worker_threads, terminated outright, with the signal deciding when to terminate. Say that as the scaling path, because yielding a ten-second computation still costs ten seconds of someone's battery.`,
    explanation: `Promises are unrelated to the mechanism. Signals are observed properties plus events; the loop's problem is that it executes no code capable of observing anything.

The macrotask framing is close enough to sting. Abort listeners dispatch synchronously at abort time — but only on whatever stack is running, which belongs to whoever called abort, not to the loop. Either way the loop itself never pauses to notice.

Workers are real threads, which is why the third option half-appeals — but loops are not secretly parallelised, and workers do not share signal objects. Communication is by message, by design.`,
    hints: ['When does any other code get to run during a synchronous loop?'],
    tags: ['abort', 'async', 'event-loop'],
  },
  {
    id: 'combining-signals-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'Design cancellability for a multi-step operation — three API calls, local shaping between each — so it stops promptly when the user navigates away, times out, or both. What do you build, and what do you lean on the platform for?',
    answerInFull: `Lean on the platform first: every fetch takes a signal, so the API calls are covered by composition rather than custom code.

- One AbortController per operation instance, created at the start, aborted by whoever owns the lifecycle — the component or request context on navigation.
- Deadlines via AbortSignal.timeout(ms) rather than hand-rolled timer races, so the request itself is aborted, not merely abandoned.
- Both reasons at once via AbortSignal.any([userSignal, timeoutSignal]) — it aborts when either fires and passes through the first reason, which is what makes diagnostics truthful.
- Between the local steps — the shaping code that no platform API watches — insert signal.throwIfAborted(). Those checkpoints are the entire custom implementation; everything else is delegation.
- Sources with handles (streams, subscriptions, database cursors) get an abort listener that closes them, registered with once so long-lived signals stay clean.
- At the catch, match e.name === 'AbortError' and treat it as control flow: exit quietly, release resources, surface nothing. Every other error propagates untouched.

The story to tell: cancellation is cooperative, the platform cooperates through signals, and my job reduces to threading one signal everywhere and adding checks where the platform cannot see.`,
    explanation: `Interviewers push on two follow-ups. First, why not one timer race per step — because races abandon work instead of stopping it, and three abandoned connections leak worse than one. Second, what happens if a checkpoint is missed — the operation completes wasted work, silently, which is why accepting a signal you never read is worse than not accepting it.`,
    hints: [],
    tags: ['abort', 'async', 'design'],
  },
]
