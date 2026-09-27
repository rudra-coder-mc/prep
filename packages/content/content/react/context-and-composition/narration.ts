import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Passing data deep into the component tree',
    heading: 'Why this matters',
    script: `React enforces a strict top-down data flow. Props are passed from
      parent components down to child components. While this makes data flow
      easy to trace, it creates friction when deeply nested components across the
      app need access to the same information, like an authentication session or
      a color theme.

      Passing props through multiple intermediate layers that do not care about
      the data is called prop drilling.

      In this lesson, we will explore two primary tools to solve this dilemma:
      Component Composition, which passes rendered elements using the children
      prop, and the Context API.

      You will learn how to determine which approach to use, how to broadcast
      state cleanly with useContext, and how to optimize context performance.`,
  },
  {
    title: 'The pain of intermediate prop drilling',
    heading: 'The prop drilling dilemma',
    script: `Prop drilling occurs when a high-level component holds state that a
      deeply nested component needs, requiring every component in between to
      forward the prop along.

      This makes intermediate components brittle and difficult to maintain.
      They accept props they never use simply to forward them to their children.

      Whenever you need to add or rename a prop, you have to edit every single
      file in the chain.

      Furthermore, writing automated tests for intermediate components becomes
      laborious because you must provide dummy mock values for props the
      component does not even touch. Recognizing prop drilling is the first step
      toward choosing the right architectural remedy.`,
  },
  {
    title: 'Lifting content before reaching for context',
    heading: 'Component composition as the first solution',
    script: `Before reaching for React Context or global state libraries, the
      official React guidance recommends trying Component Composition first.

      Often, the simplest solution to prop drilling is not a global store, but
      leveraging the children prop.

      Instead of passing a data prop down through a layout and navigation bar,
      you render the target component at the top level where the data already
      lives, and pass that rendered component down as a child.

      The intermediate containers only need to accept and render children. They
      remain completely unaware of the nested component's data requirements.
      This decouples the visual containers from the specific data needs of their
      contents.`,
  },
  {
    title: 'Broadcasting values with Context',
    heading: 'The Context API',
    script: `When data genuinely needs to be accessed by many components across
      unrelated branches of your component tree, React Context provides a
      direct broadcast mechanism.

      You create a context using createContext, providing a fallback default
      value.

      Then, in a parent component, you wrap your tree with the Context Provider
      and supply the current value.

      Any descendant component anywhere in the subtree can read that value
      directly using the useContext hook.

      The value bypasses all intermediate components without requiring props on
      any of them. Context is ideal for global application state like user
      authentication, themes, and locale preferences.`,
  },
  {
    title: 'Optimizing context renders and splitting stores',
    heading: 'Context performance and best practices',
    script: `Context is powerful, but it comes with an important performance
      caveat: whenever a Provider's value changes, every component that consumes
      that context will re-render.

      If you place all of your application's state into one monolithic context
      object, updating a single counter will cause components that only care
      about the user profile to re-render unnecessarily.

      The fix is to split independent state into multiple focused contexts,
      like a ThemeContext and an AuthContext.

      Additionally, if you pass an object as a context value, wrap it in the
      useMemo hook. This ensures that parent re-renders do not generate a new
      object reference, which would trigger accidental consumer updates.

      Finally, wrap your useContext calls in custom helper hooks to provide
      clean error messages if a component is rendered outside its provider.`,
  },
]
