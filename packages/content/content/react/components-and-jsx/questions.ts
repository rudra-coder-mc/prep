import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'jsx-compilation-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What does the JSX expression <button className="active">Click</button> compile to before executing in a JavaScript engine?',
    options: [
      'A call to the JSX runtime function passing the tag string, props object, and children',
      'A call to document.createElement("button") with attributes set directly on the DOM node',
      'An HTML template string that React assigns to innerHTML during the commit phase',
      'A class instance extending React.Component instantiated with the button properties',
    ],
    correctOption: 0,
    answerInFull: `JSX is syntax sugar for function calls.

Under modern React JSX transforms, compilers like Babel or SWC compile JSX elements into function calls provided by the runtime.

    // JSX
    const element = <button className="active">Click</button>

    // Compiled output
    import { jsx as _jsx } from 'react/jsx-runtime'
    const element = _jsx('button', {
      className: 'active',
      children: 'Click',
    })

This function returns a plain JavaScript object called a React element. It does not create or mutate a real browser DOM node at compilation or execution time.`,
    explanation: `document.createElement is only invoked much later by ReactDOM during the commit phase if reconciliation decides a real node must be inserted.

JSX is never evaluated as an HTML string inserted through innerHTML.

Function components and JSX elements do not create class instances.`,
    hints: [
      'Does the browser understand JSX natively, or does a build step turn it into standard JavaScript?',
    ],
    tags: ['react', 'jsx', 'compiler'],
  },
  {
    id: 'component-capitalization-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why must custom React component names begin with a capital letter when written in JSX tags like <Profile /> rather than <profile />?',
    options: [
      'The JSX transform treats lowercase tags as built-in HTML string names and uppercase tags as component identifiers',
      'JavaScript strict mode forbids lowercase function names when using arrow functions',
      'React uses the uppercase initial letter to register the component as a browser Web Component',
      'Lowercase tags are reserved exclusively for asynchronous Server Actions in Next.js',
    ],
    correctOption: 0,
    answerInFull: `The JSX compiler distinguishes between built-in HTML elements and custom components using capitalization.

When the tag starts with a lowercase letter, such as <div />, the compiler passes the tag name as a string literal:

    _jsx('div', { ... })

When the tag starts with an uppercase letter, such as <Profile />, the compiler treats it as a JavaScript variable identifier in scope:

    _jsx(Profile, { ... })

If you named your component profile in lowercase, React would look for a native HTML element called <profile> instead of invoking your component function.`,
    explanation: `JavaScript syntax itself places no naming restrictions based on capitalization.

React components are standard functions, not native Web Components.

Lowercase tags are not related to Server Actions.`,
    hints: ['What does the compiler pass as the first argument to the JSX runtime function?'],
    tags: ['react', 'jsx', 'components'],
  },
  {
    id: 'single-root-fragment-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does a React component require adjacent sibling elements to be wrapped in a single parent tag or a Fragment (<>...</>)?',
    options: [
      'JSX tags compile to function calls, and a JavaScript function cannot return multiple values without an enclosing container',
      'The browser DOM specification forbids having more than one child element inside any container',
      'React needs an extra div in the real DOM to attach its synthetic event listeners',
      'CSS flexbox and grid layouts fail if a component outputs more than one root element',
    ],
    correctOption: 0,
    answerInFull: `Because JSX compiles into normal JavaScript function calls.

Returning two adjacent tags without a wrapper would be equivalent to writing:

    return _jsx('h1', null), _jsx('p', null) // Invalid return syntax

A function can only return a single expression. Wrapping elements in a Fragment (<>...</>) allows the function to return one Fragment element that contains both children as an array in props.children, without rendering an unnecessary wrapper node in the browser DOM.`,
    explanation: `The browser DOM allows any element to have as many children as desired.

Fragments deliberately avoid adding extra DOM nodes; they do not insert a wrapper div.

CSS layout rules are independent of React language constraints.`,
    hints: [
      'What is the JavaScript limitation on what a function can return in a return statement?',
    ],
    tags: ['react', 'jsx', 'fragments'],
  },
  {
    id: 'element-vs-dom-node-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is a React element returned by a component function?',
    options: [
      'A lightweight, immutable plain JavaScript object describing a desired piece of UI',
      'A live browser DOM node instantiated in memory with document.createElement',
      'A reference pointer to a fiber node stored in WebAssembly memory',
      'An instance of an EventEmitter that dispatches browser click events',
    ],
    correctOption: 0,
    answerInFull: `A React element is a plain JavaScript object describing what should appear on screen.

    {
      $$typeof: Symbol.for('react.element'),
      type: 'button',
      props: { className: 'primary', children: 'Click' }
    }

It is cheap to create and holds no live DOM state, geometry, or listeners. React uses these descriptor objects to compare the new UI description with the previous one during reconciliation, and only mutates the real DOM where changes exist.`,
    explanation: `Live DOM nodes are heavy browser objects with styles, geometry, and layout properties.

React elements are ordinary JS objects, not WebAssembly pointers or EventEmitters.`,
    hints: ['Is a React element a live browser node or a descriptor object?'],
    tags: ['react', 'vdom', 'elements'],
  },
  {
    id: 'props-mutability-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A junior developer writes this component to format incoming text. What is the fundamental bug?',
    code: `function Header(props) {
  props.title = props.title.trim().toUpperCase()
  return <h1>{props.title}</h1>
}`,
    options: [
      'It mutates the incoming props object directly, violating the rule that props are read-only',
      'It uses the trim and toUpperCase string methods, which are illegal in JSX expressions',
      'It returns an <h1> element without declaring a key prop',
      'It fails to invoke useState before reading props',
    ],
    correctOption: 0,
    answerInFull: `Props are strictly read-only snapshots owned by the parent component.

Mutating props.title mutates the object passed by the parent. If another component reads that same props reference, or if the parent re-renders, the data is corrupted outside React's knowledge, breaking unidirectional data flow.

The correct fix is to compute a local variable or derive the value:

    function Header({ title }) {
      const formattedTitle = title.trim().toUpperCase()
      return <h1>{formattedTitle}</h1>
    }`,
    explanation: `trim and toUpperCase are standard JavaScript methods and work anywhere in JavaScript.

Key props are only needed when rendering items in an array, not single elements.

Stateless components do not need useState to read props.`,
    hints: ['Can a child component change the props that were passed down to it?'],
    tags: ['react', 'props', 'immutability'],
  },
  {
    id: 'component-purity-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does React StrictMode invoke component render functions twice during local development?',
    options: [
      'To expose accidental side effects during rendering by checking for inconsistent output',
      'To compile the component bytecode into WebAssembly for production performance',
      'To verify that server-side HTML matches client-side rendered HTML',
      'To test whether the browser has sufficient memory to handle double buffering',
    ],
    correctOption: 0,
    answerInFull: `Component rendering must be a pure calculation with no side effects.

If a component modifies an external variable or performs a side effect during rendering, calling it twice produces different outputs or incorrect state. StrictMode double-invokes component functions in development to intentionally surface these impure mutations before they cause bugs in production.

In production mode, React invokes the component only once.`,
    explanation: `React does not compile components to WebAssembly.

Hydration mismatches are detected during initial mount comparison, not by double-invoking render.

Memory testing is not the purpose of StrictMode.`,
    hints: ['What kind of functions does React require components to be?'],
    tags: ['react', 'strict-mode', 'purity'],
  },
  {
    id: 'render-pipeline-order',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt: 'Put the steps of an initial React component mount into chronological execution order.',
    items: [
      'React calls the component function to obtain the element tree',
      'React calculates the required DOM mutations by inspecting the elements',
      'React mutates the browser DOM to insert the real nodes',
      'The browser paints the updated DOM tree to the screen',
      'The component mutates its props in place before rendering',
      'React writes raw HTML strings into document.write',
    ],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `The initial mount follows trigger, render, commit, and paint.

First, React calls the component function (Render phase) to receive the JSX element tree.

Second, React reconciles and prepares the instructions for DOM creation.

Third, React mutates the real DOM using DOM APIs like appendChild (Commit phase).

Fourth, the browser recalculates layout and paints the pixels to the screen.

Props are never mutated, and document.write is never used by React.`,
    explanation: `Props are read-only and must never be mutated. React does not use document.write.`,
    hints: ['Which happens first: calling the function, updating the DOM, or painting?'],
    tags: ['react', 'lifecycle', 'rendering'],
  },
  {
    id: 'conditional-rendering-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Given this component, what renders on screen when the items prop is an empty array []?',
    code: `function ItemCount({ items }) {
  return (
    <div>
      {items.length && <p>You have items!</p>}
    </div>
  )
}`,
    options: [
      'The number 0 appears inside the div',
      'Nothing renders inside the div (it is completely empty)',
      'A runtime error is thrown because length is zero',
      'The paragraph with text "You have items!" renders',
    ],
    correctOption: 0,
    answerInFull: `The number 0 renders on the screen.

In JavaScript, the logical AND operator (&&) returns the left operand if it is falsy, without evaluating the right operand:

    0 && <p>You have items!</p> // evaluates to 0

React does not render false, null, or undefined to the DOM, but it does render numbers. Since 0 is a number, React renders the digit 0 into the DOM.

To conditionally render only when items exist, convert the length to a boolean:

    {items.length > 0 && <p>You have items!</p>}
    // or
    {Boolean(items.length) && <p>You have items!</p>}`,
    explanation: `Because 0 is a number, React treats it as valid renderable content rather than skipping it like null or false.

No error is thrown on reading the length of an empty array.`,
    hints: [
      'What does 0 && <Component /> evaluate to in JavaScript, and does React render the number 0?',
    ],
    tags: ['react', 'jsx', 'conditionals'],
  },
  {
    id: 'children-composition-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'You need a generic Card component that can wrap arbitrary nested content without knowing its structure in advance. Which implementation is the idiomatic React solution?',
    options: [
      'function Card({ children }) { return <div className="card">{children}</div> }',
      'function Card({ htmlContent }) { return <div className="card" dangerouslySetInnerHTML={{ __html: htmlContent }} /> }',
      'function Card() { const content = document.querySelector(".card-body"); return <div className="card">{content}</div> }',
      'function Card(props) { return <div className="card">{props.render()}</div> } with required render prop',
    ],
    correctOption: 0,
    answerInFull: `Using the children prop is React's built-in composition pattern.

    function Card({ children }) {
      return <div className="card">{children}</div>
    }

When users render <Card><p>Hello</p></Card>, React automatically passes everything between the tags as props.children. The Card component does not need to inspect or know the child structure.`,
    explanation: `dangerouslySetInnerHTML is vulnerable to XSS and bypasses React elements entirely.

Querying the DOM directly with querySelector violates declarative rendering.

Render props are useful for sharing state logic, but plain children composition is standard for UI wrapping.`,
    hints: ['What prop does React pass automatically for nested JSX content?'],
    tags: ['react', 'composition', 'children'],
  },
  {
    id: 'explain-props-vs-state-interview',
    type: 'interview',
    form: 'open',
    tier: 'swe-1',
    prompt:
      'An interviewer asks: "What is the key difference between props and state in React, and how do you decide which one to use?" How would you structure your answer?',
    answerInFull: `Structure the answer around ownership, mutability, and purpose:

1. Definition & Ownership:
Props are inputs passed down from a parent component to a child. The parent owns props, and from the child's perspective, they are read-only.
State is internal data managed and owned by the component itself using useState.

2. Mutability:
Props cannot be modified by the component that receives them. To change a prop, the parent must pass a new value on re-render.
State is updated by calling its setter function, which schedules a re-render of the component and its children.

3. Decision Rule:
Ask whether the data changes over time due to user interaction or events inside this component. If yes, it is state. If the data is passed in and fixed from the perspective of this component, or if it can be computed from existing props or state, it should not be new state.`,
    explanation: `Avoid saying state is global or props are local, as state is component-local by default. Always emphasize that props are immutable snapshots to the receiver.`,
    hints: ['Think in terms of who owns the data and who is allowed to change it.'],
    tags: ['react', 'interview', 'props', 'state'],
  },
  {
    id: 'prop-drilling-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A deep child component needs a user theme setting. The setting is passed down through five intermediate layout components that never use it themselves. What is this issue called, and what is the best initial refactor?',
    options: [
      'Prop drilling; resolve it using React Context or component composition (passing children/slots)',
      'Event bubbling; resolve it by calling event.stopPropagation in every child',
      'Memory leak; resolve it by storing the theme in a global mutable variable on window',
      'Hydration failure; resolve it by converting all five intermediate components into class components',
    ],
    correctOption: 0,
    answerInFull: `This is called prop drilling.

Passing props through several intermediate layers that do not need the data creates tight coupling: changing a prop name requires updating every intermediate component.

Two idiomatic solutions exist:
1. Component composition: pass the leaf component directly via children or a prop slot to avoid passing data through intermediaries.
2. React Context: when the data is truly global across different branches of the tree (like themes or authentication), createContext and useContext allow consumers to read the value directly.`,
    explanation: `Event bubbling is for DOM events, not prop passing.

Window global variables bypass React re-rendering and lead to stale UIs.

Class components do not resolve prop drilling.`,
    hints: ['What pattern avoids passing props down multiple intermediate container layers?'],
    tags: ['react', 'architecture', 'context'],
  },
]
