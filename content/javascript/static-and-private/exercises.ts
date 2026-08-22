import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'three-ways-private',
    title: 'Private state three ways',
    difficulty: 'medium',
    prompt:
      'Write the same Counter with a hidden count and increment and value methods three times: with a #private field, with a module-scope WeakMap keyed by instance, and as a factory function using closures. Then compare them.',
    requirements: [
      'For each version, assert that Object.keys, JSON.stringify and Object.getOwnPropertyNames reveal nothing about the count.',
      'Show that the WeakMap and closure versions let a subclass or a wrapper reach the state if the map or the variables are exported, and that the # version cannot be reached by any means from outside. Say in a comment which is the only one that guarantees it.',
      'Wrap an instance of each in new Proxy(instance, {}) and call increment through the proxy. Record which versions throw and explain why in a comment.',
      'Create 10,000 instances of each and compare memory or the number of function objects created, and say which version pays per instance.',
    ],
  },
  {
    id: 'registry-with-statics',
    title: 'A registry of subclasses built with statics',
    difficulty: 'medium',
    prompt:
      'Write a Shape base class with a static registry, a static block that initialises it, a static register(name, ctor) and a static create(name, ...args) that builds the right subclass, then add Circle and Square.',
    requirements: [
      'The registry is a private static, and nothing outside the class can read or replace it. Show an attempt that fails.',
      'create uses the registry and does not name any subclass. Show that Shape.create("circle", 2) is an instance of Circle.',
      'Each subclass registers itself in its own static block. Say in a comment when that block runs relative to the first call to create.',
      'Detach create into a plain variable and call it, observe what happens to this, and fix it so the detached call works.',
    ],
  },
]
