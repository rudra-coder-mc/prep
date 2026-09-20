import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'build-composable-card',
    title: 'Build a composable card component with children and slots',
    difficulty: 'easy',
    prompt:
      'Construct a reusable Card component suite in React that accepts children for its main body and optional slots for header and footer actions, avoiding hardcoded markup.',
    requirements: [
      'Export a Card root component that accepts children and renders a styled container without adding extraneous DOM wrapper nodes.',
      'Allow custom header and footer content to be passed either as dedicated sub-components (Card.Header, Card.Footer) or as explicit JSX props.',
      'Demonstrate that Card accepts arbitrary nested JSX (buttons, text, images) without requiring type-specific rendering logic.',
      'Ensure props are never mutated inside the component, and default props are handled cleanly with JavaScript default parameter values.',
    ],
  },
  {
    id: 'isolate-render-impurities',
    title: 'Isolate render impurities into pure component functions',
    difficulty: 'medium',
    prompt:
      'Given a component that mutates external variables and writes to the DOM during rendering, refactor it into a strictly pure component whose rendering is completely deterministic.',
    requirements: [
      'Remove all mutations to module-scope variables from the component render body.',
      'Ensure that calling the component function twice in succession with identical props returns structurally identical React elements.',
      'Move any side effects (such as logging or document title updates) out of the render body and into dedicated event handlers or effects.',
      'Add a test or assertion proving that React StrictMode double-rendering produces no side effects or numbering drifts.',
    ],
  },
]
