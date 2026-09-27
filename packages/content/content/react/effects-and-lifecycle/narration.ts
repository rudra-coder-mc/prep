import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Beyond the traditional lifecycle mindset',
    heading: 'Why this matters',
    script: `The useEffect hook is one of the most commonly misunderstood parts
      of React. Many engineers treat it like a combination of old class lifecycle
      methods: did mount, did update, and will unmount.

      Thinking of effects as lifecycle hooks often leads to hard-to-find bugs:
      infinite render loops, network race conditions, and out-of-sync user
      interfaces.

      In modern React, an effect is not a lifecycle trigger. It is a
      synchronization mechanism. An effect connects a React component to an
      external system that React does not control, keeping them in sync as your
      props and state change over time.`,
  },
  {
    title: 'Connecting React to the outside world',
    heading: 'Effects synchronize external systems',
    script: `React rendering is a pure calculation. Given the same inputs, it
      describes the user interface without changing anything outside itself.

      Most side effects happen directly because of user interactions, like
      clicking a button or submitting a form. Those side effects belong squarely
      inside your event handlers.

      An effect is reserved for operations that must happen simply because the
      component was displayed on the screen.

      Examples include synchronizing an imperative DOM element like an HTML5
      video player, subscribing to a WebSocket chat server, setting a browser
      interval timer, or communicating with a third-party mapping library. The
      effect ensures the external system matches React's current state.`,
  },
  {
    title: 'Starting and stopping synchronization',
    heading: 'The lifecycle of an effect',
    script: `While a component mounts, re-renders, and unmounts, an effect has a
      different lifecycle: it starts synchronizing, and later it stops
      synchronizing.

      The dependency array tells React when synchronization must happen. If you
      pass an empty dependency array, the effect synchronizes once when the
      component appears and stops when it is removed. If you list dependencies,
      React checks whether any of those values changed since the previous render
      using strict equality. If they changed, it re-synchronizes.

      Every reactive value read inside the effect must be included in the
      dependency array. Omit a dependency, and the effect will run with stale
      variables captured from an older render snapshot.`,
  },
  {
    title: 'Cleaning up after yourself',
    heading: 'Why cleanup functions are crucial',
    script: `Whenever an effect starts a process that persists over time, such as
      a network subscription or a window event listener, it must return a
      cleanup function.

      React executes this cleanup function in two situations: first, before the
      effect runs again with new dependencies; second, when the component
      unmounts from the screen.

      This cleanup is what stops synchronization. It closes the WebSocket,
      removes the window event listener, or cancels the timer.

      In development mode with StrictMode enabled, React deliberately runs your
      effect, executes its cleanup, and runs the effect again. This intentional
      remount tests whether your cleanup function works properly, exposing
      memory leaks before they reach production.`,
  },
  {
    title: 'When not to write an effect',
    heading: 'You might not need an effect',
    script: `Before reaching for useEffect, check whether an effect is really
      necessary. Many common use cases are better handled without one.

      Do not use an effect to transform data for rendering. If you have a list
      and need to filter it by search text, calculate the filtered list directly
      at the top of your component during render. Storing filtered items in a
      separate state variable via an effect wastes performance and triggers
      extra render passes.

      Do not use an effect for actions triggered by user clicks. Put that logic
      in the click handler.

      And if you need to reset a component's state when a user ID changes, do
      not use an effect. Pass a unique key prop with the ID to the component
      instead. React will automatically recreate the component with fresh state.`,
  },
]
