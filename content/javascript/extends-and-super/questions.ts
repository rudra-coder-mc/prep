import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'two-chains-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-2',
    prompt: 'class B extends A sets up which prototype links?',
    options: [
      'One: B.prototype inherits from A.prototype, so instances of B find methods of A',
      'Two: B.prototype inherits from A.prototype for instances, and B itself inherits from A for statics',
      'One: B inherits from A, and instances of B copy the methods of A at construction',
      'Two: B.prototype inherits from A.prototype, and every instance of B also inherits directly from A',
    ],
    correctOption: 1,
    answerInFull: `Two links. Object.getPrototypeOf(B.prototype) === A.prototype is the chain an instance walks, which is how methods and instanceof work. Object.getPrototypeOf(B) === A is the chain the class itself walks, which is how a static method defined on A is callable as B.create().

The second link is the one people do not know is there, and it is also why super works inside a static method: it looks at the class's own prototype, which is the base class.`,
    explanation: `A single link for instances leaves statics unexplained. B.create() works when only A defines create, and the prototype chain of B.prototype does not contain A.

Copying methods at construction is not how any of this works; nothing is copied, everything is looked up.

An instance inheriting from the class A directly would put the constructor function on the instance chain, which would make instance.call and instance.bind resolve. They do not.`,
    hints: ['How does B.someStatic() find a static defined only on A?'],
    tags: ['classes', 'inheritance', 'prototype'],
  },
  {
    id: 'this-before-super-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `class Shape {
  constructor(name) {
    this.name = name
  }
}

class Circle extends Shape {
  constructor(r) {
    this.r = r
    super('circle')
  }
}

try {
  console.log(new Circle(2).r)
} catch (e) {
  console.log(e.constructor.name)
}`,
    options: ['ReferenceError', '2', 'undefined', 'TypeError'],
    correctOption: 0,
    answerInFull: `ReferenceError

In a derived class, this is uninitialised until super() has returned, because it is the base constructor that creates the object. Reading or writing this before that point throws a ReferenceError with the message "Must call super constructor in derived class before accessing 'this'". Swapping the two lines makes it print 2.`,
    explanation: `2 is what the swapped order gives. The order as written never reaches the assignment.

undefined would mean the assignment was silently lost. It is not lost; it throws.

TypeError is the error for calling a class without new or calling a non-function. Touching an uninitialised binding is a ReferenceError, the same one the temporal dead zone gives.`,
    hints: [
      'What creates the object in a derived class, and has it happened on the line that assigns r?',
    ],
    tags: ['classes', 'super'],
  },
  {
    id: 'construction-order-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `class Base {
  tag = log('base field')
  constructor() {
    log('base constructor')
    this.setup()
  }
  setup() {
    log('base setup')
  }
}

class Derived extends Base {
  items = log('derived field')
  constructor() {
    log('derived constructor start')
    super()
    log('derived constructor end', this.items)
  }
  setup() {
    log('derived setup', this.items)
  }
}

function log(...args) {
  console.log(...args)
  return args[0]
}

new Derived()`,
    items: [
      'derived constructor start',
      'base field',
      'base constructor',
      'derived setup undefined',
      'derived field',
      'derived constructor end derived field',
      'base setup',
      'derived setup derived field',
    ],
    correctOrder: [0, 1, 2, 3, 4, 5],
    answerInFull: `derived constructor start
base field
base constructor
derived setup undefined
derived field
derived constructor end derived field

The derived constructor body starts first, since it is what new invokes. At super(), the base constructor runs: its fields initialise, then its body, which calls this.setup(). The object is a Derived, so the override runs, and at that moment derived fields do not exist, so it prints undefined. When super() returns, the derived fields initialise, and only then does the rest of the derived constructor run with items set.`,
    explanation: `base setup never prints because setup is overridden and nothing calls super.setup(). Dispatch on this finds the derived version first.

derived setup with items already set is the order most people expect and the one the language does not give: derived fields run after super() returns, and setup was called from inside it.

Any order with derived field before base constructor has derived fields running before the base constructor, which would need an object to put them on, and there is none until super() creates it.`,
    hints: [
      'When do the derived fields initialise relative to super()?',
      'Which setup does this.setup() find?',
    ],
    tags: ['classes', 'super', 'fields'],
  },
  {
    id: 'base-calls-override-bug',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A Component base class calls this.render() in its constructor. A subclass declares a field template = "<p>hi</p>" and overrides render to use this.template. Constructing the subclass throws because template is undefined. What is the right fix?',
    options: [
      'Declare the template field in the base class too, so it exists when render runs',
      'Make template a static field, since statics are initialised before any constructor runs',
      'Stop calling render from the constructor. Have the caller, or a factory, call render after new returns, when the subclass fields exist',
      'Call super() at the end of the subclass constructor rather than the start, so the fields are set before the base runs',
    ],
    correctOption: 2,
    answerInFull: `The base constructor runs during super(), and derived fields are initialised only after super() returns, so any method the base constructor calls that a subclass overrides will see an instance with no derived fields. That is not a bug to patch; it is the construction order, and the fix is to not call overridable methods from a constructor.

Move the render call out: a mount() method the caller invokes, or a static create() that does new then render. The subclass is then fully initialised by the time its render runs. This is the same rule in every class-based language, and the one-line way to say it is "constructors construct; they do not dispatch".`,
    explanation: `A base field named template would be initialised before the base constructor, but it would hold the base value, and the subclass field would then overwrite it after super() returns. render would use the wrong template.

A static is on the class, not the instance, so this.template would still be undefined, and a per-instance value has no business being static.

super() cannot go at the end. this does not exist before it, so the subclass fields cannot be set first; the language enforces the order this option tries to reverse.`,
    hints: ['Is there any way for derived fields to exist before the base constructor body runs?'],
    tags: ['classes', 'super', 'design'],
  },
  {
    id: 'super-method-resolution-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'staff',
    prompt:
      'Inside a method of class B extends A, what does super.describe() resolve to, and what is this inside the call?',
    options: [
      'The describe on the prototype of this, with this rebound to A.prototype',
      'The describe found on A.prototype, resolved from where the method was written, with this unchanged',
      'The describe on the prototype of this, with this unchanged, so it depends on what this is',
      'The describe on A itself, since super refers to the parent class, with this unchanged',
    ],
    correctOption: 1,
    answerInFull: `super in a method is resolved from the method's home object, the object the method was defined on, which for a method in class B is B.prototype. super.describe looks at the prototype of that, A.prototype, and calls what it finds with this still being the current object.

Resolving from the home object rather than from this is what keeps it stable. If C extends B and a C instance calls the B method, super inside it still means A.prototype, not B.prototype; resolving from this would make it mean B.prototype and loop forever on the same method. It is also why super works in object literal methods, which have a home object too, and not in arrow fields, which do not.`,
    explanation: `Rebinding this to the prototype would mean super.describe() could not read the instance's fields, which is the whole point of calling it.

Resolving from the prototype of this is the intuitive model and the one that breaks on a deeper subclass: a B method running on a C instance would find B.prototype.describe, which is itself.

A itself is the class, not its prototype. Statics live there; instance methods do not. super in a static method does look at A, which is a different case.`,
    hints: [
      'What happens if a C extends B instance calls the B method and super resolved from this?',
    ],
    tags: ['classes', 'super'],
  },
  {
    id: 'instanceof-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `class A {}
class B extends A {}

const fake = Object.create(B.prototype)
const b = new B()

Object.setPrototypeOf(b, Object.prototype)

console.log(fake instanceof A, fake instanceof B, b instanceof B, b instanceof Object)`,
    options: [
      'true true false true',
      'false false true true',
      'true true true true',
      'false false false true',
    ],
    correctOption: 0,
    answerInFull: `true true false true

instanceof asks whether the constructor's prototype property is on the object's prototype chain. fake was never constructed by B, but its chain is B.prototype then A.prototype then Object.prototype, so both checks pass. b was constructed by B, but its prototype has been replaced with Object.prototype, so neither B.prototype nor A.prototype is on its chain any more and b instanceof B is false. It is still an Object.

instanceof is about the chain now, not about history.`,
    explanation: `false for fake assumes instanceof remembers which constructor ran. Nothing records that.

true for b after the prototype swap assumes the opposite, that construction leaves a permanent mark. The check walks the chain as it is at the moment of asking.

false for everything except Object would need Object.create to produce an unrelated object. It produces one whose prototype is exactly what was passed.`,
    hints: ['What does instanceof actually look at?'],
    tags: ['classes', 'instanceof', 'prototype'],
  },
  {
    id: 'custom-error-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'Write class HttpError extends Error carrying a status, so that String(err) reads "HttpError: Not found", err.stack begins with that same text, and err instanceof HttpError is true. Which is correct?',
    options: [
      "class HttpError extends Error {\n  constructor(status, message) {\n    super(message)\n    this.name = 'HttpError'\n    this.status = status\n  }\n}",
      "class HttpError extends Error {\n  constructor(status, message) {\n    this.status = status\n    super(message)\n    this.name = 'HttpError'\n  }\n}",
      'class HttpError extends Error {\n  constructor(status, message) {\n    super()\n    this.message = message\n    this.status = status\n  }\n}',
      'class HttpError extends Error {\n  status\n  constructor(status, message) {\n    super(message)\n    this.status = status\n  }\n}',
    ],
    correctOption: 0,
    answerInFull: `class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

super(message) runs the Error constructor, which sets message and captures the stack at that point. name is inherited as 'Error' from Error.prototype, and both toString and the first line of stack are built from name and message, so setting name is what makes the error print as HttpError. instanceof works because extends links the prototypes and super creates the object through Error.`,
    explanation: `Assigning this.status before super() throws a ReferenceError: this does not exist until super returns.

Calling super() with no argument and assigning message afterwards sets message, but the stack was captured inside super with an empty message, so its first line reads "Error" alone. And name is never set, so String(err) is "Error: Not found".

Leaving name inherited gives "Error: Not found" for both toString and the stack. The status field is fine; the name is the missing piece.`,
    hints: ['Which two properties does toString on an error read?', 'When is the stack captured?'],
    tags: ['classes', 'errors'],
  },
  {
    id: 'array-subclass-output',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `class Stack extends Array {
  peek() {
    return this[this.length - 1]
  }
}

const s = Stack.from([1, 2, 3])
const evens = s.filter((n) => n % 2 === 0)

console.log(s.peek(), evens instanceof Stack, evens.peek(), Array.isArray(evens))`,
    options: [
      '3 true 2 true',
      '3 false TypeError',
      '3 true 2 false',
      'undefined false undefined true',
    ],
    correctOption: 0,
    answerInFull: `3 true 2 true

Stack.from works because static from is inherited through the class chain and builds the result using this, which is Stack, so s is a Stack with length 3 and peek returns 3. filter creates its result through Symbol.species, which by default is the constructor of the receiver, so evens is also a Stack and has peek. And a Stack is a genuine array, because super() asked Array to create it, so Array.isArray is true.`,
    explanation: `A plain array from filter is what species exists to avoid. Define static get [Symbol.species]() { return Array } and you would get that behaviour, with a TypeError on evens.peek.

Array.isArray returning false would need the subclass instance to not be an exotic array object. It is one; extending a built-in creates the built-in's own kind of object.

peek returning undefined would need the static from or the subclassing to have produced empty results. Both work.`,
    hints: ['Which constructor does filter use to build its result?'],
    tags: ['classes', 'arrays', 'species'],
  },
  {
    id: 'shared-behaviour-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'A codebase has a Repository base class whose constructor opens a connection and calls this.migrate(). Each subclass overrides migrate and reads a tables field it declares. Every subclass has a comment saying "do not add fields, set them in migrate". What is the root cause, and the fix that removes the comment?',
    options: [
      'Fields are slower than constructor assignments, so the comment is a performance rule. Leave it',
      'The base constructor calls migrate during super(), before subclass fields exist, so the subclasses have been working around the construction order. Take migrate out of the constructor and call it from an explicit connect() or a static create()',
      'The subclasses forgot to call super.migrate(), so the base never ran. Add the call and fields will initialise',
      'Field initialisers run before the constructor, so the fields were being overwritten by migrate. Change the fields to getters',
    ],
    correctOption: 1,
    answerInFull: `The comment is documenting the construction order. super() runs the base constructor, the base constructor calls migrate, the subclass's override runs on an object whose subclass fields have not been initialised, so any field it reads is undefined. Setting the values inside migrate instead of as fields was the workaround, and the comment exists because anyone who adds a field breaks it.

The fix is to not do work that dispatches to subclasses from the constructor. Make the constructor store its arguments and nothing else, and put the connection and the migrate call in a connect() method or a static async create() that constructs and then initialises. Then fields are ordinary fields again, the comment goes, and the constructor stops doing I/O, which it should not have been doing anyway.`,
    explanation: `There is no performance difference worth a comment. The rule is protecting against undefined fields, not slow ones.

super.migrate() would run the base version, which is not what is missing. The subclass version is running; it is running too early.

Fields run before the derived constructor body, not before super(), and that is exactly the problem: they run after the base constructor has already called migrate. Getters would not change when the base constructor runs.`,
    hints: ['At the moment the base constructor calls migrate, which fields exist on the object?'],
    tags: ['classes', 'design', 'super'],
  },
  {
    id: 'inheritance-cost-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    tier: 'staff',
    prompt:
      'Walk through what happens, step by step, when new Derived() runs for a Derived that extends Base, and say where each of the common inheritance bugs comes from.',
    answerInFull: `new Derived() invokes the Derived constructor with this uninitialised. If Derived has no constructor, the default one forwards every argument to super(). The body runs until it reaches super(), and touching this before that point throws a ReferenceError.

super() invokes the Base constructor. If Base is itself derived, the same thing recurses; if it is a base class, the object is created here, with Derived.prototype as its prototype, because new tracks the class that was actually instantiated. Base's fields are initialised on that object in textual order, then Base's constructor body runs with this bound.

When super() returns, this is bound in the Derived constructor, Derived's fields initialise in textual order, and then the rest of Derived's constructor body runs. The object is returned.

The bugs map onto that sequence. this before super is step one. A base constructor calling an overridden method that reads a derived field is step two meeting step three: dispatch finds the override because the prototype is already Derived.prototype, but the derived fields have not run. A derived field shadowing a base accessor is step three overwriting step two. A forgotten super.method() in an override is not a construction bug at all; it is that overriding replaces rather than extends, and nothing chains automatically.

The design rule that falls out is that a constructor assigns and does not dispatch.`,
    explanation: `What is being listened for is the order stated correctly, and especially the observation that the object's prototype is already Derived.prototype while the Base constructor runs. That one fact explains why the override is found and why its fields are missing, and candidates who can say it have understood the model rather than memorised the rule.`,
    hints: [],
    tags: ['classes', 'inheritance', 'super'],
  },
]
