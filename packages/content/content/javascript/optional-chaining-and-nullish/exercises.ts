import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'merge-settings',
    title: 'Merge settings without losing a zero',
    difficulty: 'easy',
    prompt:
      'Write mergeSettings(defaults, overrides) where an override of 0, an empty string or false wins, an override of null or undefined falls back to the default, and one nested level of settings merges the same way.',
    requirements: [
      'Every top-level key in defaults appears in the result, whether or not overrides mentions it.',
      'Assert that { volume: 0 }, { name: "" } and { debug: false } each survive the merge as given.',
      'Assert that { volume: null } and { volume: undefined } both produce the default.',
      'A nested object in overrides merges key by key with the nested default rather than replacing it, and a nested null falls back to the whole nested default.',
    ],
  },
  {
    id: 'chain-audit',
    title: 'Decide which question marks belong',
    difficulty: 'medium',
    prompt:
      'Take a function that reads order?.customer?.address?.postcode?.trim?.() and rewrite it so ?. appears only where the value can legitimately be absent, given a data model where every order has a customer, a customer may have no address, and an address always has a postcode string.',
    requirements: [
      'For each ?. removed, say in a comment what bug it was hiding and what now throws instead.',
      'The rewrite returns undefined for an order with no address and throws for an order whose customer is missing.',
      'Supply a fallback for the missing-address case with ??, and show with one assertion why || would have been wrong if the postcode could be an empty string.',
      'Include three test orders covering complete, no address and malformed, and assert the result or the throw for each.',
    ],
  },
]
