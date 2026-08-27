import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'which-one-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A scroll position indicator updates from a scroll handler, and a search box fires a request from an input handler. Which rate limiter belongs on each?',
    options: [
      'Throttle the scroll handler and debounce the search box',
      'Debounce both, since in each case only the final value matters',
      'Debounce the scroll handler and throttle the search box',
      'Throttle both, since both are driven by a continuous stream of events',
    ],
    correctOption: 0,
    answerInFull: `Throttle the scroll, debounce the search, and the deciding question is whether you want regular runs or only the last one.

The search box wants the last one. Every intermediate query is work whose result nobody will look at, and the user only cares about what they finished typing. Debounce waits for the typing to stop and then makes one request. Around 300 milliseconds is the usual number: long enough to skip the intermediate queries, short enough that it does not feel laggy.

The scroll indicator wants regular ones. Its whole job is to keep up with a value that is changing right now, and a debounced version updates only when the user stops scrolling, which is the one moment the indicator does not need to change. Throttle runs at most once per interval and keeps updating throughout.

The way to remember it: debounce answers "tell me when they have finished", throttle answers "tell me, but not this often".

For anything that draws, there is a better throttle than a timer. requestAnimationFrame runs the callback at most once per frame, which is exactly as often as the screen can show the change, and it stops while the tab is hidden.`,
    explanation: `Debouncing both is the common instinct, because debounce is the one everybody learns first. Applied to the scroll handler it produces an indicator that is wrong for as long as the user keeps scrolling, which is the entire time it matters.

Throttling the search box is not catastrophic and it is wasteful: it fires a request every interval while the user types, and the answers to all but the last are thrown away.`,
    hints: ['For each one, ask whether the intermediate values are worth acting on.'],
    tags: ['timers', 'design'],
  },
  {
    id: 'debounce-order-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function debounce(fn, wait) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), wait)
  }
}

const save = debounce((label) => console.log('save', label), 50)

console.log('typed a')
save('a')
console.log('typed b')
save('b')

setTimeout(() => console.log('timer 0'), 0)
Promise.resolve().then(() => console.log('microtask'))`,
    items: ['microtask', 'typed a', 'save a', 'typed b', 'timer 0', 'save b', 'save undefined'],
    correctOrder: [1, 3, 0, 4, 5],
    answerInFull: `typed a, typed b, microtask, timer 0, save b.

Three separate rules stacked on one example.

The two console.log calls in the main script run first, because everything synchronous finishes before anything queued runs at all. Calling save schedules a timer and returns immediately; it never runs the function itself.

Then the microtask, because the microtask queue drains completely as soon as the synchronous run finishes, before any timer callback is considered. This is the ordering rule from the event loop topic, and debounce inherits it: a debounced call is always at least a task away.

Then the two timers in delay order, 0 before 50.

And save prints once, with b. The second call to save cleared the timer the first one scheduled, so the a call never happened. That is the mechanism: each call cancels the pending one, and the arguments of the last call are the ones that run.

The practical version of the last point: a debounced function does not queue up work. It replaces it.`,
    explanation: `save a is in the pool for the reading where both calls fire, which is what a throttle with a trailing call would do and what debounce specifically does not.

save undefined is there for the misreading where the timer callback loses the arguments of the call that scheduled it. Capturing args per call is the reason it does not.`,
    hints: ['What does the second call do to the first call timer?'],
    tags: ['timers', 'event-loop'],
  },
  {
    id: 'debounced-return-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print, and why?',
    code: `const price = debounce((qty) => qty * 10, 100)

console.log(price(3))`,
    options: [
      '30, because the debounced function forwards the return value of the call it wraps',
      'undefined, because the wrapper only schedules a timer, and the real call has not happened yet',
      'A Promise, which resolves to 30 after 100ms',
      'undefined immediately, and then 30 is printed again after 100ms',
    ],
    correctOption: 1,
    answerInFull: `undefined. The wrapper schedules a timer and returns; the wrapped function runs a hundred milliseconds later, in a different turn, with nobody left to return a value to.

This is the structural limitation of debouncing rather than an oversight in the implementation. The caller wants an answer now and the whole point of debouncing was to not compute one now.

There are two honest ways round it, and which one is right depends on the caller.

Return a promise, resolved when the call finally happens:

    function debounceAsync(fn, wait) {
      let timer
      let pending
      return function (...args) {
        clearTimeout(timer)
        pending ??= Promise.withResolvers()
        timer = setTimeout(() => {
          const resolve = pending.resolve
          pending = undefined
          resolve(fn.apply(this, args))
        }, wait)
        return pending.promise
      }
    }

Note what that does to the calls that got cancelled: they share the promise of the run that eventually happens, so every caller in the burst sees the same result. The alternative, rejecting the superseded ones, means every caller has to handle a cancellation error, which is usually worse.

Or push the result somewhere instead of returning it, which is what most debounced code does: set state, update the DOM, dispatch an action.`,
    explanation: `Expecting the value forwarded is the assumption that the wrapper calls through. It does not: it schedules.

A promise is what a good implementation returns, and only because it was written to. The ten-line version returns nothing.

Nothing prints twice. The timer callback computes 30 and discards it, since no code is looking at its return value.`,
    hints: ['When does the wrapped function actually run, relative to the console.log?'],
    tags: ['timers', 'closures'],
  },
  {
    id: 'created-per-call-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Every keystroke still fires a request. Why is this not debounced?',
    code: `input.addEventListener('input', (event) => {
  const search = debounce((query) => fetchResults(query), 300)
  search(event.target.value)
})`,
    options: [
      'The handler is an arrow function, so this is wrong inside the debounced call',
      'debounce is called on every input event, so each keystroke gets a fresh closure with its own timer and nothing ever cancels anything',
      'The wait is too short to cover the gap between keystrokes',
      'event.target.value is read before the debounce, so the argument is captured too early',
    ],
    correctOption: 1,
    answerInFull: `Because a debounced function is only useful if it is the same function every time.

All of the state debounce has is the timer id in its closure. Calling debounce creates a new closure with a new, empty timer variable. Doing that inside the handler means each keystroke builds its own debounced function, calls it once, and drops it. Every one of them schedules a timer that nothing will ever clear, so every keystroke fires its request 300ms later.

    const search = debounce((query) => fetchResults(query), 300)
    input.addEventListener('input', (event) => search(event.target.value))

Create it once, outside, and call the same one.

This is the single commonest way to get debounce wrong, and it looks different in every framework while being the same mistake. In a component that re-renders, defining the debounced function in the render body creates a new one per render, and a debounce that is recreated between calls has no memory of the call before. The framework answers are a ref, a memo keyed on nothing, or a module-level function, and they all amount to the same thing: one closure for the lifetime of the component.

The tell when reviewing: look for where the debounced function is created, and ask whether it is created more often than it is called.`,
    explanation: `The arrow function is fine. this is not used anywhere in this handler.

The wait is not the problem: even a five second wait would fire every request five seconds after its keystroke.

Reading the value early is correct and deliberate. The event object is pooled or stale by the time the timer fires, so capturing the value now is the right thing to do.`,
    hints: ['How many debounced functions does this code create?'],
    tags: ['timers', 'closures', 'debugging'],
  },
  {
    id: 'lost-this-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This debounce works for plain functions and throws "Cannot read properties of undefined" when used on a method. What is wrong with it?',
    code: `function debounce(fn, wait) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

const form = {
  dirty: true,
  save: debounce(function () {
    console.log(this.dirty)
  }, 200),
}

form.save()`,
    options: [
      'debounce needs to be called with form as an argument so it knows what to bind to',
      'setTimeout always calls its callback with this set to undefined, so no implementation can preserve a receiver',
      'The wrapped function should have been an arrow function, which would take this from the object literal',
      'The wrapper is an arrow function, so it has no this of its own to forward, and the call inside drops the receiver anyway',
    ],
    correctOption: 3,
    answerInFull: `Two problems, and the arrow wrapper is the one that makes the other unfixable.

form.save() calls the wrapper as a method, so this should be form. An arrow function has no this of its own: it uses the one from where it was defined, which is module scope, so the receiver is lost at the door. Then fn(...args) calls the wrapped function as a plain function, discarding any receiver there might have been.

    function debounce(fn, wait) {
      let timer
      return function (...args) {
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), wait)
      }
    }

The fixed version uses both function kinds deliberately, and that combination is the thing to be able to explain.

The returned wrapper is a normal function, so calling it as form.save() sets its this to form.

The timer callback is an arrow, so it does not get its own this and takes the wrapper's, which is form. Had it been a normal function, setTimeout would have called it with this as undefined in a module, or the global object in a script.

So the arrow is right in one position and wrong in the other, for the same reason: arrows inherit this instead of receiving it.`,
    explanation: `setTimeout does call its callback with no meaningful receiver, and that is exactly why the arrow inside works: it never asks setTimeout for one.

Making the wrapped function an arrow moves the problem rather than solving it. An arrow defined in the object literal takes this from module scope, not from the object, which is the classic object-literal arrow mistake.

Passing the object in would work and would mean writing a different utility for every receiver. apply exists for this.`,
    hints: [
      'Which of the two functions in the implementation should be an arrow, and which should not?',
    ],
    tags: ['timers', 'this', 'debugging'],
  },
  {
    id: 'throttle-implementation-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You need a throttle that fires immediately on the first call and never drops the final event of a burst. Which implementation does both?',
    options: [
      'Set a boolean when the function runs and clear it with a setTimeout after the interval, ignoring every call while it is set',
      'Track the time of the last run. If the interval has passed, run now. Otherwise, if nothing is scheduled, schedule one run for the end of the window with the newest arguments',
      'Schedule a setTimeout on the first call and ignore calls until it fires, then run with the arguments of the last one',
      'Wrap the function in a debounce with the same interval, which gives one run per burst and no more',
    ],
    correctOption: 1,
    answerInFull: `The timestamp plus a single scheduled trailing call.

    function throttle(fn, interval) {
      let last = 0
      let timer

      return function (...args) {
        const remaining = interval - (Date.now() - last)

        if (remaining <= 0) {
          last = Date.now()
          fn.apply(this, args)
          return
        }

        if (timer === undefined) {
          timer = setTimeout(() => {
            last = Date.now()
            timer = undefined
            fn.apply(this, args)
          }, remaining)
        }
      }
    }

Each half does one job. The timestamp branch is the leading edge: the first call of a burst runs at once, which is what makes a throttled scroll handler feel responsive rather than stuck. The scheduled branch is the trailing edge: whatever arrives during the window is not lost, because one run is booked for the end of it.

The one subtlety worth noticing is which arguments the trailing call uses. In the version above it is the arguments of the call that scheduled it, and a fuller implementation keeps overwriting a variable so the newest ones win, which is what you want for a position or a size.

Real libraries make both edges optional, because sometimes you want only one. Leading with no trailing for a fire-once-immediately button guard, trailing with no leading when the first value is meaningless.`,
    explanation: `The boolean flag version is the throttle everyone writes first. It has a leading edge and no trailing one, so the last event of every burst is dropped and the indicator freezes wherever it happened to be mid-window.

Scheduling on the first call and running at the end is the trailing-only shape. It works and it delays the first update by a whole interval, which reads as lag.

A debounce is a different behaviour, not a variation on this one: nothing runs at all while the events keep coming.`,
    hints: [
      'Which part of each implementation handles the first call, and which handles the last?',
    ],
    tags: ['timers', 'coding'],
  },
  {
    id: 'cancel-on-teardown-coding',
    type: 'coding',
    form: 'choice',
    tier: 'senior',
    prompt:
      'An editor autosaves with a debounced function on a 2 second wait. Closing the editor while a save is pending occasionally writes over a document the user has since opened elsewhere. What do you add?',
    options: [
      'A check inside the save that the editor is still open, returning early if it is not',
      'A shorter wait, so the window in which this can happen is smaller',
      'A cancel method on the debounced function, called from the teardown, and a flush for the case where the pending save should still happen',
      'An await on the debounced call before closing, so any pending work completes first',
    ],
    correctOption: 2,
    answerInFull: `Give the debounced function a cancel, and call it where the editor is torn down.

    function debounce(fn, wait) {
      let timer
      function debounced(...args) {
        clearTimeout(timer)
        timer = setTimeout(() => fn.apply(this, args), wait)
      }
      debounced.cancel = () => {
        clearTimeout(timer)
        timer = undefined
      }
      return debounced
    }

    // teardown
    autosave.cancel()

Then decide deliberately which behaviour the product wants, because the two are different features. cancel throws away the pending save, which is right when leaving the editor means abandoning the edit. flush, which runs the pending call immediately rather than at the end of the wait, is right when leaving should commit what was typed. Offering both and picking at the call site is what the libraries do.

There is a second reason to cancel that has nothing to do with correctness. A pending timer holds its callback, and the callback holds the arguments and everything the closure captured, so an uncancelled debounce on a component that is being destroyed keeps that component alive until the timer fires. That is the timer shape of a memory leak.

The rule that covers both: anything you schedule is something you own, and owning it means being able to stop it.`,
    explanation: `A shorter wait narrows the window and does not close it, and it defeats the debounce by firing more often.

A guard inside the save is a real defensive measure and it is the wrong layer. The pending timer still exists, still holds the closure, and now every debounced function needs to know about editor lifecycles.

Awaiting does not work, because the debounced function returns undefined. Even a promise-returning version would resolve only after the full wait, which turns closing the editor into a two second pause.`,
    hints: ['What still exists after the editor is gone?'],
    tags: ['timers', 'coding', 'memory'],
  },
  {
    id: 'stale-response-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A search box debounces at 300ms and still shows results for an older query. The user types "rea", pauses, then types "ct" and pauses again. What is happening, and what fixes it?',
    options: [
      'The debounce wait is too short for the pause the user made, so raising it to a second fixes it',
      'Two requests are in flight, and the first can resolve last, so the fix is to cancel the previous request or to ignore any response that is not for the newest query',
      'The debounced function is being recreated, so its timer never cancels',
      'The input event fires after the value has already changed, so the query captured is always one keystroke behind',
    ],
    correctOption: 1,
    answerInFull: `Debouncing limits how often you start a request. It says nothing about the order the answers come back in.

Two pauses means two requests: one for "rea" and one for "react". If the first is slower, its response arrives second and overwrites the newer results. Nothing about the debounce is broken; it is doing exactly its job, and the race is a separate problem that debouncing is often mistaken for a fix to.

Two fixes, and they compose.

Cancel the previous request when a new one starts:

    let controller
    async function search(query) {
      controller?.abort()
      controller = new AbortController()
      const results = await fetch(url(query), { signal: controller.signal })
      render(await results.json())
    }

Or ignore stale answers, which works even when the request cannot be cancelled:

    let latest = 0
    async function search(query) {
      const id = ++latest
      const results = await fetchResults(query)
      if (id === latest) render(results)
    }

Cancelling is better when it is available, because it also stops the work on the server and frees the connection. The sequence check is the fallback and the belt-and-braces addition, since aborting is not instantaneous.

The general lesson is worth stating on its own: any time a stream of user actions triggers async work, ask what happens when the answers come back out of order. It is the same bug in autocomplete, in tab switching, and in paginated tables.`,
    explanation: `A longer wait makes the race less likely and no less possible, and it makes the box feel slow. Timing changes are not fixes for ordering problems.

Recreating the debounced function is a real bug with a different symptom: every keystroke fires, rather than two pauses producing two requests.

Input events carry the current value. The query is not one behind.`,
    hints: ['How many requests are in flight, and what guarantees their order?'],
    tags: ['timers', 'async', 'scenario'],
  },
  {
    id: 'timer-promises-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does setTimeout(fn, 100) actually guarantee?',
    options: [
      'That fn runs 100ms later, give or take a millisecond of scheduling noise',
      'That fn runs no earlier than 100ms later, and after the current synchronous run and every queued microtask',
      'That fn runs 100ms later unless the tab is hidden, in which case it is skipped entirely',
      'That fn runs after 100ms of processing time, excluding time spent blocked',
    ],
    correctOption: 1,
    answerInFull: `A floor, not a schedule. The callback becomes eligible after the delay, and then it waits its turn.

Three things can push it later, and all three come up in interviews.

The current synchronous run has to finish. A long loop delays every timer behind it, which is why a hundred milliseconds of blocking work makes every animation stutter.

The microtask queue drains first. Timer callbacks are tasks, and tasks run only when the microtask queue is empty, so a promise chain that keeps queueing more microtasks can hold a zero-millisecond timer off indefinitely.

Nested timers are clamped. After five levels of nesting, browsers force a minimum of about four milliseconds, so a setTimeout zero loop is really a four millisecond loop.

And background tabs throttle timers hard, to roughly once a second and less for pages hidden a long time. They are not skipped, they are slowed, which matters for anything that assumes a steady tick while the user is elsewhere.

The practical consequences: never use a timer as a clock, compare timestamps instead. Use requestAnimationFrame for anything visual, since it is aligned with painting and pauses when hidden. And for repeating work of uncertain duration, reschedule a setTimeout at the end of each run rather than using setInterval, whose callbacks bunch up when the work takes longer than the interval.`,
    explanation: `A millisecond of noise is the mental model that holds until the page is busy, which is exactly when timing starts to matter.

Hidden tabs slow timers rather than dropping them. Code that assumed callbacks were skipped would be wrong in the other direction, and would miss a backlog when the tab returns.

Nothing about the delay excludes blocked time. It is wall clock, measured from when the timer was set.`,
    hints: ['What has to happen before a task callback can run at all?'],
    tags: ['timers', 'event-loop'],
  },
  {
    id: 'leading-edge-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does the leading edge option on a debounce change?',
    options: [
      'The function runs on the first call and then suppresses further calls until the quiet period has passed',
      'The function runs slightly earlier, at the start of the last wait rather than the end',
      'The wait is measured from the first call in a burst instead of being reset by each call, so it fires once per burst at a predictable time',
      'The arguments of the first call are used instead of the arguments of the last one',
    ],
    correctOption: 0,
    answerInFull: `Leading edge means it fires immediately on the first call of a burst, and then nothing more until the calls have stopped for the wait period.

Trailing edge, which is the default, means the opposite: nothing on the first call, and one run once the calls have stopped.

    // leading: submit now, ignore the double-click
    const submit = debounce(send, 1000, { leading: true, trailing: false })

    // trailing: search only once they stop typing
    const search = debounce(query, 300)

The example above is the case leading exists for. A submit button wants the first click to do something instantly and the accidental second click to be swallowed. A trailing debounce on the same button waits a second before doing anything, which feels broken and which users respond to by clicking again.

Enabling both edges gives a run at the start and another at the end, and it is the option people enable by accident. For a single click that means the handler runs twice, which is the exact bug the debounce was added to prevent.

Worth separating this from throttle, since a leading-edge debounce with no trailing call and a throttle look similar for one burst. They differ over a long one: the throttle keeps firing every interval while the calls continue, and the debounce fires once at the start and stays silent until the quiet period.`,
    explanation: `The idea that it just fires earlier is the reading of the name that does not survive the details. It changes which call runs, not how long the wait is.

Measuring the wait from the first call, without resetting, describes a different utility sometimes called a rate limiter or a batch window. It is a legitimate thing to want, and it is not what leading means.

Arguments follow the call that actually runs. With a leading edge that is the first call, and that is a consequence rather than the definition.`,
    hints: ['Which call in the burst actually runs?'],
    tags: ['timers', 'design'],
  },
  {
    id: 'write-debounce-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Implement debounce, and tell me what a production version has to handle that a ten-line one does not.',
    answerInFull: `- The core is a closure over a timer id. The returned wrapper clears the pending timer and schedules a new one, so only the last call in a burst survives.
- I would write the wrapper as a normal function and the timer callback as an arrow, and say why while writing it: the normal function receives this when the debounced function is called as a method, and the arrow inherits it rather than being handed undefined by setTimeout. Then fn.apply(this, args) forwards both.
- Arguments are captured per call, so the run uses the arguments of the last call. That is what makes a debounced search correct rather than just cheaper.
- Then what a real one adds. A cancel, because a pending timer runs against something that may be gone, and it holds that thing alive until it does. A flush, for the case where teardown should commit rather than discard.
- A return value, which the simple version cannot give: the wrapper returns undefined because the call has not happened. The fix is to return a promise resolved when it eventually runs, and to have the superseded callers share that promise rather than reject them all.
- Leading and trailing edge options. Trailing is the default and the one people mean; leading is for a submit button, where the first click should act and the second should be swallowed. Enabling both by accident makes a single click run the handler twice.
- Then what debouncing does not do, unprompted, because it is the follow-up. It does not order the responses. A user who pauses twice has two requests in flight, and the older one can land last, so the request needs an AbortController or a sequence check on the response.
- And the timer caveats: the wait is a floor rather than a schedule, timers wait behind microtasks, nested ones clamp to about four milliseconds, and background tabs throttle to about a second.
- The mistake I would flag in review is creating the debounced function per call or per render. All its state is that one closure, so a fresh one every time debounces nothing.

If asked to choose between debounce and throttle for something, I would answer with the question rather than the rule: do you want the last one, or regular ones.`,
    explanation: `Writing the ten lines is the easy half and most candidates get there. The signal is in what comes after: this and arguments, cancel, the missing return value, and the two edges.

The two things that read as production experience are naming the pending timer as a leak and a stale write, and volunteering that debouncing does not fix out-of-order responses. Both are bugs people only know about because they have shipped one.`,
    hints: [],
    tags: ['timers', 'closures', 'design'],
  },
]
