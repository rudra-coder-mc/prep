import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Collections and the reconciliation engine',
    heading: 'Why this matters',
    script: `Virtually every web application presents dynamic collections:
      lists of products, comments, shopping carts, or notification feeds.

      In declarative React, you do not write imperative loops that append DOM
      elements one by one. Instead, you transform an array of data into an array
      of JSX elements using JavaScript's map function.

      However, rendering dynamic lists poses a special challenge for React's
      reconciliation engine. When items are inserted, deleted, or re-sorted,
      React needs a way to know which DOM elements to keep, which to move, and
      which to destroy.

      This is what the key prop is for. In entry-level technical interviews,
      interviewers routinely probe your understanding of keys, asking why array
      indices cause subtle bugs and how React uses keys to maintain component
      identity.`,
  },
  {
    title: 'Transforming data arrays into JSX',
    heading: 'Rendering lists with map()',
    script: `The standard way to render an array of items in React is using the
      array map method directly inside your JSX expression.

      For each item in the data array, the map callback returns a React element.

      Whenever you do this, React requires that the outermost JSX element
      returned by the callback has a key attribute. If you return a custom
      component, the key belongs on that custom component, not on whatever DOM
      tag is inside the component's internal markup.

      If each data item needs to produce multiple sibling elements, like a
      definition term and definition description pair, you cannot use the empty
      fragment shorthand because fragments with the shorthand syntax cannot take
      props. Instead, import React and render a full React dot Fragment with a key
      attribute attached.`,
  },
  {
    title: 'Giving elements a permanent identity',
    heading: 'The purpose of the key prop',
    script: `When a component re-renders, React compares the new element tree
      with the previous one. This comparison process is called reconciliation.

      Without keys, React has to guess element identities based purely on their
      order in the array. But when items are inserted at the beginning, filtered
      out, or rearranged, index order is meaningless.

      Keys give each element a permanent, stable identity.

      When React sees a key that existed on the previous render, it reuses the
      existing DOM node and preserves the component's internal state, updating
      only the props that changed.

      When a key is missing from the new list, React cleanly unmounts that
      component and removes its DOM node. When a new key appears, React mounts a
      brand new component instance.`,
  },
  {
    title: 'The hidden bugs of array index keys',
    heading: 'Why array index as key causes bugs',
    script: `Many developers start out using the array index as the key just to
      make React's console warning disappear.

      While index keys seem to work for static lists, they cause severe bugs in
      dynamic lists that can be reordered, sorted, or deleted.

      Consider a list of todo items where each item has an input field or a
      checkbox. If you delete the very first item, the second item moves up to
      index zero.

      React looks at the new list and sees an element with key zero, just like
      before. React assumes the component at key zero never left, so it keeps the
      existing DOM node and preserves its internal input state.

      The text typed into the first item's input now appears attached to the
      second item. To the user, it looks like the wrong item was deleted or the
      data was corrupted.`,
  },
  {
    title: 'Rules for rock-solid keys',
    heading: 'Best practices for stable keys',
    script: `To keep your lists bug-free and performant, follow three core
      rules.

      First, keys must be unique among siblings in the same array. They do not
      need to be globally unique across your entire application.

      Second, keys must be stable across renders. Never generate keys on the fly
      during render using Math dot random or UUID generators. Generating random
      keys forces React to treat every item as brand new on every single render.
      This destroys existing DOM nodes, resets user state, and ruins
      performance.

      Third, always prefer natural identifiers from your data model, like
      database IDs. Only use the array index as a key if the list is strictly
      static, meaning it is never sorted, filtered, or mutated, and its items
      carry no internal state.`,
  },
]
