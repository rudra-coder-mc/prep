import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Escape hatches in declarative React',
    heading: 'Why this matters',
    script: `React is declarative. You specify what the user interface should
      look like for a given set of props and state, and React takes care of
      updating the DOM to match.

      Most of the time, this declarative model is all you need. But real-world
      applications occasionally require an escape hatch: focusing a text box,
      scrolling a container to a specific position, measuring layout dimensions,
      or calling play and pause on a video player.

      React provides refs for these situations. In this lesson, we will explore
      the useRef hook, understand why refs do not trigger re-renders, learn how
      to safely interact with native DOM elements, and master the rules of ref
      purity.`,
  },
  {
    title: 'Remembering values without re-rendering',
    heading: 'Refs versus state',
    script: `When you call the useRef hook, React gives you back a plain
      JavaScript object with a current property holding your initial value.

      React keeps that exact same object instance alive across all re-renders of
      your component.

      The essential distinction between state and refs comes down to
      re-rendering. Setting state informs React that visual output has changed,
      triggering a re-render. Mutating a ref does not trigger a re-render at
      all.

      Refs are ideal for storing data that your component needs to remember, but
      which has no direct impact on the JSX you render. Storing an interval timer
      identifier or tracking the previous value of a prop are classic examples.
      If you put a timer identifier in state, updating it would trigger an
      unwanted render cycle.`,
  },
  {
    title: 'Connecting React to native DOM elements',
    heading: 'Accessing the DOM with refs',
    script: `The most common use of refs is getting a handle on a real browser
      DOM element. You create a ref using useRef and pass it to the ref prop of
      any JSX element.

      When React mounts that element into the browser DOM, it automatically sets
      your ref's current property to the underlying DOM node.

      When the element unmounts and leaves the screen, React cleans up after
      itself by setting the current property back to null.

      Once you have the DOM element reference, you can access standard browser
      properties and methods directly on it from inside event handlers or
      effects.`,
  },
  {
    title: 'Safe operations versus breaking reconciliation',
    heading: 'Safe versus forbidden DOM manipulations',
    script: `Because React maintains a virtual representation of the DOM and
      reconciles changes automatically, reaching around React to manipulate the
      DOM can be dangerous.

      Non-destructive operations are safe. You can focus an input element,
      scroll an element into view, measure bounding rectangles, or control
      native video playback. These actions do not alter the DOM tree structure.

      Destructive operations are forbidden. You should never call removeChild,
      appendChild, or overwrite innerHTML on DOM nodes managed by React.

      If you manually delete a node that React thinks is still on screen, the
      reconciliation engine will fail and crash with runtime errors during the
      next render pass. Let React handle the DOM structure, and limit your ref
      usage to non-destructive interactions.`,
  },
  {
    title: 'The rule of ref purity',
    heading: 'Ref purity during render',
    script: `React components are meant to be pure functions. For any given
      inputs, your component should calculate the same JSX without producing
      side effects during the render step.

      For this reason, you must never read or write a ref's current property
      during rendering.

      Modifying a ref during render breaks component predictability. Under
      concurrent rendering, React might execute your component function multiple
      times before committing changes to the screen, causing your ref mutation to
      run more times than you intended.

      Furthermore, because ref mutations do not notify React of changes, reading
      a ref during render can lead to visual inconsistencies. Always restrict
      reading and writing refs to event handlers or inside useEffect.`,
  },
]
