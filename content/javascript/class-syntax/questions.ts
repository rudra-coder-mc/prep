import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'where-things-live-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'In a class with a field, a method, a getter and a static property, where does each one end up after new?',
    options: [
      'All four on the instance, since the class body describes what an instance has',
      'Field on the instance; method, getter and static on the prototype',
      'Field on the instance; method and getter on the prototype; static on the class itself',
      'Field and method on the instance; getter and static on the prototype',
    ],
    correctOption: 2,
    answerInFull: `The field is an own property of each instance, created by new before the constructor body runs. The method and the getter go on the class's prototype object, once, and every instance reaches them through its prototype chain. The static goes on the class function itself and is not reachable from an instance at all.

That split is the whole memory and serialisation story. A method exists once regardless of how many instances there are. A field exists per instance. JSON.stringify and a spread copy only the own enumerable properties, which is the fields, so behaviour never survives either.`,
    explanation: `Everything on the instance is what an arrow field would give you for a method, and it is the reason arrow fields cost memory per object.

A static on the prototype would make it reachable from instances, and it is not: instance.instances is undefined.

The getter is an accessor property on the prototype exactly like a method. It is read through the chain, not stored per instance.`,
    hints: ['Which of the four is shared, which is per object, and which belongs to neither?'],
    tags: ['classes', 'prototype'],
  },
  {
    id: 'stringify-instance-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `class Point {
  x = 1
  y = 2
  sum() {
    return this.x + this.y
  }
  get norm() {
    return Math.hypot(this.x, this.y)
  }
}

console.log(JSON.stringify(new Point()), Object.keys(new Point()))`,
    options: [
      '{"x":1,"y":2} [ \'x\', \'y\' ]',
      '{"x":1,"y":2,"norm":2.23606797749979} [ \'x\', \'y\', \'norm\' ]',
      '{"x":1,"y":2,"sum":{},"norm":2.23606797749979} [ \'x\', \'y\', \'sum\', \'norm\' ]',
      '{} []',
    ],
    correctOption: 0,
    answerInFull: `{"x":1,"y":2} [ 'x', 'y' ]

x and y are fields, so they are own enumerable properties of the instance and both stringify and Object.keys see them. sum and norm live on Point.prototype and are non-enumerable there, so neither is an own property and neither appears.

A getter is not evaluated by stringify unless it is an own enumerable accessor, and a class getter is neither.`,
    explanation: `Including norm assumes stringify evaluates getters it finds on the chain. It reads own enumerable properties only.

sum as {} is what a function would look like if stringify wrote functions as objects, and it does not write them at all.

Empty output would mean fields were not own properties, and they are.`,
    hints: ['Which of the four are own properties of the instance?'],
    tags: ['classes', 'json'],
  },
  {
    id: 'constructor-order-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `class Widget {
  a = log('field a', this.b)
  b = log('field b', this.a)

  constructor() {
    log('constructor', this.a, this.b)
  }

  static s = log('static s')
}

function log(...args) {
  console.log(...args)
  return args[0]
}

log('before new')
new Widget()`,
    items: [
      'static s',
      'before new',
      'field a undefined',
      'field b field a',
      'constructor field a field b',
      'field a field b',
      'constructor undefined undefined',
      'field b undefined',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `static s
before new
field a undefined
field b field a
constructor field a field b

Static fields are initialised when the class declaration is evaluated, before any instance exists, so static s prints first, before the call to log('before new').

On new, fields run in textual order before the constructor body. a runs first and reads b, which has not been initialised yet, so undefined. b then reads a, which holds 'field a' because log returns its first argument. The constructor body runs last, when both fields are set.`,
    explanation: `field a field b is what you would get if fields were hoisted together before any initialiser ran. They are not; each initialiser runs in turn.

constructor undefined undefined is the constructor running before the fields. It is the other way round.

field b undefined would need b to run before a. Textual order is the rule.

Printing static s after before new treats a static field like an instance field. It runs when the class is defined, not when it is instantiated.`,
    hints: [
      'When do static initialisers run relative to the class declaration?',
      'Does the constructor body run before or after the fields?',
    ],
    tags: ['classes', 'fields'],
  },
  {
    id: 'class-before-declaration-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A helper at the top of a module does new Config() and a class Config is declared further down the same file. The module throws ReferenceError: Cannot access Config before initialization. Why, when the same pattern with function Config() {} works?',
    options: [
      'Class declarations are not hoisted at all, so Config does not exist until its line runs. Move the class above the call, or wrap the call in a function that runs later',
      'A class declaration is hoisted like let: the binding exists from the top of the scope but is in the temporal dead zone until the declaration runs. Move the class above the call, or defer the call',
      'The class has a field initialiser, and fields are what stop hoisting. Remove the fields and it will hoist like a function',
      'The module is in strict mode because of the class, and strict mode disables hoisting. Use a class expression instead',
    ],
    correctOption: 1,
    answerInFull: `A class declaration is hoisted the way let and const are: the name is known to the whole scope, which is why the error says "before initialization" rather than "is not defined", but the binding is in the temporal dead zone until the class statement executes. A function declaration is hoisted with its body, so it can be called from anywhere in the scope.

The fix is ordering. Declare the class before the first use, or put the use inside a function that is not called until after the declaration has run. That is the same rule the scope topic gave for let.`,
    explanation: `"Not hoisted at all" would produce a plain ReferenceError of Config is not defined, and would mean an inner function referencing Config was also broken. The binding does exist; it is uninitialised.

Fields have nothing to do with it. A class with an empty body behaves the same way.

Strict mode does not change hoisting, and a class expression assigned to a const is in exactly the same temporal dead zone.`,
    hints: [
      'What does the wording "before initialization" tell you about whether the binding exists?',
    ],
    tags: ['classes', 'hoisting'],
  },
  {
    id: 'arrow-field-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'handleClick = () => this.toggle() is written as a class field instead of a method. Which statement about the result is true?',
    options: [
      'It is on the prototype like any method, and additionally keeps this when passed as a callback',
      'It is an own property on each instance, created per object, keeps this when passed as a callback, and a subclass cannot reach it with super',
      'It is shared by all instances, but this inside it is undefined because a class body is strict',
      'It behaves the same as a method in every way, and the arrow is only a style choice',
    ],
    correctOption: 1,
    answerInFull: `An arrow written as a field is a field. Every instance gets its own copy, created when that instance is constructed, and the arrow closes over the this of that construction, which is why it survives being handed to addEventListener or setTimeout without a bind.

Because it is an own property of the instance and not on the prototype, two things follow. Memory: one function per object instead of one shared. And overriding: super.handleClick in a subclass looks at the prototype, finds nothing, and is undefined. Those two costs are why a plain method is the default and the arrow field is a deliberate choice for something that will be passed around as a value.`,
    explanation: `On the prototype and keeps this is the result people want and cannot have: a prototype method has a dynamic this by definition.

Shared with this undefined describes a detached prototype method, which is exactly the problem the arrow field is used to avoid.

It is not a style choice. The location changes, and with it memory per instance and what super can see.`,
    hints: ['Is a field on the prototype or on the instance?', 'What does super look at?'],
    tags: ['classes', 'this'],
  },
  {
    id: 'call-without-new-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `class Temp {
  constructor(c) {
    this.c = c
  }
}

function Old(c) {
  this.c = c
}

try {
  console.log(Old(1))
  console.log(Temp(1))
} catch (e) {
  console.log(e.constructor.name)
}`,
    options: [
      'undefined\nTypeError',
      'Old { c: 1 }\nTemp { c: 1 }',
      'TypeError',
      'undefined\nundefined',
    ],
    correctOption: 0,
    answerInFull: `undefined
TypeError

Old(1) is a plain call of a function. It runs, assigns c to whatever this is, which in sloppy mode is the global object, and returns undefined, so undefined is printed. Then Temp(1) throws, because a class constructor cannot be invoked without new, and the catch prints the error's name.

This is one of the concrete ways a class is not just sugar. The function version silently writes a global; the class version refuses.`,
    explanation: `Two constructed objects would need both calls to use new, and neither does.

A single TypeError skips the first line. Old(1) does not throw; it quietly pollutes the global and returns undefined.

undefined twice is what you would get if a class could be called like a function. It cannot.`,
    hints: ['What does a function return when called without new and with no return statement?'],
    tags: ['classes', 'new'],
  },
  {
    id: 'shared-array-field-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Every Cart instance seems to share the same items: adding to one cart shows up in every other. The class is written as shown. What is wrong?',
    code: `const defaults = []

class Cart {
  items = defaults
  add(item) {
    this.items.push(item)
  }
}`,
    options: [
      'Fields are shared across instances by default, like static properties. Declare items inside the constructor instead',
      'The initialiser runs per instance but evaluates to the same array each time, so every cart holds a reference to the one defaults array. Initialise with a fresh array: items = []',
      'push mutates the prototype because items is found through the chain. Use items = [...this.items, item] in add',
      'A field initialiser runs once when the class is defined, so there is one array. Move the assignment into add',
    ],
    correctOption: 1,
    answerInFull: `The field initialiser does run once per instance, and each instance does get its own items property. But the expression is defaults, a reference to one array created once at module level, so every instance's own property points at the same object. Pushing through any of them changes the one array.

The fix is to make the initialiser produce a new value: items = []. A fresh array is allocated for each instance because the initialiser expression is evaluated each time new runs.

This is the value-and-reference topic inside a class. A field holds a reference, and a reference to a shared object is shared however many times you copy it.`,
    explanation: `Fields are not shared across instances. Each instance has its own property; the problem is what the property points at.

The prototype is not involved. items is an own property, and push is mutating the array it refers to, not anything on the chain.

Instance field initialisers run per instance, not once. Static field initialisers are the ones that run once.`,
    hints: [
      'Does each cart have its own items property, and does each one point at a different array?',
    ],
    tags: ['classes', 'references'],
  },
  {
    id: 'readonly-counter-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write a class Temperature constructed with a celsius value, exposing celsius and fahrenheit as properties that can be read and assigned, where assigning either one updates the other. Which implementation is correct?',
    options: [
      'class Temperature {\n  constructor(c) {\n    this.celsius = c\n    this.fahrenheit = c * 9 / 5 + 32\n  }\n}',
      'class Temperature {\n  #c\n  constructor(c) {\n    this.#c = c\n  }\n  get celsius() {\n    return this.#c\n  }\n  set celsius(v) {\n    this.#c = v\n  }\n  get fahrenheit() {\n    return this.#c * 9 / 5 + 32\n  }\n  set fahrenheit(f) {\n    this.#c = (f - 32) * 5 / 9\n  }\n}',
      'class Temperature {\n  constructor(c) {\n    this.#c = c\n  }\n  celsius = () => this.#c\n  fahrenheit = () => this.#c * 9 / 5 + 32\n}',
      'class Temperature {\n  #c\n  constructor(c) {\n    this.#c = c\n  }\n  get celsius() {\n    return this.#c\n  }\n  get fahrenheit() {\n    return this.#c * 9 / 5 + 32\n  }\n}',
    ],
    correctOption: 1,
    answerInFull: `class Temperature {
  #c
  constructor(c) {
    this.#c = c
  }
  get celsius() {
    return this.#c
  }
  set celsius(v) {
    this.#c = v
  }
  get fahrenheit() {
    return this.#c * 9 / 5 + 32
  }
  set fahrenheit(f) {
    this.#c = (f - 32) * 5 / 9
  }
}

One stored value and two views of it. Each getter derives from the stored celsius, and each setter writes back to it, so assigning t.fahrenheit = 212 makes t.celsius read 100 with no second copy to keep in sync. The accessors sit on the prototype, so an instance has one own slot, the private field, and nothing else.`,
    explanation: `Two plain fields are two independent numbers. Assigning one leaves the other stale, which is the bug the accessors exist to prevent.

The arrow-field version makes celsius and fahrenheit functions, so reading them gives a function rather than a number, and assignment replaces the function. It also uses #c without declaring it, which is a syntax error.

Getters with no setters are read-only views. Assigning to t.fahrenheit then throws in strict mode, and a class body is always strict.`,
    hints: [
      'How many numbers need to be stored?',
      'What does assignment to a getter-only property do inside a class?',
    ],
    tags: ['classes', 'accessors'],
  },
  {
    id: 'entity-modelling-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A team is modelling a User with several methods and a created timestamp. Instances are stored in React state, spread into new objects on every update, and serialised to localStorage. Methods keep "disappearing" after updates and reloads. What is going on, and what is the right shape?',
    options: [
      'Spread and JSON both copy own enumerable properties, and class methods are neither, so every copy is a plain object without them. Keep the data as plain objects and put the behaviour in standalone functions that take the object',
      'Methods are dropped because they are not arrow fields. Rewrite every method as an arrow field so it becomes an own property that spread and JSON preserve',
      'localStorage cannot store functions. Serialise with a replacer that writes each method as its source string and revive it with new Function',
      'Spread works on class instances. The problem is only JSON, so keep the class and re-wrap with Object.assign(new User(), parsed) after each load',
    ],
    correctOption: 0,
    answerInFull: `Both operations are doing exactly what they do: copy own enumerable string-keyed properties. A class method is on the prototype and non-enumerable, so a spread produces a plain object with the fields and no prototype link, and JSON.stringify writes the fields alone. After either step the thing in state is not a User any more, so calling a method on it fails.

The shape that fits this pipeline is data as plain objects and behaviour as functions: user.created as a field, and formatCreated(user) as a function in a module. Plain objects survive spread, structuredClone, JSON and React's equality checks without ceremony, and the functions are importable and testable on their own.

Classes are the right tool when instances are long-lived, hold invariants, and are not being copied and serialised on every change. State that is spread on every update is not that.`,
    explanation: `Arrow fields would survive the spread, since they are own enumerable properties, but each copy carries functions closed over the original this, so methods on the copy would read the old object. And JSON still drops them.

Serialising function source and reviving with new Function is an injection risk and a maintenance trap, for a problem that the data shape solves.

Spread does not preserve the prototype. Object.assign onto a fresh instance after load would work for the reload and do nothing for the spreads.`,
    hints: ['What does spread copy, and what does a class method count as?'],
    tags: ['classes', 'state'],
  },
  {
    id: 'sugar-or-not-interview',
    type: 'interview',
    form: 'open',
    tier: 'staff',
    prompt:
      'Is class just syntactic sugar over constructor functions and prototypes? Make the case precisely.',
    answerInFull: `Mostly yes, and the interview is in the "mostly". Underneath, a class is a constructor function, its methods are properties of that function's prototype object, instances get that object as their prototype, and extends sets up the same chain you could build by hand with Object.create. Everything in the prototypes topic applies unchanged, and you can desugar most classes mechanically.

Then the differences, which are the reason the answer is not a flat yes. A class body is always strict mode. A class cannot be called without new; the function version runs happily with this as the global. A class declaration is in the temporal dead zone, where a function declaration is hoisted with its body. Class methods are non-enumerable, where methods assigned to a prototype are enumerable, which changes what for...in, Object.keys and spread see. Class methods are not constructors, so new instance.method() throws. And private fields, #x, are a real mechanism with no prototype-era equivalent: they are not properties, cannot be reached by name, and are checked by brand.

Then, if there is time, the order of construction in a subclass: this does not exist until super() returns, and fields are initialised right after, which the desugared version does not enforce.

The precise case, then: same object model, stricter and more predictable rules, plus one genuinely new feature.`,
    explanation: `The answer being listened for is the list of differences given without prompting, and the private fields point in particular, because it is the one thing that cannot be desugared. A candidate who says "yes, just sugar" and stops is the one the follow-up questions are written for.`,
    hints: [],
    tags: ['classes', 'prototype'],
  },
  {
    id: 'method-enumerability-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `class A {
  m() {}
}

function B() {}
B.prototype.m = function () {}

const keys = (o) => {
  const out = []
  for (const k in o) out.push(k)
  return out
}

console.log(keys(new A()), keys(new B()), typeof A, Object.getPrototypeOf(A.prototype) === Object.prototype)`,
    options: [
      "[] [ 'm' ] function true",
      "[ 'm' ] [ 'm' ] function true",
      '[] [] function true',
      "[] [ 'm' ] object false",
    ],
    correctOption: 0,
    answerInFull: `[] [ 'm' ] function true

for...in walks enumerable properties, own and inherited. A class method is defined non-enumerable on A.prototype, so the loop over an A instance finds nothing. A method assigned to B.prototype by ordinary assignment is enumerable, so the loop over a B instance finds m through the chain.

typeof A is 'function', because a class is a function. And a base class's prototype object is an ordinary object whose own prototype is Object.prototype, which is what makes toString and hasOwnProperty available on instances.`,
    explanation: `m on both treats a class method as an ordinary assigned property. Enumerability is one of the concrete differences between the two forms.

Neither finding m forgets that for...in walks the chain and that assignment creates enumerable properties.

typeof A as 'object' and the prototype check as false would mean a class was not a function and its prototype was not a normal object. Both are.`,
    hints: [
      'Does for...in see inherited properties?',
      'Which of the two ways of defining m creates an enumerable property?',
    ],
    tags: ['classes', 'enumerability'],
  },
]
