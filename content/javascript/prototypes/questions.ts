import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-the-chain',
    type: 'concept',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What is the prototype chain, and what happens when you read a property?',
    answerInFull: `Every object has an internal link to another object, its prototype, or to null. Reading a property checks the object's own properties first; if it is not there, the lookup follows the link and checks that object, and so on until it finds the property or reaches null, at which point the result is undefined.

Two things people miss:
- Writing does not walk the chain. Assigning creates an own property on the object itself, shadowing whatever was inherited.
- Methods are not copied onto instances. They live on the prototype and are found by lookup, which is why adding a method to a prototype affects objects that already exist.`,
    explanation: `Reading walks the chain and writing does not is the asymmetry worth stating explicitly. It explains shadowing, why mutating an inherited array is shared while assigning one is not, and why monkey patching a built-in prototype works retroactively.`,
    hints: ['What happens when the property is not found on the object itself?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'shadowing-output',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const parent = { greeting: 'hello' }
const child = Object.create(parent)

console.log(child.greeting)
child.greeting = 'hi'
console.log(child.greeting, parent.greeting)
delete child.greeting
console.log(child.greeting)`,
    answerInFull: `hello
hi hello
hello`,
    explanation: `The assignment does not reach up the chain. It creates an own property on child that shadows the inherited one, leaving parent untouched. Deleting the own property removes the shadow, so the inherited value becomes visible again.

This is why deleting a property can appear to restore an old value rather than produce undefined.`,
    hints: ['Does assignment modify the prototype or the object?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'class-is-sugar',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt: 'Is `class` in JavaScript just syntax over prototypes? Be precise.',
    answerInFull: `Mostly, but not entirely. Methods declared in a class body go on the prototype and instances inherit them by lookup, exactly as with constructor functions, and extends sets up the prototype link.

The differences that are not sugar:
- Class bodies are always strict mode.
- A class cannot be called without new; it throws.
- Class declarations are not hoisted in a usable way; they sit in the temporal dead zone.
- Class methods are non-enumerable, so they do not appear in for...in.
- Private fields with # are genuinely inaccessible, not merely conventional.
- super works through a proper reference, which is awkward to replicate by hand.`,
    explanation: `Saying "just sugar" is the answer that gets probed. The honest version is that the inheritance mechanism is the same, but the class form adds real semantics that constructor functions do not have.`,
    hints: [],
    tags: ['objects', 'prototype', 'classes'],
  },
  {
    id: 'proto-vs-prototype',
    type: 'concept',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What is the difference between `__proto__` and `prototype`?',
    answerInFull: `prototype is a property on constructor functions. It is the object that instances created with new will link to. Ordinary objects do not have it.

__proto__ is the link itself, present on every object, pointing at whatever that object inherits from. It is the legacy accessor for the internal slot; the modern equivalents are Object.getPrototypeOf and Object.setPrototypeOf.

So for a constructor Dog:

  const d = new Dog()
  Object.getPrototypeOf(d) === Dog.prototype // true
  d.prototype // undefined`,
    explanation: `The naming is genuinely bad, and stating the relationship as an equation is the clearest way to answer. Dog.prototype is not Dog's prototype; it is the prototype Dog gives to its instances.`,
    hints: ['Which of the two exists on an instance, and which on the constructor?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'hasownproperty',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt:
      "This function is meant to list an object's own keys, but it includes inherited ones. What is wrong and how would you fix it?",
    code: `function ownKeys(obj) {
  const keys = []
  for (const key in obj) {
    keys.push(key)
  }
  return keys
}`,
    answerInFull: `for...in walks the whole prototype chain and yields every enumerable string key it finds, not only own ones.

Fixes, best first:

  return Object.keys(obj)

or, if for...in is required:

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) keys.push(key)
  }

Object.hasOwn is safer than obj.hasOwnProperty(key), which breaks on objects created with Object.create(null) and on objects that define their own hasOwnProperty.`,
    explanation: `The reason Object.hasOwn exists at all is exactly that second failure mode. Data parsed from JSON can carry a hasOwnProperty key, and calling it as a method then throws or lies.`,
    hints: ['What does for...in iterate over?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'method-lookup-output',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `class Animal {
  speak() {
    return 'generic noise'
  }
}

class Dog extends Animal {
  speak() {
    return 'woof'
  }
}

const d = new Dog()
console.log(d.speak())

delete Dog.prototype.speak
console.log(d.speak())

console.log(Object.hasOwn(d, 'speak'))`,
    answerInFull: `woof
generic noise
false`,
    explanation: `The instance has no speak of its own. The lookup finds Dog.prototype.speak first, and once that is deleted it continues to Animal.prototype.speak. Nothing about the instance changed at any point, which is why hasOwn is false throughout.

This also demonstrates that method resolution happens at call time, not when the object is created.`,
    hints: [
      'Where does speak actually live?',
      'What does the lookup do once the first match is gone?',
    ],
    tags: ['objects', 'prototype', 'classes'],
  },
  {
    id: 'object-create-null',
    type: 'scenario',
    form: 'open',
    difficulty: 'hard',
    prompt: 'When would you use Object.create(null), and what breaks if you do?',
    answerInFull: `Use it when the object is a pure dictionary with keys you do not control, typically from user input or JSON. With no prototype there is nothing to inherit, so a key called toString or constructor cannot collide with an inherited member, and prototype pollution has nothing to pollute.

What breaks: every Object.prototype method. No toString, so string coercion throws. No hasOwnProperty, so you need Object.hasOwn or Object.prototype.hasOwnProperty.call. Console output looks unusual, and some libraries assume a normal prototype.

A Map is usually the better answer for a dictionary, because it accepts any key type and has a proper API.`,
    explanation: `The prototype pollution angle is what makes this a real question rather than trivia. It is the mechanism behind a whole class of vulnerabilities in code that merges untrusted objects.`,
    hints: [],
    tags: ['objects', 'prototype', 'performance'],
  },
  {
    id: 'implement-instanceof',
    type: 'coding',
    form: 'open',
    difficulty: 'hard',
    prompt: 'Implement instanceof yourself.',
    answerInFull: `function myInstanceOf(value, Constructor) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false
  }

  const target = Constructor.prototype
  let current = Object.getPrototypeOf(value)

  while (current !== null) {
    if (current === target) return true
    current = Object.getPrototypeOf(current)
  }

  return false
}`,
    explanation: `instanceof is exactly a walk up the prototype chain looking for the constructor's prototype object, which is why it can be fooled by reassigning Constructor.prototype and why it fails across realms such as iframes.

The primitive guard at the top matters, because primitives have prototypes conceptually but instanceof is always false for them.`,
    hints: ['What is instanceof actually comparing?', 'What should it do for a primitive?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'class-methods-live-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Where does a method declared in a class body actually live?',
    options: [
      'On the constructor prototype, shared by every instance',
      'On each instance, copied in by the constructor',
      'On the constructor function itself',
      'In a private table the engine keeps separately',
    ],
    correctOption: 0,
    answerInFull:
      'class is syntax over prototypes. Methods go on Constructor.prototype and are found by lookup through the chain, which is why a thousand instances cost one copy of each method. Fields declared in the class body are the exception: those are per instance.',
    hints: [],
    tags: ['prototypes', 'classes'],
  },
  {
    id: 'object-create-null-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What is different about an object made with Object.create(null)?',
    options: [
      'It has no prototype, so it inherits nothing, not even toString',
      'It is frozen and cannot take new properties',
      'It is the same as {} but faster to create',
      'Its prototype is Object.prototype, set explicitly',
    ],
    correctOption: 0,
    answerInFull:
      'Its chain terminates immediately. That makes it the honest choice for a dictionary keyed by arbitrary strings, because no key can collide with an inherited member, and a check like map.hasOwnProperty(key) has to become Object.prototype.hasOwnProperty.call(map, key).',
    hints: [],
    tags: ['prototypes'],
  },
  {
    id: 'instanceof-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does `a instanceof B` actually test?',
    options: [
      'Whether B.prototype appears anywhere in the prototype chain of a',
      'Whether a was created by calling B',
      'Whether a and B have the same constructor property',
      'Whether a has every property that B.prototype has',
    ],
    correctOption: 0,
    answerInFull:
      'It walks the chain looking for that one object. Nothing records which constructor made a value, which is why reassigning a prototype changes instanceof retroactively, and why the check fails across realms such as an iframe where Array.prototype is a different object.',
    hints: [],
    tags: ['prototypes'],
  },
]
