import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-the-chain',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What happens when you read a property an object does not have?',
    options: [
      'It walks the prototype chain and throws a TypeError once it reaches the end without a match',
      'It walks the chain and returns the last match it finds, so the furthest prototype wins',
      'It walks the chain and returns undefined once it reaches the end without a match',
      'undefined, since a read looks only at own properties and an inherited one has to be reached through the prototype',
    ],
    correctOption: 2,
    answerInFull: `Every object has an internal link to another object, its prototype, or to null. Reading a property checks the object's own properties first; if it is not there, the lookup follows the link and checks that object, and so on until it finds the property or reaches null, at which point the result is undefined.

Two things people miss:
- Writing does not walk the chain. Assigning creates an own property on the object itself, shadowing whatever was inherited.
- Methods are not copied onto instances. They live on the prototype and are found by lookup, which is why adding a method to a prototype affects objects that already exist.

Reading walks and writing does not is the asymmetry worth stating out loud. It explains shadowing, why mutating an inherited array is shared while assigning one is not, and why monkey patching a built-in prototype works retroactively.`,
    explanation: `The TypeError is the answer from a language with declared shapes. Reading a property nobody defined is not an error here, which is why a typo in a property name is silent and a typo in a method name is a TypeError one line later, when undefined is called.

Returning the last match inverts the rule and would make inheritance useless: an override on the object itself would always lose to the thing it was overriding. First match wins, which is what makes a subclass method beat its parent's.

The last option describes a language where inheritance exists for methods and not for data. Nothing distinguishes the two here. A method is a property whose value happens to be a function, and it is found by exactly the same walk.`,
    hints: ['What happens when the property is not found on the object itself?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'shadowing-output',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const parent = { greeting: 'hello' }
const child = Object.create(parent)

console.log(child.greeting)
child.greeting = 'hi'
console.log(child.greeting, parent.greeting)
delete child.greeting
console.log(child.greeting)`,
    items: ['hi hi', 'hello', 'undefined', 'hi hello', 'hello'],
    correctOrder: [1, 3, 4],
    answerInFull: `hello, then hi hello, then hello

child has no own properties, so the first read follows the link to parent and finds hello there.

The assignment does not follow that link. A write always lands on the object itself, so it creates an own greeting on child that shadows the inherited one, and parent is untouched. That is why the second line reads hi from one object and hello from the other.

Deleting the own property removes only the shadow. The inherited value is still there and becomes visible again, which is why delete can appear to restore an old value rather than produce undefined.

The rule underneath all three lines is that reading walks the chain and writing does not.`,
    explanation: `"hi hi" is the pool's version of a write that walks. If assignment followed the link and updated wherever the property was found, every object sharing a prototype would overwrite the others, and Object.create would be useless for defaults.

"undefined" is what most people expect from the last line, because deleting a property normally leaves nothing behind. Here it leaves what was always underneath it. Only the own property existed to be deleted.

Nothing in this reaches parent at any point after the first line, which is the fact to say out loud: two of the three lines are about an object that was never modified.`,
    hints: ['Does assignment modify the prototype or the object?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'class-is-sugar',
    type: 'interview',
    form: 'open',
    tier: 'staff',
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
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Given const d = new Dog(), which of these is true?',
    options: [
      'd.prototype === Dog.prototype',
      'Object.getPrototypeOf(d) === Dog.prototype',
      'Object.getPrototypeOf(Dog) === Dog.prototype',
      'd.__proto__ === Dog',
    ],
    correctOption: 1,
    answerInFull: `Object.getPrototypeOf(d) === Dog.prototype.

prototype is a property on constructor functions. It is the object that instances created with new will link to. Ordinary objects do not have it, so d.prototype is undefined.

The link itself is on every object, and Object.getPrototypeOf is how you read it. __proto__ is the legacy accessor for the same internal slot, and Object.setPrototypeOf is the writer.

  const d = new Dog()
  Object.getPrototypeOf(d) === Dog.prototype // true
  d.prototype // undefined

The naming is genuinely bad, and stating the relationship as an equation is the clearest way to answer it. Dog.prototype is not Dog's prototype. It is the prototype Dog hands out to its instances.`,
    explanation: `d.prototype is the mistake the name invites, and it is undefined rather than an error, so the code that depends on it fails somewhere else entirely.

Object.getPrototypeOf(Dog) asks what Dog itself inherits from, which is a different question with a real answer: Function.prototype for a base class, and the parent class for one written with extends. Never its own prototype property.

d.__proto__ === Dog swaps the two sides. The instance links to Dog.prototype, not to Dog, and the difference is exactly what the prototype property exists for.`,
    hints: ['Which of the two exists on an instance, and which on the constructor?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'hasownproperty',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      "This is meant to list an object's own keys and includes inherited ones. Which fix is right, and safe on any object?",
    code: `function ownKeys(obj) {
  const keys = []
  for (const key in obj) {
    keys.push(key)
  }
  return keys
}`,
    options: [
      'Guard the loop with obj.hasOwnProperty(key)',
      'Return Object.keys(obj), which is the own enumerable string keys and nothing inherited',
      'Use for...of over the object instead, which visits only own properties',
      'Guard the loop with key in obj, which is true only for an own property',
    ],
    correctOption: 1,
    answerInFull: `for...in walks the whole prototype chain and yields every enumerable string key it finds, not only the own ones.

  return Object.keys(obj)

That is the fix: it is own enumerable string keys by definition, so there is nothing to guard.

If for...in is required for some other reason, guard it with Object.hasOwn:

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) keys.push(key)
  }

Object.hasOwn is safer than obj.hasOwnProperty(key), which breaks on objects created with Object.create(null) and on objects that carry their own hasOwnProperty. Data parsed from JSON can carry exactly that key, and then calling it as a method either throws or lies.`,
    explanation: `hasOwnProperty as a method is the fix everybody writes and the reason Object.hasOwn was added. It works until the object has no prototype, or until it came from JSON that happened to contain a hasOwnProperty key, at which point you are calling whatever the untrusted data put there.

for...of over a plain object throws: an object is not iterable unless it declares Symbol.iterator. That is a real difference between the two loops and the reason for...in survives at all.

in is the guard that looks right and does nothing. It answers the same question the loop already answered, walking the chain exactly the same way, so every inherited key passes it.`,
    hints: ['What does for...in iterate over?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'method-lookup-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
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
    options: [
      'woof, woof, false',
      'woof, TypeError: d.speak is not a function, false',
      'woof, generic noise, false',
      'woof, generic noise, true',
    ],
    correctOption: 2,
    answerInFull: `woof, generic noise, false

The instance has no speak of its own. The lookup finds Dog.prototype.speak first, and once that has been deleted it carries on up to Animal.prototype.speak. Nothing about the instance changed at any point, which is why hasOwn is false throughout.

The fact this really demonstrates is that method resolution happens at call time rather than when the object is created. The instance holds a link, not a copy, so changing what is at the other end of the link changes what the instance does, including for objects that already existed.

That is also the mechanism behind monkey patching a built-in prototype, and behind the advice not to.`,
    explanation: `woof twice is the answer if methods are copied into instances when they are constructed, which is how classes work in most other languages. Then deleting one from the prototype would be too late to matter.

The TypeError is the sharper version: it accepts that the method was found by lookup, and stops the lookup at the first prototype. The walk does not stop there. It carries on to the next link, which is what extends set up.

true for hasOwn is the same copying belief measured directly. If the instance had its own speak, the delete would have changed nothing at all.`,
    hints: [
      'Where does speak actually live?',
      'What does the lookup do once the first match is gone?',
    ],
    tags: ['objects', 'prototype', 'classes'],
  },
  {
    id: 'inherited-mutation',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const defaults = { tags: [], name: 'unnamed' }
const item = Object.create(defaults)

item.tags.push('new')
item.name = 'first'

const other = Object.create(defaults)
console.log(other.tags, other.name)`,
    options: ['[] unnamed', "[ 'new' ] unnamed", "[ 'new' ] first", '[] first'],
    correctOption: 1,
    answerInFull: `[ 'new' ] unnamed

Two lines that look alike do completely different things.

item.tags.push('new') is a read followed by a mutation. The read walks the chain, finds the one array on defaults, and pushes into it. There is only ever one array, so every object inheriting from defaults sees the new tag, including ones created afterwards.

item.name = 'first' is a write. It does not walk, so it creates an own name on item and leaves defaults alone. other never sees it.

The rule to say out loud: mutating an inherited object is shared, assigning is not. It is the same asymmetry as shadowing, and it is why a default of an empty array or object on a shared prototype is a bug waiting for its second caller.`,
    explanation: `[] unnamed is the answer if both lines are read as writes. It is what you get from a class with fields, where tags = [] in the class body creates a new array per instance, and it is the reason class fields behave differently from prototype properties.

[ 'new' ] first reads both lines as mutations of the shared object, which would make a write to any inheriting object visible everywhere. Nothing assigns through the chain.

[] first is the two rules swapped over, and it is worth checking which of the two lines you thought was which. push reaches the prototype and = never does.`,
    hints: ['Which of the two lines writes, and which one reads and then mutates?'],
    tags: ['objects', 'prototype', 'references'],
  },
  {
    id: 'object-create-null',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'You are building a lookup keyed by strings that come from user input. Which statement about using Object.create(null) for it is right?',
    options: [
      'It cannot take new properties, so it is safe to hand to code you do not trust',
      'It has no prototype, so no key can collide with an inherited member, and the cost is that it has no toString or hasOwnProperty either',
      'It refuses keys that match a member of Object.prototype, which is what makes it safe against prototype pollution',
      'It is a Map in all but name, so it accepts any key type rather than only strings',
    ],
    correctOption: 1,
    answerInFull: `Its chain terminates immediately, so there is nothing to inherit and nothing to collide with. A key called toString or constructor is just a key, and prototype pollution has nothing to pollute.

What it costs is every Object.prototype method. No toString, so string coercion throws. No hasOwnProperty, so you need Object.hasOwn or Object.prototype.hasOwnProperty.call. Console output looks unusual, and some libraries assume a normal prototype.

A Map is usually the better answer for a dictionary, because it accepts any key type, has a proper API, keeps insertion order for every key, and has no prototype question at all.

The prototype pollution angle is what makes this a real question rather than trivia. It is the mechanism behind a whole class of vulnerabilities in code that merges untrusted objects into ones it later reads.`,
    explanation: `Nothing here is frozen. A prototypeless object takes new properties like any other, and freezing is what Object.freeze is for.

Refusing keys is the right consequence attached to the wrong mechanism. No key is refused. There is simply nothing for a key to shadow, which is a much better guarantee than a list of names to reject.

The Map comparison is the one to think about rather than dismiss, because a Map really is usually the better answer. It is not the same thing: a prototypeless object still takes string and symbol keys only, and it is still an object to anything reading it with Object.keys or spreading it.`,
    hints: [],
    tags: ['objects', 'prototype', 'performance'],
  },
  {
    id: 'implement-instanceof',
    type: 'coding',
    form: 'choice',
    tier: 'staff',
    prompt:
      'Your myInstanceOf walks the prototype chain of value looking for Constructor.prototype. What else does it need to be correct?',
    options: [
      'A check that value.constructor === Constructor before walking, to rule out unrelated chains early',
      'A check that Constructor is a class rather than an ordinary function, since only a class can sit on the right of instanceof',
      'A guard returning false for a primitive, which has no chain of its own to walk',
      'A fallback to comparing Constructor.name, for values that came from another realm',
    ],
    correctOption: 2,
    answerInFull: `  function myInstanceOf(value, Constructor) {
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
  }

instanceof is exactly a walk up the prototype chain looking for the constructor's prototype object. That is why it can be fooled by reassigning Constructor.prototype, and why it fails across realms such as an iframe, where Array.prototype is a different object entirely.

The guard at the top matters because primitives are the case the walk cannot handle. Object.getPrototypeOf(null) throws, and a number does have Number.prototype conceptually, but 1 instanceof Number is false: instanceof is about objects, and a primitive is not one.`,
    explanation: `Comparing value.constructor is how most people describe instanceof and it is not what it does. constructor is an ordinary inherited property that anything can reassign, and it says nothing about the chain, so the check would pass on an object that merely borrowed one.

Any callable can sit on the right of instanceof, class or not. That is what made the constructor function pattern work before classes existed.

Comparing names is the workaround people reach for after being bitten by the realm problem, and it trades a wrong answer for an unfalsifiable one. The real answers are a branded check such as Array.isArray, or Symbol.hasInstance when you own the constructor.`,
    hints: ['What is instanceof actually comparing?', 'What should it do for a primitive?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'class-methods-live-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Where does a method declared in a class body actually live?',
    options: [
      'On each instance, copied in by the constructor',
      'On the constructor function itself',
      'On the constructor prototype, shared by every instance',
      'In a private table the engine keeps separately',
    ],
    correctOption: 2,
    answerInFull: `On Constructor.prototype, shared by every instance.

class is syntax over prototypes. Methods go on the prototype object and are found by lookup through the chain, which is why a thousand instances cost one copy of each method rather than a thousand.

Two exceptions are worth naming. Fields declared in the class body, including a method written as an arrow function assigned to a field, are per instance: they are created in the constructor and cost memory per object. And static methods go on the constructor function itself.

The practical consequence of the arrow field version is that it is the only way to get a method that keeps its receiver when it is pulled off the instance, and it costs one function object per instance to do it.`,
    explanation: `Copied into each instance is how classes work in several other languages, and it is the belief that makes the delete question in this topic surprising.

On the constructor function is where static members live, so it is half right about a different half of the class.

The private table option is the answer for private methods and fields declared with #, which really are kept outside the ordinary property machinery. Ordinary methods are plain properties on an ordinary object, and you can list them with Object.getOwnPropertyNames(Constructor.prototype).`,
    hints: [],
    tags: ['prototypes', 'classes'],
  },
  {
    id: 'instanceof-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does `a instanceof B` actually test?',
    options: [
      'Whether a was created by calling B',
      'Whether a and B have the same constructor property',
      'Whether a has every property that B.prototype has',
      'Whether B.prototype appears anywhere in the prototype chain of a',
    ],
    correctOption: 3,
    answerInFull: `Whether the object B.prototype points at appears anywhere in a's prototype chain.

Nothing records which constructor made a value. That has three consequences worth naming.

Reassigning B.prototype changes the answer retroactively, for objects that already exist, because the check reads the property at the moment it runs.

It fails across realms. An array from an iframe has that document's Array.prototype in its chain, so it is not instanceof the parent document's Array. Array.isArray exists because it asks a different question, and typed checks such as Buffer.isBuffer exist for the same reason.

And it can be answered deliberately: a constructor that defines Symbol.hasInstance decides for itself what instanceof means, which is how a library can make a plain object claim to be one of its types.`,
    explanation: `"Created by calling B" is what the name suggests and what it means most of the time. The gap between those two shows up exactly when someone has been rewiring prototypes, which is when you most need the answer to be precise.

The constructor property is the version people describe when asked to implement it. It is an ordinary inherited property, reassignable by anyone, and instanceof never reads it.

Checking for the properties B.prototype declares is structural typing, which is what TypeScript does at compile time and what nothing does at runtime. instanceof compares one object identity and nothing else.`,
    hints: [],
    tags: ['prototypes'],
  },
]
