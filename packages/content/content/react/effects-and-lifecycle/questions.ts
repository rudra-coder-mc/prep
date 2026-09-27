import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'useeffect-timing-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'When does the callback function passed to useEffect execute relative to the browser painting the screen?',
    options: [
      'Asynchronously after React commits the DOM updates and after the browser has painted the screen',
      'Synchronously before React mutates the DOM tree during the render phase',
      'Synchronously immediately before the browser paints the screen, blocking layout',
      'During the build compilation step before the JavaScript bundle is sent to the client',
    ],
    correctOption: 0,
    answerInFull: `useEffect runs asynchronously after the browser paints.

React's render cycle proceeds through three main phases:
1. Render phase: Component function runs and returns JSX elements.
2. Commit phase: React applies the changes to the real browser DOM.
3. Paint: The browser paints the pixels on screen.
4. Effect execution: React runs any deferred useEffect callbacks.

Running effects after paint ensures that side effects (like data fetching or logging) do not block the browser from displaying the updated interface to the user.`,
    explanation: `useLayoutEffect runs synchronously before paint when layout measurements are needed, whereas useEffect runs after paint.

Effects are runtime hooks, not build-time steps.`,
    hints: [
      'Does useEffect block the screen from painting, or does it run after the user sees the update?',
    ],
    tags: ['react', 'useeffect', 'timing'],
  },
  {
    id: 'dependency-array-empty-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does passing an empty dependency array [] to useEffect(fn, []) tell React to do?',
    options: [
      'Execute the effect once after initial mount, and run its cleanup only when the component unmounts',
      'Re-run the effect after every single render pass without restriction',
      'Permanently disable the effect so it never executes',
      'Execute the effect continuously on a high-precision animation timer',
    ],
    correctOption: 0,
    answerInFull: `An empty dependency array [] synchronizes once on mount.

The dependency array tells React when to re-synchronize the effect. React compares the dependencies from the current render with the previous render using Object.is.

Because an empty array has no dependencies, none of its dependencies ever change. Therefore, React executes the effect function once when the component first appears on screen, and executes the cleanup function only when the component is removed from the DOM.`,
    explanation: `Omitting the dependency array entirely causes the effect to run after every render.

An empty array does not disable the effect; it runs once on mount.`,
    hints: ['When can values in an empty array change?'],
    tags: ['react', 'useeffect', 'dependencies'],
  },
  {
    id: 'infinite-loop-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A developer writes this component to load user details. The browser tab freezes with "Maximum update depth exceeded". What is the bug?',
    code: `function UserProfile({ userId }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchUser(userId).then(res => setData(res))
  })

  return <div>{data?.name}</div>
}`,
    options: [
      'The effect has no dependency array, so setData triggers a re-render which triggers the effect again in an infinite loop',
      'fetchUser returns a Promise, which cannot be resolved inside useEffect',
      'The data variable must be initialized to an empty string rather than null',
      'React does not allow optional chaining (?.) inside JSX expressions',
    ],
    correctOption: 0,
    answerInFull: `Omitting the dependency array triggers an infinite render loop.

Because no dependency array was provided to useEffect, the effect runs after every single render pass.

1. Component renders with data = null.
2. Effect runs and initiates fetchUser.
3. When fetchUser resolves, it calls setData(res).
4. Calling setData schedules a re-render.
5. Component re-renders with new data.
6. Because there is no dependency array, the effect runs again!
7. Step 3 repeats indefinitely, crashing the app.

The fix is to pass [userId] as the dependency array so the effect only re-runs when userId changes.`,
    explanation: `Promises can be handled inside effects (typically with an async function inside the effect body).

Optional chaining is standard modern JavaScript and supported in JSX.`,
    hints: ['What happens when useEffect is called without a second argument?'],
    tags: ['react', 'useeffect', 'infinite-loop'],
  },
  {
    id: 'cleanup-execution-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Order the execution steps when a component with an effect and cleanup updates because its dependency id changed from 1 to 2.',
    items: [
      'React renders the component with id = 2',
      'React updates the browser DOM with the new render markup',
      'React runs the cleanup function from the previous effect (id = 1)',
      'React executes the new effect function for id = 2',
      'React unmounts the component and destroys all state',
      'React runs the new effect before running the old cleanup',
    ],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `Cleanup always runs before the next effect synchronizes:

1. React calls the component function with id = 2 (Render).
2. React commits the DOM changes to the browser.
3. React runs the cleanup function from the previous render (cleaning up resources for id = 1).
4. React runs the new effect function (setting up resources for id = 2).

The component does not unmount during a re-render, and the old cleanup always runs before the new setup.`,
    explanation: `Cleanup precedes new effect setup to ensure old connections or listeners are torn down before new ones are established.`,
    hints: ['Does React clean up the old effect before or after running the new effect?'],
    tags: ['react', 'useeffect', 'cleanup'],
  },
  {
    id: 'strict-mode-double-mount-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does React StrictMode run an effect, immediately run its cleanup, and then run the effect again on initial mount in development?',
    options: [
      'To verify that the cleanup function correctly restores the component and prevents memory leaks',
      'To pre-warm the JavaScript V8 engine compiler cache for production performance',
      'To test whether the browser has WebAssembly support enabled',
      'To measure network bandwidth by executing duplicate fetch calls',
    ],
    correctOption: 0,
    answerInFull: `React StrictMode stress-tests your effect cleanup logic.

In production, components frequently mount and unmount (e.g. when users navigate back and forth between tabs). If an effect opens a subscription or attaches an event listener without a matching cleanup, resources leak.

By deliberately executing setup -> cleanup -> setup on initial mount in development, React immediately reveals whether your cleanup properly undid the setup. If an effect opens a chat connection and does not close it in cleanup, you will see two open connections in dev mode.`,
    explanation: `StrictMode is a development-only validation tool; it does not benchmark hardware or warm V8 caches.

StrictMode does not depend on WebAssembly.`,
    hints: ['What would happen if an effect sets up a listener but has no cleanup function?'],
    tags: ['react', 'strict-mode', 'cleanup'],
  },
  {
    id: 'derived-state-anti-pattern-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A component stores query and products in state. It adds a useEffect with [query, products] that filters the array and calls setFilteredProducts(results). Why is this an anti-pattern?',
    options: [
      'It creates an unnecessary extra render cycle; the filtered list should be computed directly during render',
      'useEffect does not support arrays in its dependency list',
      'The filter method cannot be executed inside a functional component',
      'Calling setFilteredProducts inside useEffect always causes a fatal crash',
    ],
    correctOption: 0,
    answerInFull: `Do not use useEffect to calculate derived state.

When query updates:
1. Component renders with new query and old filteredProducts.
2. The browser paints the screen with stale filtered results.
3. useEffect runs, computes the filtered list, and calls setFilteredProducts.
4. Component re-renders a second time to show the filtered results.

This causes a visible flash of old content and wastes CPU cycles.

The clean solution is to compute the filtered list directly during render:

    const filteredProducts = products.filter(p => p.name.includes(query))

If the calculation is computationally expensive, wrap it in useMemo.`,
    explanation: `Dependencies can be arrays or any JavaScript values.

The code works without crashing, but introduces redundant renders and synchronization complexity.`,
    hints: [
      'If you can compute something during render, should you store it in state via an effect?',
    ],
    tags: ['react', 'derived-state', 'antipattern'],
  },
  {
    id: 'event-listener-cleanup-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which code correctly listens to window resize events and guarantees no memory leak when the component unmounts?',
    options: [
      'useEffect(() => { const onResize = () => setWidth(window.innerWidth); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, [])',
      'useEffect(() => { window.addEventListener("resize", () => setWidth(window.innerWidth)); }, [])',
      'useEffect(() => { window.onresize = () => setWidth(window.innerWidth); return () => window.close(); }, [])',
      'useEffect(() => { document.body.addEventListener("resize", () => setWidth(window.innerWidth)); })',
    ],
    correctOption: 0,
    answerInFull: `Always remove event listeners in the effect cleanup function:

    useEffect(() => {
      const handleResize = () => setWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [])

Without removing the listener, every time the component mounts and unmounts, a leftover listener remains in window memory, continuing to execute and causing memory leaks.`,
    explanation: `Passing an inline anonymous function to addEventListener without a matching reference prevents removeEventListener from finding the function.

window.close() closes the browser tab, not the event listener!`,
    hints: ['What must be returned by the effect to remove the listener?'],
    tags: ['react', 'useeffect', 'event-listeners'],
  },
  {
    id: 'race-condition-fetch-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A user rapidly types "react" into a search input. The network request for "re" finishes after the request for "react", causing stale results to overwrite fresh results. How does useEffect resolve this race condition?',
    options: [
      'Use an ignore boolean flag or AbortController in the effect cleanup to ignore or cancel superseded requests',
      'Disable user typing until the first request completes',
      'Store search results in localStorage instead of component state',
      'Remove the query variable from the dependency array so only one request runs',
    ],
    correctOption: 0,
    answerInFull: `Use a cleanup flag or AbortController to discard stale responses:

    useEffect(() => {
      let ignore = false

      fetchResults(query).then(data => {
        if (!ignore) {
          setResults(data)
        }
      })

      return () => {
        ignore = true // Superseded by a newer render!
      }
    }, [query])

When the user types a new character, React re-renders and runs the cleanup function of the previous effect, setting ignore to true. If the older network response arrives late, the ignore check prevents it from overwriting state with stale data.`,
    explanation: `Disabling typing hurts user experience.

localStorage does not solve network race conditions.

Removing query from dependencies causes the effect to never run when query changes.`,
    hints: ['What can the cleanup function do to signal that a pending promise is now stale?'],
    tags: ['react', 'race-conditions', 'async'],
  },
  {
    id: 'explain-useeffect-mental-model-interview',
    type: 'interview',
    form: 'open',
    tier: 'swe-1',
    prompt:
      'In an interview, you are asked: "Why does the React team emphasize thinking of useEffect as a synchronization mechanism rather than a lifecycle hook?" How would you structure your answer?',
    answerInFull: `Structure the answer around the shift from imperative lifecycles to declarative synchronization:

1. The Lifecycle Mental Model:
Thinking in terms of lifecycle hooks (componentDidMount, componentDidUpdate, componentWillUnmount) encourages treating effects as arbitrary buckets to execute imperative logic at specific points in time. This leads to duplicate code across mount and update, missing dependencies, and stale state bugs.

2. The Synchronization Mental Model:
An effect describes how to synchronize an external system (DOM, network, third-party library) with the current props and state of the component.
Instead of asking "What do I do when I mount?", you ask: "What external system does this component need to stay in sync with, and how do I start and stop that synchronization?"

3. Practical Consequences:
- Every reactive dependency must be declared.
- Cleanup functions naturally stop synchronization before re-synchronizing with new inputs.
- You avoid using effects for tasks that belong in event handlers or pure render calculations.`,
    explanation: `Highlighting that effects start and stop synchronization based on state changes rather than arbitrary component mount moments shows deep understanding.`,
    hints: [
      'Focus on how synchronization connects state to external systems, compared to lifecycle triggers.',
    ],
    tags: ['react', 'interview', 'useeffect', 'mental-model'],
  },
  {
    id: 'key-prop-reset-state-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'You have a CommentForm component with internal draftText state. When the user navigates between different post IDs, the draft text should reset to empty. What is the most idiomatic React solution?',
    options: [
      'Pass key={postId} to <CommentForm key={postId} /> so React unmounts the old instance and mounts a fresh one',
      'Add a useEffect inside CommentForm with [postId] that calls setDraftText("")',
      'Trigger window.location.reload() whenever postId changes',
      'Pass setDraftText down from a parent and call it in the post navigation link',
    ],
    correctOption: 0,
    answerInFull: `Use the key prop to reset component state.

    <CommentForm key={postId} />

When the key prop changes, React treats the component as an entirely different entity:
1. It unmounts the old CommentForm instance (destroying its previous state).
2. It mounts a brand new CommentForm instance with initial default state.

Using an effect to reset state causes an extra render pass where the component briefly renders with the new postId but the old draftText before resetting, which can cause visual glitches.`,
    explanation: `Using useEffect to reset state causes redundant renders and stale state flashes.

Full page reloads destroy single-page application performance.`,
    hints: [
      'How can you tell React that a component should be treated as a completely fresh instance when an ID changes?',
    ],
    tags: ['react', 'key-prop', 'state-reset'],
  },
]
