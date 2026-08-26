import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-gets-collected-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What makes an object eligible for collection?',
    options: [
      'Nothing in the program can reach it by following references from a root',
      'The last variable that referred to it went out of scope',
      'The count of references to it reached zero',
      'Your code has finished with it, which the engine works out from how long it has been since the last access',
    ],
    correctOption: 0,
    answerInFull: `Unreachable from the roots. That is the whole definition, and everything else about memory in JavaScript follows from it.

The roots are the global object, every binding on the current call stack, and the references the host holds, which in a browser includes the document tree. The collector walks outward from those, marks everything it can reach, and frees the rest.

Two things follow immediately.

An object can be completely useless to you and still be alive, because something you forgot about still points at it. That is what a leak is in a garbage collected language: not a failure of the collector, but a reference the program is still holding.

And a group of objects can reference each other and still be collected, as long as nothing outside the group reaches in. Reference counting cannot do that; tracing from roots handles it without a special case.

Scope is the wrong frame for this. A local variable going out of scope usually makes its object unreachable, and it does not when a closure captured it, when it was pushed into a module-level array, or when a listener still holds it.`,
    explanation: `Going out of scope is the answer that is right often enough to be dangerous. Every leak in the topic is a case where the scope ended and the object stayed reachable through something else.

Reference counting is what several other runtimes do, and it is the one the engine specifically does not, because it cannot free cycles.

Nothing measures how long it has been since you touched an object. Recency is a cache eviction policy that you write, not something the collector applies.`,
    hints: [],
    tags: ['memory', 'gc'],
  },
  {
    id: 'cycles-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Two objects hold references to each other, and nothing else references either of them. What happens?',
    options: [
      'They leak, which is why cyclic structures need to be broken by hand before they go out of scope',
      'Both are collected, because the collector traces from roots and neither is on a path from one',
      'Both are collected, but only on a major collection, since a cycle cannot be handled by the young generation',
      'They leak until the next full collection, which detects cycles with a separate pass',
    ],
    correctOption: 1,
    answerInFull: `Both are collected, and no special handling is involved.

The collector starts at the roots and marks everything it can reach. A cycle that nothing outside it points at is never reached, so it is never marked, so it is swept along with everything else unmarked. The objects being connected to each other is irrelevant, because the question was never how many references point at them.

    let tree = { children: [] }
    tree.children.push({ parent: tree })
    tree = null // the pair is unreachable, and goes

This is the concrete reason the specification and the engines use tracing rather than reference counting. A count of references to each object in that pair is one, not zero, forever.

The folklore that says otherwise has a real origin. Old Internet Explorer kept DOM objects on a reference counted heap and JavaScript objects on a traced heap, and a reference from one to the other formed a cycle that neither collector could resolve. Detaching a node from its handler by hand was a genuine fix, in 2005.

The practical version to carry: cyclic data structures are fine. Doubly linked lists, parent pointers, observer registrations. What is not fine is a reference from something long-lived into something short-lived, which is a different problem entirely.`,
    explanation: `Breaking cycles by hand is real advice from a real era, and applying it now is cargo cult that clutters teardown code.

The generational detail sounds plausible and is backwards: the young collector copies out survivors and discards everything else in one go, so it disposes of unreachable cycles just as easily.

There is no separate cycle detection pass. Tracing never needed one.`,
    hints: ['What is the collector actually asking about each object?'],
    tags: ['memory', 'gc'],
  },
  {
    id: 'listener-identity-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const listeners = new Set()

function on(fn) {
  listeners.add(fn)
  console.log('added', listeners.size)
}

function off(fn) {
  console.log('removed', listeners.delete(fn))
}

const onResize = () => {}

on(onResize)
off(() => {})
off(onResize)
console.log('left', listeners.size)`,
    items: ['removed false', 'added 1', 'left 1', 'removed true', 'added 2', 'left 0'],
    correctOrder: [1, 0, 3, 5],
    answerInFull: `added 1, removed false, removed true, left 0.

The middle two lines are the point. Removing with a fresh arrow function fails, because the arrow written in the off call is a different function object from the one that was added. It looks identical and it is not the same value, so delete finds nothing and returns false. Passing the original reference works, and the Set empties.

This is exactly how removeEventListener behaves, and it is one of the four common leaks. A handler added to something long-lived, such as window or a shared emitter, with an inline arrow, can never be removed. Every mount adds another one, each holding whatever it closed over.

    const onResize = () => this.reflow()
    window.addEventListener('resize', onResize)
    window.removeEventListener('resize', onResize)

Name the function, or hand the listener an AbortController signal and abort it once to remove every listener registered with it.

The same identity rule is behind bind. A bound method is a new function each time, so adding this.handle.bind(this) and later removing this.handle.bind(this) removes nothing.`,
    explanation: `left 1 is in the pool because it is what prints if you believe the failed removal simply left the original in place. It did leave it in place, and the successful removal then took it out.

added 2 is there for a reading where the anonymous arrow gets added rather than removed.`,
    hints: ['Are the two arrow functions the same value?'],
    tags: ['memory', 'gc', 'debugging'],
  },
  {
    id: 'nulling-a-binding-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `let buffer = new Uint8Array(8)
const holder = { buffer }
buffer = null

console.log(holder.buffer === null, holder.buffer.length, buffer)`,
    options: [
      'false 8 null, because holder holds its own reference to the array and only the variable was cleared',
      'true 0 null, because assigning null to the variable clears every reference to that array',
      'false 0 null, because the array is freed but the property still points at the empty shell',
      'It throws, because holder.buffer is null and null has no length',
    ],
    correctOption: 0,
    answerInFull: `false 8 null.

Assignment writes to a binding. It does not reach into the object the binding used to refer to, and it does not touch any other reference to it. holder.buffer was copied out of the variable when the object literal was evaluated, and it is now the only thing keeping that array alive.

This is the whole truth behind setting things to null. It removes one reference. Whether that frees anything depends entirely on whether that reference was the last one, and you almost never know from the line you are looking at.

Where nulling genuinely helps is a long-lived binding: a module-level array of cached results, a field on an object that outlives the data it points at, a variable captured by a closure that will run for the rest of the process. Setting one of those to null is a real fix.

Where it does nothing is inside a function that is about to return. The frame is discarded on return, so its locals stop being roots anyway.

    function process(rows) {
      const parsed = expensive(rows)
      const result = summarise(parsed)
      // parsed = null here is noise; the frame is going away
      return result
    }`,
    explanation: `The idea that null clears the array itself is the misconception this question exists for, and it is common because the console shows the variable as null and people stop reading there.

There is no "freed but still there" state. An object is either reachable, in which case it is intact, or it is not, in which case nothing in the program can look at it.

Nothing throws: holder.buffer was never null.`,
    hints: ['What exactly does an assignment change?'],
    tags: ['memory', 'gc'],
  },
  {
    id: 'interval-not-cleared-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A dashboard opens and closes a chart panel all day. After a few hours the tab is using gigabytes, and a heap snapshot shows hundreds of chart instances. What is holding them?',
    code: `function mountChart(node, data) {
  const chart = new Chart(node, data)

  setInterval(() => chart.refresh(), 5000)

  return {
    destroy() {
      node.remove()
      chart.dispose()
    },
  }
}`,
    options: [
      'chart.dispose() runs before node.remove(), so the chart is torn down while still attached',
      'The interval is never cleared, and it holds a callback that closes over chart, so every panel ever opened is still reachable and still refreshing',
      'node.remove() detaches the node but leaves it referenced by the closure, which retains the chart through the DOM',
      'The returned object is never released, because destroy captures node and chart',
    ],
    correctOption: 1,
    answerInFull: `The interval. setInterval keeps its callback alive until something clears it, and that callback closes over chart, which holds the node, the data and everything the chart built.

    const timer = setInterval(() => chart.refresh(), 5000)
    return {
      destroy() {
        clearInterval(timer)
        chart.dispose()
        node.remove()
      },
    }

Two things about this leak make it worse than a plain unreleased object. Every abandoned chart is still running, so the CPU cost grows along with the memory, and each refresh may allocate. And the object is reachable from a genuine root, the timer registry, so nothing about it looks unusual in a snapshot until you read the retainer path.

The general rule is that anything you register has to be unregistered by the same code that owns it, and it is worth listing what that covers: setInterval and setTimeout, addEventListener, emitter.on, IntersectionObserver, MutationObserver, ResizeObserver, subscriptions, and any callback handed to something long-lived.

The version of this bug you cannot see at all is a setTimeout chain that reschedules itself, because there is no single id to clear. Guard those with a flag or an AbortSignal that the teardown flips.`,
    explanation: `The order of dispose and remove is worth getting right and neither order leaks. It changes what the dispose call can still see, not what stays reachable.

The third option describes a real leak, a detached node held by a closure, and it is not this one: the closure holding node here is inside the interval callback, which is the reference that matters, and it holds chart directly.

The returned object is released as soon as the caller drops it. Its captured variables go with it.`,
    hints: ['What is still running after destroy?'],
    tags: ['memory', 'gc', 'debugging'],
  },
  {
    id: 'detached-dom-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A snapshot of a long-lived page shows thousands of entries reading "Detached HTMLTableRowElement", growing every time the table is refreshed. The table itself is replaced wholesale each time. Where is the reference?',
    code: `const heights = new Map()

function render(rows) {
  table.innerHTML = ''
  for (const row of rows) {
    const tr = buildRow(row)
    heights.set(tr, tr.getBoundingClientRect().height)
    table.append(tr)
  }
}`,
    options: [
      'innerHTML = "" detaches the old rows without destroying them, and the engine keeps detached nodes until the next major collection',
      'buildRow leaves the previous rows referenced through their event handlers, which the new rows inherit',
      'The Map keyed by the row element holds every row ever rendered, and a strong key keeps the whole detached subtree alive',
      'getBoundingClientRect caches layout information against the node, which the browser retains',
    ],
    correctOption: 2,
    answerInFull: `The Map. Its keys are the row elements themselves, held strongly, so every row from every render is still reachable from a module-level collection.

Detaching a node from the document does not free it. It frees it only if nothing in JavaScript points at it, and here something does, permanently. It is worse than one node per entry, too: a node holds a reference to its parent and its children, so retaining one row retains the cells inside it and the detached fragment around it.

Two fixes, and the choice between them is the whole reason the next topic exists.

    const heights = new WeakMap()

A WeakMap holds its keys weakly, so an entry vanishes when the element does, with no bookkeeping. That is the right answer whenever the map is metadata about an object whose lifetime somebody else owns.

    heights.clear() // at the top of render, if a plain Map is required

Explicit eviction works too, and it is what you fall back on when you need to iterate the collection or read its size, which a WeakMap cannot do.

The tell in a snapshot is the word Detached in a class name. It means the node is not in the document and something is still holding it, and the retainer path names what.`,
    explanation: `Blaming innerHTML is the intuitive answer, and it is exactly backwards: emptying the parent is what makes the rows detached, and detached rows are collected fine when nothing holds them.

Handlers on the rows would keep the rows alive from the listener side, and here the handlers die with the rows. It is the direction of the reference that matters: something long-lived pointing at something short-lived.

getBoundingClientRect forces layout and caches nothing against the node.`,
    hints: ['What is still holding a reference after the rows leave the document?'],
    tags: ['memory', 'gc', 'dom'],
  },
  {
    id: 'closure-capture-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A function allocates a fifty megabyte buffer, reads one number out of it, and returns a small closure that logs only that number. The buffer stays in memory. There is also an unused closure in the same function that mentions the buffer. Why does that matter?',
    code: `function handler() {
  const buffer = new Uint8Array(50_000_000)
  const id = buffer[0]

  const rare = () => console.log(buffer.length)
  const often = () => console.log(id)

  return often
}`,
    options: [
      'The buffer is a typed array, which is allocated outside the JavaScript heap and freed only when the page unloads',
      'Every closure captures its entire enclosing scope, so a closure can never be smaller than the function it came from',
      'Closures created in the same scope share one environment record, and it holds every variable any of them refers to, so often retains buffer through the scope rare needed',
      'rare is still referenced by the function object itself, since a function keeps its inner declarations alive',
    ],
    correctOption: 2,
    answerInFull: `Because capture happens at the level of the scope, not the individual closure.

When a function contains inner functions, the engine builds one environment record for that scope, containing the variables any inner function refers to. Every closure created there points at that same record. often only reads id, but the record it points at also holds buffer, because rare mentions it.

    // often keeps the environment alive, and the environment keeps buffer alive
    often -> environment { id, buffer } -> 50 MB

Delete rare, and the environment no longer needs buffer, so the buffer goes when the function returns. That is a strange thing to have to say about dead code, and it is exactly what makes this leak hard to find: the reference is in a function nobody calls.

The general shape is a long-lived callback created next to short-lived data. An error handler defined beside a request body, a retry function beside a response, a subscription callback in the same scope as the payload that set it up.

The fix is to give the long-lived function a scope of its own, so it captures only what it needs.

    function makeOften(id) {
      return () => console.log(id)
    }

Engines do optimise the common cases here, and the details differ between them and between optimisation tiers, so the honest version is that you cannot rely on the buffer being dropped. Structure the scope so the question does not arise.`,
    explanation: `The idea that a closure captures its whole enclosing scope is the old, simpler model, and it over-predicts: variables no inner function mentions are not kept.

Typed array backing stores are managed by the collector like everything else. They live outside the ordinary heap in the sense that they are not garbage collected object storage, and they are freed when the typed array is.

A function object does not retain its inner function declarations. Only a closure that was created and is still referenced retains anything.`,
    hints: ['How many environment records does that function body have?'],
    tags: ['memory', 'gc', 'closures'],
  },
  {
    id: 'bounding-a-cache-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A server memoises an expensive computation in a module-level Map keyed by a request id string. It is fast, and memory grows all day. Which change fixes it?',
    options: [
      'Switch the Map to a WeakMap, so entries go when the keys are collected',
      'Give the Map a maximum size and evict the least recently used entry when it is exceeded',
      'Delete the entry at the end of each request, so the cache holds only what is in flight',
      'Call the computation through a setTimeout, so the entry is released once the stack unwinds',
    ],
    correctOption: 1,
    answerInFull: `Bound it by size, and evict.

An unbounded cache is not a cache, it is a leak with a hit rate. The smallest fix that keeps the benefit is a maximum size with a least-recently-used eviction, and a Map makes that unusually easy because it iterates in insertion order.

    const MAX = 1000
    const cache = new Map()

    function memo(key, compute) {
      if (cache.has(key)) {
        const hit = cache.get(key)
        cache.delete(key)
        cache.set(key, hit) // re-inserting moves it to the newest position
        return hit
      }
      const value = compute()
      cache.set(key, value)
      if (cache.size > MAX) cache.delete(cache.keys().next().value)
      return value
    }

The delete-then-set is the whole LRU trick: insertion order is the recency order, so the oldest key is always the first one the iterator gives you.

The alternative bound is time, and it is right when the risk is staleness rather than size. The third bound, the lifetime of the key, needs the key to be an object, which a request id string is not, and that is the reason a WeakMap does not apply here.

Whatever the bound, the number to expose is the hit rate. A cache with a bound that nobody measures is a guess, and an eviction rate near a hundred percent means you are paying to store things you never read again.`,
    explanation: `A WeakMap is the right instinct and the wrong tool: its keys must be objects, and strings are not eligible. Even if they were, two equal strings are the same value, so there would be nothing to collect.

Deleting at the end of each request empties the cache constantly, which removes the leak by removing the caching. If the same key really is only used within one request, a plain object on the request would be simpler and would say so.

setTimeout changes when the computation runs and nothing about what the Map holds.`,
    hints: ['What separates a cache from a leak?'],
    tags: ['memory', 'gc', 'coding'],
  },
  {
    id: 'sawtooth-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A Node service is restarted nightly because it dies after about thirty hours. Its memory chart rises and falls constantly, with peaks near the limit. What tells you whether this is a leak, and what do you do next?',
    options: [
      'The peaks: if they reach the heap limit the process is leaking, and the fix is to raise --max-old-space-size',
      'The floors: if the low point after each collection keeps rising, memory is not being released, and the next step is two heap snapshots around the same repeated operation, compared',
      'The frequency: collections getting more frequent is the definition of a leak, and the next step is to call global.gc on a timer',
      'Neither, until you can reproduce it locally, since heap graphs from production are not diagnostic',
    ],
    correctOption: 1,
    answerInFull: `Read the floor, not the ceiling.

A healthy process allocates, gets collected, allocates again. That is the sawtooth, and its peaks can be close to the limit while nothing is wrong: peaks tell you how much garbage the workload makes, and a collector under no pressure lets the heap grow before bothering. What tells you about a leak is where memory sits after each collection. If that baseline rises hour after hour, something is retained.

The next step is a comparison rather than a hunt. Take a snapshot, run the suspect operation many times, take a second, and compare the two, looking for objects allocated between them that are still alive. Then read the retainer path on one of those objects, which is the chain of references from a root, and the leak is on it.

    const { writeHeapSnapshot } = require('node:v8')
    writeHeapSnapshot('/tmp/before.heapsnapshot')

The cheap version, for when attaching a debugger is not possible, is logging process dot memoryUsage dot heapUsed after each batch. A number that grows monotonically across batches is the same signal at lower resolution.

Raising the heap limit is the right thing to do exactly once: as a stopgap that buys time while you find the retainer. Left in place, it makes a thirty hour cycle into a sixty hour cycle.`,
    explanation: `Peaks near the limit look alarming and are often just a collector that has not been asked to work hard yet. Growing the limit changes the schedule and not the retention.

Collections getting more frequent is a symptom that comes with several causes, including a workload that simply allocates more. And forcing collection on a timer is a way to make a leaking program slower, since nothing about a reachable object changes when you ask.

Waiting for a local reproduction throws away the one measurement you already have. The graph is where the question gets answered; the reproduction is how the answer gets confirmed.`,
    hints: ['Which part of a sawtooth carries the information?'],
    tags: ['memory', 'gc', 'scenario'],
  },
  {
    id: 'gc-timing-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What can a program rely on about when garbage collection happens?',
    options: [
      'That it runs between turns of the event loop, so nothing is collected in the middle of a function',
      'That an object with no remaining references is collected before the next allocation, which is what makes memory predictable',
      'Nothing. Collection timing is unspecified and unobservable from ordinary code, which is deliberate',
      'That objects are collected in the order they became unreachable, oldest first',
    ],
    correctOption: 2,
    answerInFull: `Nothing at all, and that is a design decision rather than an omission.

There is no way to request a collection from ordinary code, no way to be told one happened, and no guarantee about when an unreachable object is freed, or that it ever is. An engine is allowed to never collect anything, and one that ran out of memory instead would still be a conforming implementation.

The reason is that observable collection timing would make programs behave differently on different engines, and would make behaviour depend on something completely outside the program's control. The one feature that does expose it, FinalizationRegistry, comes with an explicit warning in the specification that correct programs should not depend on its callbacks running.

Two practical consequences.

Do not write cleanup that depends on collection: close the file, release the lock, unsubscribe the listener, all explicitly, in code that runs.

Do not measure memory by asking for a collection first. Node's global.gc behind --expose-gc, and the collect button in DevTools, exist for debugging, and code that calls them is code that will behave differently in production.

The generational behaviour is worth knowing as background, but it is not a guarantee either: young objects are collected sooner because most objects die young, and nothing promises that about any particular object.`,
    explanation: `Collecting between turns of the loop is a reasonable guess and is roughly when a lot of collection happens. Engines also collect concurrently, on other threads, while your code runs, and neither is something to rely on.

Immediate collection when the last reference goes is reference counting semantics, which is what Python approximates and JavaScript does not.

There is no ordering. A tracing collector does not know when anything became unreachable, only what it cannot reach right now.`,
    hints: ['Why would exposing this be a problem for the language?'],
    tags: ['memory', 'gc'],
  },
  {
    id: 'finding-a-leak-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'What is a memory leak in a language with a garbage collector, and how would you go about finding one in an application you did not write?',
    answerInFull: `- The definition first: an object that is still reachable from a root and that the program has no further use for. The collector is working correctly. The bug is a reference nobody remembers holding, so the fix is always to find the reference rather than to make the collector try harder.
- Then that reachability, not scope, is what decides. An object survives a function returning if a closure captured it, if it was pushed into a module-level collection, or if a listener still holds it.
- Before touching the code I would confirm it is a leak. On a memory chart that means the floor after each collection rising over time, not the peaks. In Node, heapUsed after each batch of work, growing monotonically.
- Then reproduce it as a repeated interaction: open and close the panel, run the request, mount and unmount the component, twenty times. Snapshot, repeat, snapshot again, and compare the two for objects allocated in between that are still alive. Read the retainer path on one of them; the reference is on it, and it is usually somewhere I would not have guessed.
- The shapes I check first, because they cover most real cases. A collection that only grows, which is the commonest on a server. A timer or listener never removed, remembering that removeEventListener needs the same function reference. Detached DOM held from JavaScript, which shows up in a snapshot with Detached in the class name. And a closure capturing more than it needs, because closures made in one scope share one environment.
- The fixes, in the order I would prefer them: unregister what was registered, in the teardown that owns it. Bound the cache, by size with LRU eviction or by age. Hold the key weakly with a WeakMap when the entry is metadata about an object somebody else owns.
- What I would not do is add nulling everywhere, or call a forced collection. The first is noise unless the binding being cleared is genuinely long-lived; the second changes nothing about a reachable object.

The thing I would say unprompted: I would leave behind the repeated-interaction script that reproduced it. Leaks come back, and the only cheap way to notice is to be able to run the same thing again and watch the floor.`,
    explanation: `What is being assessed is whether the answer starts from reachability. Someone who defines a leak as "memory that is not freed" has not said anything the collector could act on, and their debugging tends to be guesswork in the source.

The two details that read as experience: reading the floor of the sawtooth rather than the peak, and comparing two snapshots around a repeated interaction instead of staring at one. Naming the four shapes is what turns it from a method into an answer.`,
    hints: [],
    tags: ['memory', 'gc', 'design'],
  },
]
