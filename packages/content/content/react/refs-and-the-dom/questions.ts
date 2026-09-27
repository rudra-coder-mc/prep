import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'useref-return-value-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does the useRef(initialValue) hook return in a React component?',
    options: [
      'A plain JavaScript object with a mutable current property initialized to initialValue: { current: initialValue }',
      'A tuple containing the current value and a state updater function: [value, setValue]',
      'A live HTML DOM element node directly attached to the browser document',
      'An immutable reactive signal that broadcasts changes to subscriber components',
    ],
    correctOption: 0,
    answerInFull: `useRef returns a plain JavaScript object:

    const countRef = useRef(0)
    // countRef is: { current: 0 }

React preserves this exact object reference across all subsequent re-renders of the component. You can freely read and mutate its .current property without triggering a re-render.`,
    explanation: `useRef does not return a tuple like useState. It returns a persistent container object { current: value }.`,
    hints: ['What property does the object returned by useRef expose?'],
    tags: ['react', 'useref', 'hooks'],
  },
  {
    id: 'ref-vs-state-re-render',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the key behavioral difference between mutating ref.current and calling a state setter function from useState?',
    options: [
      'Mutating ref.current does not trigger a re-render, whereas calling a state setter schedules a re-render with the new value',
      'Refs are stored in browser localStorage, while state is stored in memory',
      'Mutating a ref requires an asynchronous Promise, while state updates are always synchronous',
      'Refs can only store numbers, while state can store any JavaScript data type',
    ],
    correctOption: 0,
    answerInFull: `The primary distinction between refs and state is re-rendering:

- useState: Tells React that information affecting the visual output has changed. React schedules a re-render to update the screen.
- useRef: A mutable box to store values that do not affect the visual JSX output. Mutating ref.current does not trigger a re-render.

If changing a value does not need to update what is displayed on screen, use a ref.`,
    explanation: `Mutating ref.current is a silent in-memory property change. React does not listen for property mutations on refs, so no re-render occurs.`,
    hints: ['Does changing ref.current cause the component function to run again?'],
    tags: ['react', 'useref', 'usestate', 'rendering'],
  },
  {
    id: 'dom-ref-lifecycle-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Put the steps of attaching and tearing down a DOM ref in chronological order, from component initialization to unmount.',
    items: [
      'useRef(null) initializes the ref container with current set to null',
      'React executes component render and returns JSX containing <input ref={myRef} />',
      'React creates the browser DOM node and sets myRef.current to that DOM element',
      'User clicks a button, invoking an event handler that calls myRef.current.focus()',
      'Component unmounts and React resets myRef.current back to null',
      'Browser reboots the JavaScript runtime engine',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `The lifecycle of a DOM ref is:

1. useRef(null) initializes the object { current: null }.
2. The component renders and returns JSX containing <input ref={myRef} />.
3. React creates the DOM node in the browser and assigns myRef.current = inputElement.
4. Later, event handlers or effects can safely interact with myRef.current.
5. When the component unmounts from the screen, React resets myRef.current to null.

The browser JavaScript runtime is not rebooted during React component lifecycles.`,
    explanation: `React populates ref.current after the DOM element is created and clears it to null upon unmount.`,
    hints: ['What is the value of ref.current before the DOM node is created?'],
    tags: ['react', 'useref', 'dom', 'lifecycle'],
  },
  {
    id: 'safe-vs-unsafe-dom-operations',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which of the following operations is safe and standard practice when interacting with a DOM node via a ref?',
    options: [
      'Calling inputRef.current.focus() or elementRef.current.scrollIntoView()',
      'Calling parentRef.current.removeChild(childNode) to delete a child element',
      'Injecting arbitrary HTML with containerRef.current.innerHTML = "<div>New</div>"',
      'Appending custom DOM elements directly via parentRef.current.appendChild()',
    ],
    correctOption: 0,
    answerInFull: `Non-destructive DOM operations are completely safe:

- Focusing an input: inputRef.current.focus()
- Scrolling: elementRef.current.scrollIntoView()
- Measuring layout: elementRef.current.getBoundingClientRect()
- Media playback: videoRef.current.play()

Destructive operations like removeChild, appendChild, or innerHTML modify the DOM tree behind React's back. Doing so corrupts React's internal virtual DOM reconciler and causes crashes on subsequent renders.`,
    explanation: `Focus, scrolling, and measurement do not modify the DOM tree structure that React manages. Structural alterations cause reconciliation failures.`,
    hints: ["Which action doesn't alter the DOM tree hierarchy?"],
    tags: ['react', 'dom', 'useref', 'reconciliation'],
  },
  {
    id: 'timer-id-storage-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why should an interval ID returned by setInterval be stored in a useRef rather than useState?',
    options: [
      'Changing the timer ID does not affect the visual JSX output, so storing it in a ref avoids unnecessary re-renders',
      'React throws an error if an integer ID is passed to useState',
      'The setInterval API is incompatible with JavaScript closures inside state',
      'State setters cannot be called inside useEffect cleanup functions',
    ],
    correctOption: 0,
    answerInFull: `Storing an interval ID in state causes an unnecessary re-render when the timer starts or stops:

    // RECOMMENDED:
    const timerId = useRef<number | null>(null)

    function start() {
      timerId.current = window.setInterval(tick, 1000) // No re-render!
    }

    function stop() {
      if (timerId.current !== null) {
        clearInterval(timerId.current)
      }
    }

Since the timer ID is not rendered on screen, using useRef keeps the value between renders without triggering unwanted visual updates.`,
    explanation: `useRef is ideal for storing non-visual metadata that must persist across renders.`,
    hints: ['Does the user ever see the numeric ID returned by setInterval rendered on screen?'],
    tags: ['react', 'useref', 'performance', 'timers'],
  },
  {
    id: 'ref-purity-render-rule',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why should you avoid reading or writing ref.current during the component render phase?',
    options: [
      'Component rendering must remain a pure function; reading or writing refs during render makes output non-deterministic and breaks React Concurrent Mode',
      'React immediately deletes the ref object if it is accessed during render',
      'Reading a ref during render locks the main browser thread for 100 milliseconds',
      'Refs can only be accessed by asynchronous workers',
    ],
    correctOption: 0,
    answerInFull: `React expects rendering functions to be pure: given the same props and state, they should return the same JSX without side effects.

If you read or write ref.current during render:

    // BAD: Mutating ref in render body
    function Counter() {
      const renderCount = useRef(0)
      renderCount.current++ // SIDE EFFECT DURING RENDER!
      return <div>Renders: {renderCount.current}</div>
    }

In React Concurrent Mode, React may execute component render passes multiple times before committing. A side-effect during render makes the component non-deterministic and can produce stale UI bugs. Read and write refs only in event handlers or useEffect.`,
    explanation: `Mutating or reading refs during rendering violates React's purity rules. Refs belong in event handlers or useEffect.`,
    hints: [
      'What rule requires component functions to produce the same output for given props and state without side effects?',
    ],
    tags: ['react', 'useref', 'purity', 'concurrent-mode'],
  },
  {
    id: 'ref-cleanup-on-unmount',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      "What does React set a DOM ref's .current property to when the associated DOM element unmounts from the document?",
    options: [
      'null',
      'undefined',
      'A detached DOM ghost clone',
      'The previous DOM element with an isDestroyed flag set to true',
    ],
    correctOption: 0,
    answerInFull: `When the JSX element containing a ref unmounts from the DOM, React sets the ref's current property back to null.

    // On mount:
    inputRef.current = <HTMLInputElement>

    // On unmount:
    inputRef.current = null

Always use optional chaining (inputRef.current?.focus()) or an if-check before accessing properties on ref.current to avoid null pointer exceptions.`,
    explanation: `React cleans up DOM references by setting .current to null, preventing memory leaks from detached DOM nodes.`,
    hints: ['What primitive value does React assign to clear a reference to an unmounted element?'],
    tags: ['react', 'useref', 'unmount', 'dom'],
  },
  {
    id: 'forward-ref-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How does a custom component expose a ref to its internal native DOM element in modern React?',
    options: [
      'By accepting a ref prop (in React 19) or using React.forwardRef() (in React 18) to forward the ref to the underlying native element',
      'By defining an export default ref declaration in the child file',
      'By storing the DOM node in a global window variable accessible to parents',
      'By creating a custom event bus to broadcast the element pointer',
    ],
    correctOption: 0,
    answerInFull: `Custom components do not accept the ref prop automatically without forwarding it.

In modern React:

    // React 19: ref is a standard prop
    function CustomInput({ placeholder, ref }: { placeholder: string, ref: React.Ref<HTMLInputElement> }) {
      return <input ref={ref} placeholder={placeholder} />
    }

    // React 18: forwardRef wrapper
    const CustomInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
      return <input ref={ref} placeholder={props.placeholder} />
    })

This allows the parent component to pass a ref that attaches directly to the child's underlying <input> element.`,
    explanation: `In React 18, React.forwardRef wraps the component. In React 19, ref is treated as a regular prop. Both forward the ref to the inner DOM element.`,
    hints: ['What React API is named after passing a ref forward to an inner element?'],
    tags: ['react', 'forwardRef', 'props', 'components'],
  },
  {
    id: 'ref-previous-value-pattern',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How can a useRef hook be used to inspect the previous value of a prop or state variable?',
    options: [
      'By reading ref.current in an effect, and then updating ref.current with the new value inside that same useEffect',
      'By calling useRef.getPrevious() built-in helper method',
      'By creating a circular reference between two useState variables',
      "By subscribing to the browser's History API state change event",
    ],
    correctOption: 0,
    answerInFull: `Because useEffect runs after rendering is committed to the screen, a ref can hold the previous value:

    function MyComponent({ value }: { value: string }) {
      const prevValueRef = useRef<string>('')

      useEffect(() => {
        // Updates AFTER render commits, so it holds the previous value during the next render
        prevValueRef.current = value
      }, [value])

      const prevValue = prevValueRef.current
      // prevValue reflects the value before the current update
    }

This pattern stores past values without triggering additional re-renders.`,
    explanation: `Effects execute after the component finishes rendering, allowing you to record the current value in ref.current for comparison during the next render cycle.`,
    hints: ['When does useEffect run relative to the render pass?'],
    tags: ['react', 'useref', 'useeffect', 'patterns'],
  },
  {
    id: 'declarative-vs-imperative-scenario',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A junior developer uses a ref to change a header\'s text: titleRef.current.textContent = "Welcome". What is the idiomatic declarative React solution?',
    options: [
      'Store the text in a useState variable and render it in JSX: <h1>{title}</h1>',
      'Use document.getElementById("title").innerHTML = "Welcome"',
      'Use a Web Worker to postMessage the title string to the DOM',
      'Wrap the text assignment in an eval() statement inside useEffect',
    ],
    correctOption: 0,
    answerInFull: `React is designed to be declarative.

Directly mutating textContent or innerHTML bypasses React's virtual DOM reconciliation and leads to stale state bugs.

The idiomatic solution is to declare state and render it directly in JSX:

    const [title, setTitle] = useState('Initial')

    return <h1>{title}</h1>

Reserve refs for things React cannot do declaratively, such as focusing an input or triggering imperative media playback.`,
    explanation: `Changing content displayed on the screen should always be handled through React state and JSX rather than imperative DOM mutation.`,
    hints: ['How do you normally display dynamic text in React?'],
    tags: ['react', 'declarative', 'usestate', 'best-practices'],
  },
]
