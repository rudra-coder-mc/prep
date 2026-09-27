import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'prop-drilling-definition',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does the term "prop drilling" refer to in React development?',
    options: [
      'Passing props down through multiple layers of intermediate components that do not use the data themselves, just to reach a deeply nested child',
      'Injecting dynamic props into an HTML <input> element during user typing events',
      'The process of serializing React component props into query parameters in the URL',
      'Using reflection to dynamically inspect private properties on component classes',
    ],
    correctOption: 0,
    answerInFull: `Prop drilling describes passing props through intermediate components that do not need the data:

    <App user={user}>
      <Header user={user}>
        <Nav user={user}>
          <UserMenu user={user}>
            <Avatar user={user} />
          </UserMenu>
        </Nav>
      </Header>
    </App>

Header, Nav, and UserMenu only accept and pass user down. This creates tight coupling and makes refactoring and testing intermediate components painful.`,
    explanation: `Prop drilling is passing props through components that do not need them simply to get the props to child components located deeper down the tree.`,
    hints: ['Think of drilling through multiple layers of components that do not use the prop.'],
    tags: ['react', 'props', 'prop-drilling', 'architecture'],
  },
  {
    id: 'composition-alternative-to-context',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How does component composition (using the children prop) often solve prop drilling without needing React Context?',
    options: [
      'By instantiating the leaf component where data is available and passing it as children, so intermediate layout components only forward children without knowing about its props',
      'By turning all intermediate components into native HTML5 Web Components',
      'By storing props in global window variables accessible across the DOM tree',
      'By compiling the entire subtree into a single static JavaScript bundle at build time',
    ],
    correctOption: 0,
    answerInFull: `Component composition lets you pass rendered JSX elements down via the children prop:

    // Intermediate layout only renders {children}
    function Header({ children }: { children: React.ReactNode }) {
      return <header className="topbar">{children}</header>
    }

    // Top-level component passes Avatar directly:
    function App() {
      const [user] = useState({ name: 'Alex' })
      return (
        <Header>
          <Avatar user={user} />
        </Header>
      )
    }

Header does not need to know about user. If Avatar needs different props later, Header remains unchanged.`,
    explanation: `Composition decouples intermediate container components from the specific data required by their nested children.`,
    hints: [
      'How does passing <Avatar user={user} /> as children prevent Header from needing a user prop?',
    ],
    tags: ['react', 'composition', 'children', 'architecture'],
  },
  {
    id: 'use-context-hook-usage',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which React hook is used inside a functional component to read and subscribe to a Context value?',
    options: ['useContext()', 'useProvider()', 'useSubscription()', 'useBroadcast()'],
    correctOption: 0,
    answerInFull: `The useContext hook is the standard way to consume a context:

    import { useContext } from 'react'
    import { ThemeContext } from './ThemeContext'

    export function Button() {
      const theme = useContext(ThemeContext)
      return <button className={theme}>Click Me</button>
    }

React automatically subscribes the component to ThemeContext and re-renders it whenever the provider value changes.`,
    explanation: `useContext(MyContext) accepts a context object created by createContext and returns the current context value.`,
    hints: ['Which hook takes a Context object created by createContext?'],
    tags: ['react', 'usecontext', 'hooks'],
  },
  {
    id: 'context-setup-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt: 'Put the steps to create, provide, and consume a React Context in logical order.',
    items: [
      'Call createContext(defaultValue) to define the context and export it',
      'In a parent component, wrap children with <MyContext.Provider value={currentValue}>',
      'In a descendant component, call useContext(MyContext) to read the value',
      'Parent updates the state passed into value, triggering automatic re-renders of all consumer components',
      'Browser downloads new CSS stylesheets from the CDN',
    ],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `The complete lifecycle of React Context is:

1. Create context: const ThemeContext = createContext('light')
2. Provide value: <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
3. Consume value: const theme = useContext(ThemeContext)
4. Update value: Changing the state passed to Provider triggers re-renders in all consumers.

CSS stylesheet downloads are unrelated to React Context lifecycle.`,
    explanation: `You create the context, wrap the tree in its Provider with a value, consume it via useContext, and updates to the value re-render consumers.`,
    hints: ['Do you create the context before or after wrapping components with its Provider?'],
    tags: ['react', 'context', 'lifecycle', 'usecontext'],
  },
  {
    id: 'context-consumer-re-rendering',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      "What happens to components that call useContext(MyContext) when the Provider's value prop changes to a new value?",
    options: [
      'Every component that consumes MyContext automatically re-renders with the new value',
      'Only components wrapped in React.memo will re-render',
      'Only the root Provider component re-renders while consumers maintain their initial snapshot',
      'React throws an unhandled state warning if more than 3 components consume the context',
    ],
    correctOption: 0,
    answerInFull: `When a Provider's value prop changes:

React immediately identifies all components that call useContext(MyContext) in the subtree and schedules them for a re-render.

Crucially, wrapping consumer components in React.memo does NOT prevent them from re-rendering when the context they consume changes. Context updates intentionally bypass memoization to ensure consumers always show current data.`,
    explanation: `All consumers of a context re-render when its value changes, even if wrapped in React.memo.`,
    hints: [
      'Does React guarantee that consumers receive the newest context value when it changes?',
    ],
    tags: ['react', 'context', 're-rendering', 'performance'],
  },
  {
    id: 'create-context-default-value',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When does React use the defaultValue passed to createContext(defaultValue)?',
    options: [
      'Only when a component calls useContext(MyContext) without any matching <MyContext.Provider> above it in the tree',
      'Whenever the Provider passes value={null}',
      'Whenever the Provider passes value={undefined}',
      'Only during the initial server-side render pass',
    ],
    correctOption: 0,
    answerInFull: `The default value passed to createContext(defaultValue) is used exclusively when a consumer is rendered outside of a Provider:

    // ThemeContext.ts
    export const ThemeContext = createContext('light') // 'light' is defaultValue

If a component calls useContext(ThemeContext) without any <ThemeContext.Provider> above it in the tree, it receives 'light'.

Passing value={undefined} or value={null} to a Provider will NOT trigger the default value; the consumer will receive undefined or null.`,
    explanation: `The default value is a fallback for components rendered without a Provider in their ancestor tree, which is particularly helpful for isolated unit tests.`,
    hints: ['Is the default value used when a Provider is missing or when a Provider passes null?'],
    tags: ['react', 'context', 'createContext', 'defaults'],
  },
  {
    id: 'split-context-performance',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is splitting independent application concerns into multiple focused contexts (e.g. ThemeContext and AuthContext) recommended over a single global AppContext?',
    options: [
      'Because changing one piece of state in a combined context forces all components consuming any part of that context to re-render',
      'React enforces a strict limit of 1 property per context object',
      'Combined context objects cannot be inspected in React DevTools',
      'Combining contexts breaks TypeScript type inference',
    ],
    correctOption: 0,
    answerInFull: `In React Context, consumers re-render whenever the Provider's value reference changes:

If you put both theme and user in one context:

    <AppContext.Provider value={{ theme, user }}>

Whenever user logs in or out, the value object changes. Every component consuming AppContext—even a button that only cares about theme—will be forced to re-render!

Splitting into ThemeContext and AuthContext ensures that theme updates only re-render theme consumers.`,
    explanation: `Separating contexts isolates updates so consumers only re-render when the specific data they care about changes.`,
    hints: ['If one value changes in an object, does the object reference change?'],
    tags: ['react', 'context', 'performance', 'optimization'],
  },
  {
    id: 'memoize-context-value',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is it best practice to wrap an object value passed to a Context Provider in useMemo?',
    options: [
      'To prevent creating a new object reference on every parent re-render, which would trigger accidental re-renders in all context consumers',
      'Because React throws a TypeError if an unmemoized object is passed to value',
      'To automatically encrypt the context object before transmitting it over HTTP',
      'To allow the context object to be stored in browser sessionStorage',
    ],
    correctOption: 0,
    answerInFull: `Without useMemo, an inline object literal creates a brand new object in memory every time the provider's parent component renders:

    // BAD: New object reference created on every render of AuthProvider
    <AuthContext.Provider value={{ user, login, logout }}>

Even if user has not changed, the new object reference makes React think the context value changed, forcing all consumers to re-render.

Wrapping the value in useMemo prevents this:

    const value = useMemo(() => ({ user, login, logout }), [user])
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>`,
    explanation: `useMemo preserves the object reference across renders unless its dependencies change, preventing spurious consumer re-renders.`,
    hints: ['What happens to { user, login } reference equality on every render of the provider?'],
    tags: ['react', 'context', 'usememo', 'performance'],
  },
  {
    id: 'custom-hook-context-guard',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the primary benefit of wrapping a useContext call inside a custom hook like useAuth()?',
    options: [
      'It encapsulates the context consumption and throws an immediate, helpful error if a developer renders the component outside an AuthProvider',
      "It allows the component to bypass React's Rules of Hooks",
      'It automatically caches all API responses in localStorage',
      'It converts synchronous state updates into background Web Workers',
    ],
    correctOption: 0,
    answerInFull: `A custom hook provides a safe, ergonomic boundary around context:

    export function useAuth() {
      const context = useContext(AuthContext)
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
      }
      return context
    }

Benefits:
1. Consumer components import useAuth() without needing to import both useContext and AuthContext.
2. If a developer forgets to wrap a component in <AuthProvider>, they get an explicit, descriptive error immediately rather than mysterious null pointer bugs.`,
    explanation: `Custom context hooks provide clean API ergonomics and fail fast with clear error messages when used outside their provider.`,
    hints: ['What happens if someone forgets to put <AuthProvider> at the root and uses the hook?'],
    tags: ['react', 'custom-hooks', 'usecontext', 'patterns'],
  },
  {
    id: 'appropriate-context-use-cases',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which of the following application features is the most appropriate use case for React Context?',
    options: [
      'Application-wide theme toggling (light/dark mode) and authenticated user profile session',
      'Managing high-frequency keystrokes inside an individual text input field',
      'Storing temporary local validation error messages for a single login form',
      'Buffering 60-frame-per-second canvas animation coordinates',
    ],
    correctOption: 0,
    answerInFull: `React Context is designed for data that is genuinely global and accessed across many disparate components:

Appropriate use cases:
- Current theme (light vs dark mode)
- Authenticated user account and permissions
- Preferred language / internationalization (i18n)
- Router state

Inappropriate use cases:
- High-frequency updates (e.g. keystrokes, mouse coordinates, audio waveforms) because re-rendering entire subtrees causes performance lag.
- Local component state (e.g. single form input errors), which belongs in useState.`,
    explanation: `Context is best suited for low-frequency, globally needed information like themes, auth, and locale. High-frequency or local state causes performance degradation.`,
    hints: ['Which of these represents low-frequency global settings shared across many pages?'],
    tags: ['react', 'context', 'architecture', 'best-practices'],
  },
]
