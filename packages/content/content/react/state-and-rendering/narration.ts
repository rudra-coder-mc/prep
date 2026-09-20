import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'State variables are not plain variables',
    heading: 'Why this matters',
    script: `The most common mistake new React developers make is expecting
      state variables to change immediately when they call a setter function.

      In regular JavaScript, reassigning a variable updates its value instantly
      on the very next line. In React, calling a setter function does not change
      the variable in place. It schedules a re-render with a new value for the
      next time the component function runs.

      Understanding that state behaves like a snapshot in time, and knowing how
      React groups updates together in batches, is the foundation for avoiding
      stale state bugs and unnecessary re-renders in production code.`,
  },
  {
    title: 'Every render captures its own state',
    heading: 'State is a snapshot',
    script: `When React renders a component, it invokes your function to get a
      fresh description of the UI. The props, state, and event handlers inside
      that execution all belong to that specific render pass.

      If you call setCount inside a click handler and immediately log count to
      the console, you will see the old value, not the new one.

      This is because your click handler captured the count variable from the
      render that just happened. Calling the setter function tells React to
      prepare a new render with the updated value, but the current execution
      keeps running with its original snapshot.

      Even inside asynchronous timers or fetch callbacks, an event handler sees
      the state snapshot of the render that created it.`,
  },
  {
    title: 'Grouping multiple updates together',
    heading: 'Batching state updates',
    script: `Imagine if React re-rendered the entire component tree every single
      time you called a setter function. If an event handler updated three
      different state variables, the component would re-render three times in a
      row, creating unnecessary layout recalculations and flickering.

      To prevent this, React uses automatic batching. React waits until all code
      in your event handler has finished running before it computes the new UI
      and updates the screen.

      In modern React, automatic batching applies everywhere: inside click
      handlers, promise chains, asynchronous timers, and native browser
      listeners. Multiple state updates in the same tick are collapsed into a
      single efficient re-render.`,
  },
  {
    title: 'Queuing sequential state transitions',
    heading: 'When to use updater functions',
    script: `Because state is a snapshot, calling a setter three times in a row
      using the current state variable will not increment it three times. Each
      call reads the same snapshot value, resulting in only a single increment
      on the next render.

      When you need to update state multiple times before the next render, or
      when an update depends directly on the previous pending state, pass an
      updater function instead of a raw value.

      An updater function takes the pending state as an argument and returns the
      next state. React places these functions into a queue and runs them in
      sequence during the next render pass, ensuring every update builds on the
      result of the previous one.`,
  },
  {
    title: 'Deriving values instead of duplicating state',
    heading: 'Choosing state structure',
    script: `How you structure your state determines how easy your component is
      to maintain.

      The golden rule is: never put something in state if it can be computed
      directly from existing props or state. For instance, if you have first name
      and last name in state, do not create a third state variable for full name.
      Calculate full name on the fly during rendering. This guarantees the value
      can never get out of sync.

      Similarly, avoid storing duplicate data. If you have a list of items and
      need a selected item, store only the selected item's ID in state, and look
      up the item in the list during render. Group state together only when two
      fields always change at the exact same moment.`,
  },
]
