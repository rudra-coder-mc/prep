import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'refactor-to-composition',
    title: 'Unpick a three-level chain',
    difficulty: 'medium',
    prompt:
      'Start from class Store extends CachedStore extends HttpStore, where HttpStore fetches, CachedStore overrides fetch to memoise, and Store overrides it again to add retries. Rewrite it as one Store class composed from a fetcher, a cache and a retry policy.',
    requirements: [
      'Write the inheritance version first and a test that shows the bug: the retry wrapper retries the cached result, because the overrides compose in chain order and cannot be reordered.',
      'The composed version takes its three parts as constructor arguments and applies them in an order it controls. Show that swapping retry and cache is a one-line change.',
      'Test the composed Store with a fake fetcher that counts calls and a no-op cache, without any network and without a mocking library.',
      'Say in a comment what the composed version lost: name the one thing the chain gave for free that now needs code.',
    ],
  },
  {
    id: 'mixin-pipeline',
    title: 'Mixins and the order they apply in',
    difficulty: 'medium',
    prompt:
      'Write two class-returning mixins, Timestamped (adds createdAt and touch) and Validated (adds validate, which calls this.rules), apply them to a Base in both orders, and find out what depends on the order.',
    requirements: [
      'Print the prototype chain of an instance for each order and confirm the mixin applied last is nearest the instance.',
      'Give both mixins a describe method that calls super.describe() and appends its own name. Show the output differs between the two orders and say why.',
      'Show that instance instanceof Timestamped is false and write the brand check that works instead, using a Symbol or a private field inside the mixin.',
      'Replace one mixin with the Object.assign(prototype, methods) style and show that super no longer works inside it.',
    ],
  },
]
