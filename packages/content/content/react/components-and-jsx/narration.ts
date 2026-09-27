import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Turning UI into a data projection',
    heading: 'Why this matters',
    script: `In the traditional DOM, your code is constantly finding elements,
      updating text, and adding listeners by hand. When multiple user actions
      touch the same piece of the interface, keeping the screen in sync with your
      underlying data becomes complicated very quickly.

      React turns this inside out. Instead of mutating DOM elements yourself,
      you write a function that describes what the interface should look like
      for a given snapshot of data. React takes care of turning that description
      into real DOM nodes.

      In an entry-level interview, the dividing line is not whether you can
      write a component with angle brackets. It is whether you understand what
      happens under the hood: how JSX is transformed, why rendering functions
      must be pure, and why React works with lightweight descriptor objects
      instead of touching the browser directly.`,
  },
  {
    title: 'JSX is syntax sugar for function calls',
    heading: 'What JSX compiles to',
    script: `Browsers have no idea what JSX is. If you send JSX directly to a
      browser engine, it fails immediately with a syntax error.

      Before your code ever runs, a compiler converts every JSX tag into a
      standard JavaScript function call. What looks like an HTML button tag
      becomes a call to the runtime jsx function, passing the tag name as a
      string, the attributes as a plain object, and the text inside as children.

      Because JSX compiles to a function call, a JSX element is a normal
      expression. You can store it in a variable, pass it as an argument into
      another function, or return it.

      This is also why you cannot return two sibling tags without a wrapper. A
      JavaScript function cannot return two independent values at once without
      wrapping them in a container, such as a Fragment. And this is why component
      names must start with a capital letter: lowercase names are compiled as
      strings for standard HTML tags, while uppercase names are compiled as
      variable identifiers.`,
  },
  {
    title: 'Rendering must have no side effects',
    heading: 'Components as pure functions',
    script: `A React component is simply a JavaScript function that receives
      props and returns JSX. But React places a strict contract on this
      function: it must be pure.

      Purity means two things. First, given the same props, the function must
      always return the exact same JSX. Second, the function must not produce
      any side effects while rendering. It must not change external variables,
      call network APIs, or touch the browser DOM directly during its execution.

      Why does React enforce this? Because React needs to be free to call your
      component function whenever it wants. In development mode with StrictMode
      enabled, React calls every component function twice specifically to catch
      unwanted side effects. If rendering a component increments a global
      counter, that counter will jump twice and the numbers will be wrong.

      Side effects belong strictly in user event handlers like click listeners,
      or inside useEffect after the render pass has finished.`,
  },
  {
    title: 'Inputs that cannot be changed from below',
    heading: 'Props are read-only snapshots',
    script: `Props are the inputs passed down from a parent component to a
      child. The most important rule to remember is that props are strictly
      read-only snapshots.

      A child component must never reassign or mutate a prop it receives. The
      props object belongs to the parent. If a child were allowed to mutate a
      prop, other siblings relying on that same data would see unexpected changes
      without React being notified.

      When you want data to change over time, you do not mutate props. Instead,
      you declare state using the useState hook, or you ask the parent component
      to pass down an event handler function so the child can request a change.
      When the parent changes the data, React re-executes the child function
      with a brand new props object for that render.`,
  },
  {
    title: 'Descriptors versus live DOM nodes',
    heading: 'Elements are not DOM nodes',
    script: `When a component executes, it does not create real browser DOM
      elements. It returns a plain JavaScript object called a React element.

      This object simply describes what should appear on screen. It holds the
      type of the element, its properties, and its children. Because it is an
      ordinary JavaScript object, creating thousands of elements is nearly
      instantaneous and consumes minimal memory.

      Real DOM nodes, by contrast, are expensive. The browser must calculate
      geometry, recompute styles, and maintain complex event listener chains.

      By producing a tree of lightweight element descriptors on every render,
      React can compare the new tree against the old tree through reconciliation.
      Only the specific properties and nodes that actually changed are written
      to the browser DOM, minimizing expensive layout recalculations.`,
  },
]
