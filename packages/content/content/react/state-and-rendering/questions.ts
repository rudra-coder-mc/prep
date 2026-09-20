import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'immediate-state-log-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is printed to the console when the user clicks this button for the very first time?',
    code: `function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
    console.log(count)
  }

  return <button onClick={handleClick}>{count}</button>
}`,
    options: ['0', '1', 'undefined', 'NaN'],
    correctOption: 0,
    answerInFull: `The console prints 0.

State in React is a snapshot. When the Counter component rendered initially, the count variable was assigned 0 for that render scope.

Calling setCount(count + 1) requests a future re-render with count set to 1, but it does not mutate the local count variable in the currently running handleClick function. The console.log statement reads the snapshot value (0).`,
    explanation: `The value 1 will only be visible in the next render pass when Counter() is invoked again by React.

count is initialized to 0, so it is neither undefined nor NaN.`,
    hints: ['Does calling a state setter mutate the current variable in place immediately?'],
    tags: ['react', 'usestate', 'snapshot'],
  },
  {
    id: 'multiple-setstate-calls-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What will the count on the screen be after the user clicks the button once?',
    code: `function Counter() {
  const [count, setCount] = useState(0)

  function handleTriple() {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
  }

  return <button onClick={handleTriple}>+3</button>
}`,
    options: ['1', '3', '0', '2'],
    correctOption: 0,
    answerInFull: `The count becomes 1, not 3.

Because count is a snapshot holding the value 0 during this render, handleTriple evaluates to:

    setCount(0 + 1)
    setCount(0 + 1)
    setCount(0 + 1)

Each call requests React to set count to 1 for the next render. React batches these requests and re-renders with count = 1.

To increment three times in one event handler, use updater functions:

    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)`,
    explanation: `Because each call passes a raw value calculated from count = 0, each call replaces the previous request with the same target value (1).`,
    hints: ['What value does the variable count hold during each of the three setter calls?'],
    tags: ['react', 'usestate', 'batching'],
  },
  {
    id: 'updater-function-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does passing an updater function like setCount(prev => prev + 1) successfully chain multiple updates while passing setCount(count + 1) does not?',
    options: [
      'Updater functions are queued by React and each receives the pending state computed by the prior update',
      'Updater functions bypass React batching and synchronously mutate the browser DOM',
      'Updater functions run in a separate Web Worker thread that has access to shared memory',
      'Updater syntax converts the state variable into a mutable JavaScript ref object',
    ],
    correctOption: 0,
    answerInFull: `React processes updater functions in a queue during the next render.

When you pass an updater function, React saves it in a pending update queue. During the subsequent render pass, React iterates through the queue:

1. It takes the previous state (or initial state).
2. It passes that pending state to the first updater function.
3. The returned result becomes the input to the next updater function in line.

This guarantees that each calculation receives the most up-to-date intermediate state.`,
    explanation: `Updater functions do not bypass batching or mutate DOM directly.

React runs entirely on the main JavaScript thread, not Web Workers.

State remains immutable; it is not converted to a ref.`,
    hints: ['How does React know what the intermediate result of the previous update was?'],
    tags: ['react', 'updater-function', 'queue'],
  },
  {
    id: 'automatic-batching-react18-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How does React 18+ handle multiple setState calls triggered inside a Promise or setTimeout callback?',
    options: [
      'It automatically batches them into a single re-render after the callback finishes',
      'It triggers a separate synchronous re-render for each individual setter call',
      'It drops all updates except the last one',
      'It throws a runtime warning unless the code is wrapped in flushSync',
    ],
    correctOption: 0,
    answerInFull: `React 18 introduced universal Automatic Batching.

In React 17 and earlier, React only batched updates triggered within native React event handlers (like onClick). Updates inside setTimeout, Promises, or native DOM listeners triggered separate re-renders for each state change.

In React 18+, all updates are automatically batched into a single re-render regardless of where they originate, preventing partial renders and improving performance.`,
    explanation: `React 18 batches async updates automatically; it does not render each setter synchronously.

No updates are dropped.

flushSync is an opt-out mechanism to force immediate rendering, not a mandatory wrapper.`,
    hints: ['Did React 18 expand automatic batching to asynchronous callbacks?'],
    tags: ['react', 'batching', 'react-18'],
  },
  {
    id: 'state-update-queue-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Trace how React resolves this update sequence during the next render: setCount(5), setCount(prev => prev + 1), setCount(prev => prev * 2).',
    items: [
      'React sets the pending state to the raw value 5',
      'React passes 5 into prev => prev + 1, computing 6',
      'React passes 6 into prev => prev * 2, computing 12',
      'React re-renders the component with the final state 12',
      'React mutates the DOM immediately after the first call',
      'React discards previous updates and reverts count to 0',
    ],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `React evaluates queued updates in exact sequential order:

1. setCount(5) replaces the pending state with 5.
2. setCount(prev => prev + 1) receives 5 and returns 6.
3. setCount(prev => prev * 2) receives 6 and returns 12.
4. The component renders with 12, and React commits the final DOM change once.

React does not mutate the DOM between intermediate updates.`,
    explanation: `Raw values replace whatever came before; updater functions compute from whatever came before. All batching happens before the commit.`,
    hints: ['What does passing a raw value do to any preceding state in the queue?'],
    tags: ['react', 'queue', 'ordering'],
  },
  {
    id: 'redundant-state-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A component stores items: Item[] and selectedItem: Item in state. When an item is edited in items, selectedItem still displays the old unedited data. What is the clean architectural fix?',
    options: [
      'Store only selectedItemId in state and look up the active item in items during render',
      'Add a second useEffect to copy the updated object into selectedItem',
      'Directly mutate the selectedItem object properties in the edit handler',
      'Convert the component into a class component to use this.forceUpdate()',
    ],
    correctOption: 0,
    answerInFull: `Avoid redundant state by deriving values during render.

Storing the full selectedItem object creates duplicate state. When items changes, selectedItem becomes stale because it still references the old object.

    // Better: store only the identifier
    const [items, setItems] = useState(...)
    const [selectedId, setSelectedId] = useState(null)

    // Derive during render
    const selectedItem = items.find(item => item.id === selectedId)

Now, whenever items updates, selectedItem automatically reflects the changes without synchronization code.`,
    explanation: `Adding useEffect to synchronize duplicate state creates extra render cycles and race conditions.

Direct mutation breaks React change detection.

forceUpdate is an anti-pattern.`,
    hints: [
      'If a value can be computed from existing data, should it be stored as a separate state variable?',
    ],
    tags: ['react', 'derived-state', 'architecture'],
  },
  {
    id: 'lazy-state-initialization-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'You have an expensive calculation that parses data from localStorage for initial state. How should you pass it to useState so it only runs on initial mount?',
    options: [
      'Pass an initializer function: useState(() => parseExpensiveData())',
      'Call the function directly: useState(parseExpensiveData())',
      'Pass the calculation inside a string: useState("parseExpensiveData()")',
      'Invoke the calculation in the return JSX expression',
    ],
    correctOption: 0,
    answerInFull: `Pass an initializer function to useState for lazy initialization.

If you pass a direct function call:

    const [data, setData] = useState(parseExpensiveData())

JavaScript executes parseExpensiveData() on every single render pass, even though React ignores its return value after the initial mount.

Passing a function reference:

    const [data, setData] = useState(() => parseExpensiveData())

tells React to run the function only once when initializing the component on mount. On subsequent renders, React skips calling it entirely.`,
    explanation: `Calling the function directly executes the expensive calculation on every render pass.

Strings do not execute code.`,
    hints: ['What is the syntax for lazy state initialization in useState?'],
    tags: ['react', 'usestate', 'performance'],
  },
  {
    id: 'async-snapshot-closure-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A user clicks "Send" when count is 0. They immediately click "Increment" twice, changing the screen to 2 before the 3-second timer finishes. What does the alert show?',
    code: `function AlertButton() {
  const [count, setCount] = useState(0)

  function handleSend() {
    setTimeout(() => {
      alert('Count: ' + count)
    }, 3000)
  }

  return (
    <>
      <button onClick={handleSend}>Send</button>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </>
  )
}`,
    options: ['Count: 0', 'Count: 2', 'Count: undefined', 'Count: NaN'],
    correctOption: 0,
    answerInFull: `The alert displays "Count: 0".

When handleSend was invoked, the Counter component was on the render where count equaled 0. The setTimeout callback formed a JavaScript closure over that specific render snapshot.

Even though subsequent clicks to Increment triggered new renders where count became 1 and then 2, the scheduled timer callback retains its closed-over reference to the count value from the render where it was created.`,
    explanation: `React state variables are constant values within each render execution scope. Closures capture the value from that specific render.`,
    hints: ['What value was captured in closure when handleSend was called?'],
    tags: ['react', 'closure', 'snapshot'],
  },
  {
    id: 'explain-batching-interview',
    type: 'interview',
    form: 'open',
    tier: 'swe-1',
    prompt:
      'In an interview, you are asked: "What is state batching in React, why is it important, and what changed with automatic batching in React 18?" How would you structure your answer?',
    answerInFull: `Structure the answer around definition, benefits, and the React 18 evolution:

1. What is batching:
Batching is React's optimization where multiple state setter calls are grouped into a single re-render instead of triggering a separate render pass for each call.

2. Why it matters:
- Performance: Avoids redundant render calculations, virtual DOM diffing, and real DOM paints.
- Consistency: Prevents "half-finished" UI states where only one of several related variables has updated, which could cause visual glitches or divide-by-zero crashes.

3. React 17 vs React 18:
- In React 17 and earlier, batching only occurred within React synthetic event handlers (like onClick). Updates inside setTimeout, fetch promises, or native event listeners triggered individual, unbatched re-renders.
- React 18 introduced Automatic Batching everywhere by default across all contexts, with flushSync provided as an opt-out when immediate DOM updates are required.`,
    explanation: `Demonstrating knowledge of why batching prevents inconsistent UI states shows strong architectural understanding.`,
    hints: [
      'Cover what batching is, why partial renders are dangerous, and how React 18 unified batching.',
    ],
    tags: ['react', 'interview', 'batching'],
  },
  {
    id: 'stale-closure-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'In a setInterval callback that runs every second, a developer writes setSeconds(seconds + 1). The display increments from 0 to 1, but then never increases past 1. What is the bug and the fix?',
    options: [
      'The interval callback closed over seconds = 0; fix it by using an updater function setSeconds(s => s + 1)',
      'The browser timer was throttled; fix it by moving the timer to window.requestAnimationFrame',
      'React does not allow state updates from setInterval; fix it by using a global variable',
      'The component was unmounted; fix it by removing the interval cleanup function',
    ],
    correctOption: 0,
    answerInFull: `This is a classic stale closure bug.

When the interval was set up (for example in a useEffect with an empty dependency array), the callback captured seconds as 0.

Every second, the interval runs:

    setSeconds(0 + 1) // always sets to 1!

Because it keeps setting seconds to 1, the timer never advances.

Using an updater function:

    setSeconds(s => s + 1)

removes the dependency on the closed-over seconds variable. React supplies the most recent state value s to the updater function on every tick.`,
    explanation: `requestAnimationFrame is for visual animations before paint, not one-second timers.

Global variables bypass React rendering.

Removing cleanup causes memory leaks.`,
    hints: ['What value of seconds does the interval closure hold on the second tick?'],
    tags: ['react', 'stale-closure', 'timers'],
  },
]
