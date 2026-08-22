import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'define-property-defaults',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: "What kind of property does Object.defineProperty(obj, 'id', { value: 1 }) create?",
    options: [
      'An ordinary property, the same as obj.id = 1',
      'A read-only property that is otherwise ordinary: still listed by Object.keys and still deletable',
      'A property that is read-only, not listed by Object.keys or JSON.stringify, and cannot be deleted or redefined',
      'A hidden property that can still be written and deleted, which is what defineProperty is for',
    ],
    correctOption: 2,
    answerInFull: `A locked one. defineProperty defaults every attribute you do not mention to false, so this property is non-writable, non-enumerable and non-configurable. Assignment does nothing in sloppy code and throws in strict code, Object.keys, spread, for...in and JSON.stringify all skip it, and delete fails.

The opposite default from assignment and literals, which set all three to true. That asymmetry is the thing to remember about defineProperty: it is the tool for making properties that are not ordinary, so it assumes you want them not ordinary unless you say otherwise.

To define an ordinary property with it you write all three flags out: { value: 1, writable: true, enumerable: true, configurable: true }.`,
    explanation: `"The same as assignment" is the natural assumption and the one the defaults exist to break. Reading the descriptor back shows all three false.

"Read-only but otherwise ordinary" gets one flag and misses two. All three default the same way.

"Hidden but writable" has it backwards. Hiding is one of the three things that happened, and writability is another one that did not survive.`,
    hints: ['What does defineProperty assume about an attribute you did not mention?'],
    tags: ['descriptors', 'objects'],
  },
  {
    id: 'silent-write-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Run as a plain script, not a module. What does this print?',
    code: `const o = {}
Object.defineProperty(o, 'a', { value: 1 })
o.b = 2
o.a = 3
console.log(Object.keys(o), o.a)`,
    options: ["[ 'b' ] 1", "[ 'a', 'b' ] 3", "[ 'b' ] 3", 'It throws a TypeError on o.a = 3'],
    correctOption: 0,
    answerInFull: `[ 'b' ] 1

a was defined with only a value, so it is non-writable and non-enumerable. The assignment o.a = 3 fails, and in sloppy code it fails silently, so a is still 1. Object.keys lists own enumerable properties, and a is not one, so only b appears.

In a module or a class body the same code throws a TypeError at o.a = 3, because strict code turns a failed write into an error. That is the difference that makes a snippet work in a script and break once it is imported.`,
    explanation: `[ 'a', 'b' ] 3 treats defineProperty as assignment. Both flags default to false, so the property is neither writable nor enumerable.

[ 'b' ] 3 gets enumerable right and writable wrong. The write did not fail loudly, but it did fail.

The TypeError is the correct answer for strict code, and the prompt says plain script. Knowing that the same line behaves differently in a module is the point of asking.`,
    hints: ['What are the defaults?', 'Does sloppy code report a failed write?'],
    tags: ['descriptors', 'strict-mode'],
  },
  {
    id: 'accessor-order',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const temp = {
  celsius: 20,
  get fahrenheit() {
    console.log('get')
    return (this.celsius * 9) / 5 + 32
  },
  set fahrenheit(value) {
    console.log('set')
    this.celsius = ((value - 32) * 5) / 9
  },
}

temp.fahrenheit = 212
console.log('celsius', temp.celsius)
console.log('fahrenheit', temp.fahrenheit)`,
    items: [
      'celsius 20',
      'set',
      'fahrenheit 68',
      'celsius 100',
      'fahrenheit undefined',
      'get',
      'celsius 212',
      'fahrenheit 212',
    ],
    correctOrder: [1, 3, 5, 7],
    answerInFull: `set
celsius 100
get
fahrenheit 212

Assigning to fahrenheit does not store 212 anywhere. It calls the setter, which prints, converts, and writes 100 into celsius. Reading celsius is a plain data read, 100. Reading fahrenheit calls the getter, which prints and converts the stored celsius back to 212.

Note where the get line falls. The getter runs when the property is read, which is while the arguments to the last console.log are being evaluated, so get prints before the line that shows its result.`,
    explanation: `celsius 20 is the belief that assigning fahrenheit stored a separate value and left celsius alone. There is no fahrenheit value; the setter is the only thing the assignment did.

celsius 212 is the setter storing the raw value without converting. It converts first.

fahrenheit 68 is the getter reading the original 20. By the time it runs, celsius is 100.

fahrenheit undefined is what a setter with no getter would produce. This object has both.`,
    hints: ['What does assigning to an accessor actually do?', 'When does the getter run?'],
    tags: ['accessors', 'objects'],
  },
  {
    id: 'spread-snapshots-getter',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'After copying the temperature object with spread, copy.fahrenheit stays at 212 no matter what copy.celsius is set to. Why, and how do you copy it properly?',
    code: `const copy = { ...temp }
copy.celsius = 0
console.log(copy.fahrenheit) // 212, expected 32`,
    options: [
      'Spread reads through the getter and copies the value it returned as a plain data property. Copy the descriptors instead: Object.defineProperties({}, Object.getOwnPropertyDescriptors(temp))',
      'Spread skips accessor properties entirely, so copy.fahrenheit is an unrelated leftover. Add the accessor back with copy.fahrenheit = temp.fahrenheit',
      'The getter uses this, which spread rebinds to the original object, so copy.fahrenheit still reads temp.celsius. Rewrite the getter as an arrow function',
      'Accessors live on the prototype and spread copies own properties only. Use Object.assign, which walks the chain',
    ],
    correctOption: 0,
    answerInFull: `Spread copies own enumerable properties by reading each one. Reading an accessor runs its getter, so the copy receives 212, the number the getter returned at that moment, as an ordinary data property. The accessor itself is not copied, and nothing links copy.fahrenheit to copy.celsius.

To copy the accessor, copy its descriptor:

  const copy = Object.defineProperties({}, Object.getOwnPropertyDescriptors(temp))

or, to keep the prototype as well:

  const copy = Object.create(Object.getPrototypeOf(temp), Object.getOwnPropertyDescriptors(temp))

Object.assign has the same behaviour as spread here, which is why getOwnPropertyDescriptors exists: it is the one way to ask for the property's shape rather than its current value.`,
    explanation: `"Spread skips accessors" has the symptom backwards. The accessor was read, which is why the copy has a fahrenheit at all; it just arrived as a number. And assigning temp.fahrenheit to the copy reads the getter once more and stores another snapshot.

The this story is a real rule applied to the wrong situation. A getter on the copy would read this.celsius from the copy. The problem is that the copy has no getter, and an arrow function cannot be a getter at all.

The accessor here is an own property of the literal, not inherited. And Object.assign copies own enumerable properties only, exactly as spread does.`,
    hints: ['What does spread do to read each property?', 'What does reading a getter return?'],
    tags: ['accessors', 'memory'],
  },
  {
    id: 'lazy-property',
    type: 'coding',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'Write lazy(obj, name, compute) that defines obj[name] so compute runs on the first read only, and from then on the property is a plain value that costs nothing to read. Which of these is correct?',
    options: [
      'function lazy(obj, name, compute) {\n  Object.defineProperty(obj, name, {\n    enumerable: true,\n    get() {\n      const value = compute()\n      Object.defineProperty(obj, name, { value, enumerable: true })\n      return value\n    },\n  })\n}',
      'function lazy(obj, name, compute) {\n  Object.defineProperty(obj, name, {\n    configurable: true,\n    enumerable: true,\n    get() {\n      const value = compute()\n      Object.defineProperty(obj, name, { value, enumerable: true })\n      return value\n    },\n  })\n}',
      'function lazy(obj, name, compute) {\n  let value\n  Object.defineProperty(obj, name, {\n    enumerable: true,\n    get() {\n      return (value ??= compute())\n    },\n  })\n}',
      'function lazy(obj, name, compute) {\n  obj[name] = compute()\n}',
    ],
    correctOption: 1,
    answerInFull: `function lazy(obj, name, compute) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get() {
      const value = compute()
      Object.defineProperty(obj, name, { value, enumerable: true })
      return value
    },
  })
}

The first definition is an accessor. On the first read the getter computes the value and then redefines the same property as a data property holding it, so every later read is a plain lookup and the getter is gone.

configurable: true on the first definition is what makes the second definition legal. Without it the property is locked the moment it is created, and redefining it throws. The second definition leaves configurable off, so the computed value is locked in, which is the intent.

Worth saying in an interview: this is how several libraries implement memoised properties, and the same shape, a getter that replaces itself, is the general trick for "do this once, then get out of the way".`,
    explanation: `The version without configurable: true defines a non-configurable accessor, and the redefinition inside the getter throws a TypeError on the very first read. It looks identical and fails every time.

The closure version caches correctly but never stops being a getter, and ??= recomputes whenever compute returned null or undefined, which may be expensive and is certainly not "once". It also leaves a function where the spec asked for a plain value.

The eager version computes immediately. The whole point was to defer the cost until somebody reads the property, which may be never.`,
    hints: ['Can a property redefine itself?', 'Which attribute allows that?'],
    tags: ['descriptors', 'accessors'],
  },
  {
    id: 'internal-cache-field',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Objects in a model layer carry a _cache field that keeps appearing in API responses, in Object.keys loops and in spread copies. It has to stay writable. What do you do?',
    options: [
      'Rename it with a leading underscore convention and strip it in the serialiser, since there is no way to hide a writable property from enumeration',
      'Key it with a Symbol instead of a string. Symbol keys are skipped by JSON.stringify, Object.keys and spread',
      'Define it with Object.defineProperty and enumerable: false, writable: true. It stays assignable and drops out of every enumeration-based listing: keys, spread, for...in and JSON',
      'Freeze the object after construction so the field cannot leak into copies',
    ],
    correctOption: 2,
    answerInFull: `Make it non-enumerable:

  Object.defineProperty(model, '_cache', { value: new Map(), writable: true, enumerable: false, configurable: true })

Enumerable is the single flag every listing in the complaint checks. Object.keys, for...in, spread, Object.assign and JSON.stringify all skip a non-enumerable property, and writable: true keeps it assignable. Reading it directly still works, and Reflect.ownKeys or getOwnPropertyNames still find it for anyone who wants to.

The alternative people reach for, a WeakMap keyed by the object, also works and keeps the field off the object entirely. Either is a good answer; the flag is the one that answers the question as asked.`,
    explanation: `The underscore already was the convention, and it is the thing not working. A name is not a property attribute.

The Symbol is right about JSON and Object.keys and wrong about spread, which copies own enumerable symbol keys. The field would vanish from responses and keep appearing in copies, which is half the complaint.

Freezing makes the field read-only, which the question rules out, and changes nothing about enumeration. A frozen object spreads exactly as an unfrozen one does.`,
    hints: ['Which single attribute do all those listings check?'],
    tags: ['descriptors', 'objects'],
  },
  {
    id: 'freeze-guarantee-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'What does Object.freeze actually guarantee, and when would you reach for it rather than seal or preventExtensions, or rather than nothing?',
    answerInFull: `Freeze guarantees that the object's own properties cannot be added, deleted, reassigned or reconfigured. Every own property becomes non-configurable, every data property becomes non-writable, and the object stops accepting new ones. It says nothing about anything the object refers to: a frozen object holding an array holds a perfectly mutable array, so it is one level deep, and it says nothing about where a violation is reported, because a write to a frozen property fails silently in sloppy code and throws only in strict code.

Seal is the same minus the writes: no adding or deleting, but existing values can change. preventExtensions is only the first part: no new properties. So the ladder is, can I add things, can I remove or reshape things, can I change values, and each built-in draws the line one step further.

I reach for freeze on shared constants and configuration objects, where anything mutating them is a bug I want to find in development and which strict mode will throw on. Seal I have wanted roughly never. And most of the time the right answer is none of them. The useful guarantee is usually "this function does not mutate its input", and that comes from not mutating it, which a type system or a review enforces better than a runtime flag that costs a walk of the object and is silent in half the code that runs.`,
    explanation: `The interviewer is listening for the two limits, shallow and strict-only, without having to ask for them. "Makes it immutable" without either is the weak answer.

The last paragraph is what separates a good answer from a complete one: knowing when a tool is wrong is as much the question as knowing what it does. Deep-freezing everything is a common answer and an expensive habit.`,
    hints: [],
    tags: ['immutability', 'descriptors'],
  },
  {
    id: 'for-in-sees-inherited-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these includes an enumerable property inherited from the prototype?',
    options: [
      'Object.keys(obj)',
      'for (const key in obj)',
      'Reflect.ownKeys(obj)',
      'JSON.stringify(obj)',
    ],
    correctOption: 1,
    answerInFull: `for...in is the only one. It walks the prototype chain and yields every enumerable string key it finds, own or inherited. That is why adding an enumerable method to a prototype shows up in every for...in over every instance, and why class methods are defined non-enumerable so that they do not.

The other three are own-property operations. Object.keys lists own enumerable string keys. Reflect.ownKeys lists every own key including non-enumerable and symbol ones, but still only own. JSON.stringify serialises own enumerable string keys, the same set as Object.keys.`,
    explanation: `Object.keys is the one people pick because it and for...in are so often interchangeable in practice. They stop being interchangeable the moment the prototype has an enumerable property.

Reflect.ownKeys sounds like the most complete listing and it is, of own properties. "Own" is in the name.

JSON.stringify follows the Object.keys rule exactly, which is why an inherited property never appears in output without a toJSON to put it there.`,
    hints: ['Which one walks the chain?'],
    tags: ['enumeration', 'prototypes'],
  },
  {
    id: 'strict-freeze-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `'use strict'
const o = Object.freeze({ a: 1, nested: { b: 2 } })
o.nested.b = 3
try {
  o.a = 2
} catch (e) {
  console.log(e.constructor.name)
}
console.log(o.a, o.nested.b)`,
    options: [
      'TypeError, then 1 3',
      '1 3 only, since writes to a frozen object fail silently',
      'TypeError, then 1 2',
      'TypeError twice, then 1 2',
    ],
    correctOption: 0,
    answerInFull: `TypeError
1 3

Freeze is one level deep. o.nested is still an ordinary mutable object, so writing b = 3 succeeds without complaint. o.a is a frozen property, and this is strict code, so the write throws a TypeError, which the catch prints. o.a is unchanged at 1.

Remove 'use strict' and the first line of output disappears: the write to o.a fails silently and the last line is the same. That is the pair of facts the question is checking, shallow and strict-only.`,
    explanation: `"Fail silently" is the sloppy-mode behaviour. The snippet opts into strict mode on its first line.

1 2 after the TypeError is freeze read as deep. Nothing about nested was frozen.

Two TypeErrors is the same mistake: the nested write is not a violation, so there is nothing to throw for.`,
    hints: ['How deep does freeze go?', 'What does strict mode change about a failed write?'],
    tags: ['immutability', 'strict-mode'],
  },
  {
    id: 'configurable-meaning-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'A property has configurable: false. Which of these is still allowed?',
    options: [
      'Deleting it',
      'Changing it from a data property to an accessor',
      'Changing writable from true to false',
      'Changing enumerable from false to true',
    ],
    correctOption: 2,
    answerInFull: `Only tightening writable. A non-configurable property cannot be deleted, cannot have enumerable or configurable changed, and cannot be switched between data and accessor. The single exception is that a writable data property can still be made non-writable, because that only removes a capability and removing capabilities is what non-configurable is for.

The direction matters: writable cannot go back from false to true. And the value of a non-configurable but writable property can still be assigned, which is what separates sealed from frozen.`,
    explanation: `Deletion is the first thing configurable: false forbids, and the reason built-in properties like a function's prototype cannot be removed.

Switching kind would let you replace a locked value with a getter that returns anything, which would make the lock meaningless.

Making it enumerable is a change to an attribute, and every attribute except writable is locked. The exception runs one way.`,
    hints: ['Which direction of change removes a capability rather than adding one?'],
    tags: ['descriptors', 'objects'],
  },
  {
    id: 'setter-recursion-bug',
    type: 'debugging',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What happens when this runs, and what is the fix?',
    code: `const user = {
  set name(value) {
    this.name = value.trim()
  },
}
user.name = '  Ada  '`,
    options: [
      'It works: the setter trims the value and stores it under name',
      'It throws a RangeError: assigning this.name inside the setter calls the setter again, without end. Store the value under a different key, such as this._name, and add a getter that returns it',
      'It throws a TypeError because a setter without a getter is not allowed',
      'Nothing is stored and nothing throws, because the return value of a setter is discarded',
    ],
    correctOption: 1,
    answerInFull: `this.name = value.trim() is an assignment to the property named name on this, and that property is the setter. So the setter calls itself with the trimmed value, which calls itself again, until the stack overflows and a RangeError is thrown.

A setter has to store its value somewhere other than the property it guards:

  const user = {
    _name: '',
    get name() {
      return this._name
    },
    set name(value) {
      this._name = value.trim()
    },
  }

In a class the storage is usually a private field, #name, which has the advantage of not appearing in Object.keys or JSON.`,
    explanation: `"It works" is what the code looks like it should do, and it is the bug the question is about. A setter is not a hook that runs before a normal store; it is the store.

A setter without a getter is allowed. Reading the property gives undefined.

The discarded return value is true and irrelevant. The setter never returns, because it never stops calling itself.`,
    hints: ['What does this.name = ... do when name is an accessor?'],
    tags: ['accessors', 'errors'],
  },
]
