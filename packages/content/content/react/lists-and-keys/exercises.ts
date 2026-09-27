import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'sortable-todo-list-keys',
    title: 'Maintain input state across sorting using stable keys',
    difficulty: 'easy',
    prompt:
      'Build an interactive task list where users can sort tasks alphabetically or reverse-chronologically, ensuring checkbox and text input states stick to the correct items using stable keys.',
    requirements: [
      'Render a dynamic list of todo items from state using Array.prototype.map().',
      'Provide each item with an uncontrolled or controlled input/checkbox and a unique stable ID key.',
      'Add controls to sort the items and delete items from the beginning or middle of the list.',
      'Verify that deleting or sorting items preserves the correct checked/input state for remaining items.',
    ],
  },
  {
    id: 'fragment-grouped-list',
    title: 'Render grouped multi-element items using keyed React.Fragment',
    difficulty: 'medium',
    prompt:
      'Construct an accessible description list (<dl>) of technical terms and definitions where each item yields multiple sibling tags (<dt> and <dd>) using keyed React.Fragment wrappers.',
    requirements: [
      'Transform an array of glossary objects into paired <dt> and <dd> elements using .map().',
      'Use explicit <React.Fragment key={item.id}> wrappers around the term/definition pairs without invalid intermediate <div> elements.',
      'Implement dynamic filtering by search keyword.',
      'Ensure no React key warnings or invalid HTML DOM nesting warnings are emitted in tests or console.',
    ],
  },
]
