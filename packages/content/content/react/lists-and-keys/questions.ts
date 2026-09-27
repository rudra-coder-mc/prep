import type { Question } from '@prep/core'

/**
 * Lists & Keys questions for React curriculum.
 */
export const questions: Question[] = [
  {
    id: 'why-keys-are-required-in-react-lists',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Why does React require keys when rendering lists of elements?',
    options: [
      'To give elements a stable identity across re-renders so React can match DOM nodes efficiently',
      'To automatically sort list items in alphabetical order in the DOM',
      'To bind CSS animations and transition lifecycles to each list item',
      'To generate unique HTML id attributes accessible via document.getElementById',
    ],
    correctOption: 0,
    answerInFull: `Keys give list elements a stable identity between re-renders.

Without keys, React falls back to comparing elements by their index. If an item is added to the beginning, inserted in the middle, or deleted, every subsequent element differs by index from the previous render, forcing React to re-render and mutate DOM nodes unnecessarily.

With keys, React reconciles children by matching old and new keys, moving existing DOM nodes rather than destroying and recreating them, and preserving the state of child components (such as form inputs).`,
    explanation: `Keys give elements persistent identity across renders, allowing React's diffing algorithm to preserve component state and perform minimal DOM mutations during list changes.`,
    hints: [
      'Think about how React decides whether a DOM node should be reused, moved, or recreated.',
    ],
    tags: ['react', 'lists', 'keys', 'reconciliation'],
  },
  {
    id: 'index-as-key-anti-pattern-bugs',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is using the array index as a key (e.g. key={index}) strongly discouraged when list items can be reordered, inserted, or removed?',
    options: [
      'It can cause component state bugs (e.g. uncontrolled input text persisting on the wrong row) and hurts reconciliation performance',
      'React throws a runtime error preventing any list with index keys from rendering',
      'Index keys corrupt the JavaScript garbage collector when items are spliced',
      'Using index keys prevents child components from receiving props updates',
    ],
    correctOption: 0,
    answerInFull: `Using array indices as keys creates subtle bugs and poor performance when list ordering changes.

1. **State persistence on wrong items**: Component state (like input focus, text entered into an uncontrolled input, or expand/collapse toggle) is associated with the item at that key index. If you delete item 0, item 1 becomes index 0, inheriting item 0's internal state.
2. **Performance degradation**: When an item is prepended or deleted from the front, every subsequent item gets a new index key. React sees completely different keys at every position and unnecessarily mutates or re-renders every item.

Indices are only acceptable if the list is completely static (never filtered, sorted, or mutated) and items have no local state.`,
    explanation: `Array indices tie component identity to position rather than data. If items are reordered or removed, state remains with the position instead of the data item.`,
    hints: [
      'What happens to the internal state of a child component when its index in the array changes?',
    ],
    tags: ['react', 'lists', 'keys', 'bugs'],
  },
  {
    id: 'where-key-must-be-placed-in-components',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'When extracting a list item into a separate component (e.g., <TodoItem ... />), where must the key prop be placed?',
    options: [
      'On the <TodoItem key={todo.id} /> element in the array map call',
      'On the root JSX element inside TodoItem’s own return statement (e.g. <li key={id}>)',
      'Both on the <TodoItem /> in the map call and on the root DOM element inside TodoItem',
      'Inside the props object passed down as props.key to the component function',
    ],
    correctOption: 0,
    answerInFull: `The key attribute must be placed directly on the element being returned in the array mapping context:

\`\`\`tsx
<ul>
  {todos.map((todo) => (
    <TodoItem key={todo.id} todo={todo} />
  ))}
</ul>
\`\`\`

Keys do not make sense inside the component definition itself because keys serve the surrounding array context. React uses keys to reconcile the elements inside the array where the mapping occurs, not inside the child component's template.`,
    explanation: `Keys are consumed by React during the reconciliation of array children, so they must always be declared in the context of the enclosing array map.`,
    hints: [
      'Where does React look for keys when comparing the children of a parent list container?',
    ],
    tags: ['react', 'lists', 'components', 'props'],
  },
  {
    id: 'key-prop-not-available-in-props',
    type: 'interview',
    form: 'open',
    tier: 'swe-1',
    prompt:
      'Can a child component access its own `key` via `props.key`? If you need the ID inside the child component, how do you provide it?',
    answerInFull: `No, React reserves both \`key\` and \`ref\` and does not pass them through to child components in \`props\`. If you attempt to access \`props.key\`, React will log a console warning and evaluate it as \`undefined\`.

If the child component needs that identifier for its own internal logic (e.g., in event handlers or API calls), you must pass it explicitly as a separate prop with a different name, such as \`id\`:

\`\`\`tsx
<TodoItem key={todo.id} id={todo.id} title={todo.title} />
\`\`\`

Inside \`TodoItem\`, you read \`props.id\`.`,
    explanation: `React uses 'key' internally for reconciliation and deliberately strips it from the props object passed down to the component.`,
    hints: [
      'React treats key and ref specially, stripping them from props.',
      'How would you pass the identifier under a non-reserved prop name?',
    ],
    tags: ['react', 'lists', 'props', 'keys'],
  },
  {
    id: 'fragment-syntax-with-keys',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'When you need to return multiple sibling elements for each item in a list without introducing wrapper <div>s, how do you attach a key?',
    options: [
      'Use the explicit <React.Fragment key={item.id}>...</React.Fragment> syntax',
      'Use shorthand fragment syntax with attribute: <<key={item.id}>...</>',
      'Wrap in an array: [item.dt, item.dd] and attach key to the first child element only',
      'React fragments cannot be keyed under any circumstances; you must render a DOM node like <div>',
    ],
    correctOption: 0,
    answerInFull: `The shorthand fragment syntax (<>...</>) cannot accept attributes or keys.

When rendering a list where each mapped item yields multiple elements (e.g., pairs of <dt> and <dd> inside a <dl>), you must use the explicit <React.Fragment> syntax to attach the key:

\`\`\`tsx
<dl>
  {items.map((item) => (
    <React.Fragment key={item.id}>
      <dt>{item.term}</dt>
      <dd>{item.description}</dd>
    </React.Fragment>
  ))}
</dl>
\`\`\`

\`key\` is currently the only prop that \`<React.Fragment>\` accepts.`,
    explanation: `Shorthand <> syntax does not support attributes. You must use <React.Fragment key={...}> when mapping fragments in a list.`,
    hints: ['Does the shorthand <>...</> syntax allow props or attributes?'],
    tags: ['react', 'fragments', 'keys', 'lists'],
  },
  {
    id: 'generating-random-keys-on-render-pitfall',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What happens if you generate keys on the fly during render, such as `key={Math.random()}` or `key={crypto.randomUUID()}`?',
    options: [
      'React sees brand new keys every render, tearing down and recreating DOM nodes and discarding component state',
      'React detects the non-deterministic key and caches the first generated value permanently',
      'The browser throws a Content Security Policy violation because randomUUID is forbidden in JSX',
      'React optimizes the list by switching to index-based reconciliation automatically',
    ],
    correctOption: 0,
    answerInFull: `Generating keys dynamically on every render completely defeats React's reconciliation algorithm:

1. **Complete DOM and state destruction**: On every single render, React sees completely new keys for every item in the list. It concludes that all previous items were deleted and entirely new items were created.
2. **Loss of state and focus**: All child component state (inputs, scrolling positions, focus, animations) is reset on every render.
3. **Severe performance degradation**: DOM nodes cannot be reused or updated; the browser must destroy and recreate all DOM elements on every render cycle.

Keys must be **stable**, **predictable**, and **unique among siblings**, derived from your data model (e.g., database IDs).`,
    explanation: `Generating random keys on render forces React to tear down and recreate the entire DOM subtree and discard component state on every render.`,
    hints: [
      'What does React do when a key is different from the key in the previous render?',
      'Does React know it is the same item if its key is randomly generated?',
    ],
    tags: ['react', 'keys', 'performance', 'antipatterns'],
  },
  {
    id: 'key-uniqueness-scope-rule',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Across what scope must React keys be unique?',
    options: [
      'Keys only need to be unique among sibling elements in the same array, not globally across the entire app',
      'Keys must be globally unique across the entire DOM tree in the application',
      'Keys must be unique across all arrays rendered by the same parent component',
      'Keys must be unique per session and never reused even after items are removed',
    ],
    correctOption: 0,
    answerInFull: `Keys only need to be unique among siblings within the specific array being rendered:

- Two different arrays (e.g., "Recently Viewed" and "Suggested Items") can safely render items with identical keys (like \`key="product-123"\`).
- Nested lists can reuse keys from parent lists as long as siblings in the same array have distinct keys.

React only compares keys within the same immediate list during reconciliation.`,
    explanation: `React evaluates keys strictly within sibling arrays during reconciliation; global uniqueness is not required.`,
    hints: ['Do two independent lists on the same page need different key spaces?'],
    tags: ['react', 'lists', 'keys', 'rules'],
  },
  {
    id: 'key-reset-component-state-technique',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Beyond list rendering, how can the key prop be intentionally used on an individual component to reset its internal state?',
    options: [
      'Changing the key prop (e.g. <ProfileForm key={userId} />) forces React to unmount the old instance and mount a fresh one with initial state',
      'The key prop triggers a browser window reload when changed',
      'Passing key="reset" tells React to execute the component\'s cleanup function without unmounting',
      'It cannot be used outside of lists; React throws an error if key is placed on a single component',
    ],
    correctOption: 0,
    answerInFull: `Keys can be used to control component identity for single components.

When an element's key changes between renders:

    <ProfileForm key={selectedUserId} />

React treats it as a completely different component. It unmounts the previous ProfileForm instance (clearing all its local state and running cleanup effects) and mounts a brand new instance with fresh initial state.

This is an idiomatic React pattern for resetting forms or subtrees when a selected entity changes, avoiding complex manual state-resetting useEffects.`,
    explanation: `Changing a component's key signals to React that the identity has changed, unmounting the old instance and mounting a new one with initial state.`,
    hints: ["What does React do when a component's key changes to a different value?"],
    tags: ['react', 'keys', 'state-reset', 'patterns'],
  },
]
