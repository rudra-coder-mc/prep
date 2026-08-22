import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'private-guarantee-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does a #private field guarantee that an _underscore property does not?',
    options: [
      'It is hidden from Object.keys and JSON.stringify, but still reachable with bracket access for debugging',
      'No code outside the class body can read, write, detect or enumerate it, by any means, because it is not a property at all',
      'It is read-only from outside the class and writable only from inside',
      'It is hidden from subclasses but visible to any code in the same module',
    ],
    correctOption: 1,
    answerInFull: `A #private name is not a property of the object. It lives in a per-class record keyed by the instance, and the only syntax that can reach it is this.#name written inside that class body. So there is no bracket access, no reflection API, no Proxy trap and no serialiser that sees it. An _underscore property is an ordinary enumerable property that everyone agreed not to touch.

Two consequences fall out. Access is lexical, so a subclass cannot reach a base #x even by writing the same name. And reading #x on an object that was not constructed by the class throws a TypeError rather than returning undefined.`,
    explanation: `Bracket access reads a property called "#name", which is a different thing and is undefined. There is no debugging backdoor.

Read-only from outside would still be a property with a descriptor. It is not visible at all.

Module scope has nothing to do with it. Two classes in one file each declaring #x have two unrelated names.`,
    hints: ['Is this.#x a property lookup?'],
    tags: ['classes', 'private'],
  },
  {
    id: 'private-reflection-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `class Box {
  #secret = 42
  label = 'box'
  reveal() {
    return this.#secret
  }
}

const b = new Box()
console.log(Object.keys(b), JSON.stringify(b), b['#secret'], b.reveal())`,
    options: [
      '[ \'label\' ] {"label":"box"} undefined 42',
      '[ \'#secret\', \'label\' ] {"#secret":42,"label":"box"} 42 42',
      '[ \'label\' ] {"label":"box"} 42 42',
      'TypeError',
    ],
    correctOption: 0,
    answerInFull: `[ 'label' ] {"label":"box"} undefined 42

label is an ordinary field, so it is an own enumerable property and both Object.keys and JSON.stringify show it. #secret is not a property, so neither sees it. b['#secret'] is a normal string-keyed lookup for a property literally named "#secret", which does not exist, so it is undefined, not an error. reveal runs inside the class body and reads the private name through this, which works because b has the brand.`,
    explanation: `Listing #secret as a key treats the private name as an ordinary property with an unusual name. It is not on the object in any enumerable form.

42 from bracket access would mean the string "#secret" maps to the private slot. Private names are not strings and bracket syntax never reaches them.

Nothing here throws. The throwing case is reading this.#secret inside a method when this is not a Box.`,
    hints: ['Is "#secret" in quotes the same thing as #secret in the class body?'],
    tags: ['classes', 'private'],
  },
  {
    id: 'static-init-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `log('module start')

class Config {
  static defaults = log('static field')
  static {
    log('static block', typeof this)
  }
  value = log('instance field')
  constructor() {
    log('constructor')
  }
}

log('class defined')
new Config()

function log(...args) {
  console.log(...args)
  return args[0]
}`,
    items: [
      'module start',
      'static field',
      'static block function',
      'class defined',
      'instance field',
      'constructor',
      'static block object',
      'constructor\ninstance field',
    ],
    correctOrder: [0, 1, 2, 3, 4, 5],
    answerInFull: `module start
static field
static block function
class defined
instance field
constructor

Static fields and static blocks run when the class declaration itself is evaluated, in textual order, with this bound to the class, which is a function. That all happens before 'class defined' prints. Instance fields and the constructor do nothing until new, and then fields run before the constructor body.

log is a function declaration, so it is hoisted and callable on the first line.`,
    explanation: `static block object is what you would get if this inside a static block were an instance or a plain object. It is the class, and typeof a class is 'function'.

Running the constructor before the instance field reverses the construction order. Fields first, then the body.

Placing static field after class defined treats statics like instance members that wait for new. They run at declaration time.`,
    hints: ['When does a static initialiser run?', 'What is this inside a static block?'],
    tags: ['classes', 'static'],
  },
  {
    id: 'proxy-private-bug',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A class with a #count field works on its own. Wrapped in a reactivity library that returns new Proxy(instance, handler), every call to increment() throws "Cannot read private member #count from an object whose class did not declare it". What is going on?',
    options: [
      'The Proxy handler is missing a get trap for the #count key. Add a get trap that forwards to the target',
      'Inside increment, this is the proxy, not the instance. Private names are checked against the object itself, the proxy has no #count brand, and no trap can intercept a private name. Either bind methods to the raw target or avoid private fields on wrapped objects',
      'The library freezes the instance, and private fields cannot be read on frozen objects',
      'Private fields are only accessible through the prototype, and a Proxy has a different prototype. Set the proxy prototype to the class prototype',
    ],
    correctOption: 1,
    answerInFull: `Calling proxy.increment() runs the method with this set to the proxy. Inside, this.#count looks up the private name on the object that this refers to, and that object is the proxy, which was never constructed as an instance and does not carry the brand. Private names are not properties, so the proxy's traps never see the access; there is nothing to intercept. It throws.

The fixes are all workarounds, because this is a property of the language rather than a bug. Bind or wrap methods so that they run on the raw target, have the handler's get trap return functions bound to the target, or store the state in a WeakMap keyed by the instance, which does the lookup on an object you control. Some libraries document "no private fields on reactive objects" for exactly this reason.`,
    explanation: `There is no key to trap. A get trap receives string and symbol property keys, and #count is neither; it is never routed through the proxy machinery at all.

Freezing does not affect private fields. They are not properties and Object.freeze does not touch them.

Private fields are installed on the instance at construction, not on the prototype, and the prototype is not consulted when reading one. Changing the proxy's prototype changes nothing about the brand.`,
    hints: [
      'What is this inside the method when it is called through the proxy?',
      'Can a trap see a private name?',
    ],
    tags: ['classes', 'private', 'proxy'],
  },
  {
    id: 'static-this-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `class Model {
  static create() {
    return new this()
  }
  kind() {
    return this.constructor.name
  }
}

class User extends Model {}

const make = User.create
console.log(User.create().kind())
try {
  console.log(make().kind())
} catch (e) {
  console.log(e.constructor.name)
}`,
    options: ['User\nTypeError', 'Model\nModel', 'User\nUser', 'Model\nTypeError'],
    correctOption: 0,
    answerInFull: `User
TypeError

User.create() finds create on Model through the class chain and calls it with this as User, so new this() constructs a User and kind reports 'User'. That is the reason factories write new this rather than naming the class.

make is the same function detached from its receiver. Called bare, this is undefined inside it, because a class body is strict, and new undefined() throws a TypeError. A static method has an ordinary this and loses it the same way any method does.`,
    explanation: `Model for the first call assumes this inside a static is always the class that declared it. It is the class the method was called on.

User for the detached call assumes the static remembers its class. Nothing is bound; it is a plain function.

Model then TypeError gets the second half right and the inheritance half wrong.`,
    hints: [
      'What is this in a static method called as User.create()?',
      'What is it when the same function is called with no receiver?',
    ],
    tags: ['classes', 'static', 'this'],
  },
  {
    id: 'subclass-private-access-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'class Base has a #balance field. class Child extends Base writes this.#balance in one of its methods. What happens?',
    options: [
      'It reads the inherited field, since Child instances are also Base instances and carry the brand',
      'It is a SyntaxError: #balance is not declared in the Child class body, and private names are lexically scoped',
      'It compiles, and throws a TypeError at runtime because the field is private to Base',
      'It creates a separate #balance on the Child instance, shadowing the base one',
    ],
    correctOption: 1,
    answerInFull: `A private name must be declared in the class body where it is used. Child's body declares no #balance, so the reference is a SyntaxError at parse time, before any code runs. Private names are lexical, like variables: they are visible in the text of the class that declares them and nowhere else.

The Child instance does carry Base's #balance, installed by Base's constructor, but Child's code has no way to name it. If a subclass needs the value, the base exposes a method or accessor.

If Child also declares its own #balance, that is a different private name that happens to be spelled the same, and each class reads its own.`,
    explanation: `Inheritance applies to properties found through the prototype chain. Private names are not properties and are not inherited as names, even though the instance does hold the base's slot.

A runtime TypeError is what happens when the name is declared in the class but the object lacks the brand. Here the name is not declared at all, which fails earlier.

Shadowing only happens if Child declares #balance itself. Using an undeclared name does not declare it.`,
    hints: ['Is a private name looked up on the object, or resolved from the text of the class?'],
    tags: ['classes', 'private', 'inheritance'],
  },
  {
    id: 'brand-check-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Write a static Money.isMoney(value) that returns true only for objects constructed by Money, including ones from other realms or with a replaced prototype, and false for anything else without throwing. Which implementation is correct?',
    options: [
      'class Money {\n  #cents\n  constructor(c) {\n    this.#cents = c\n  }\n  static isMoney(v) {\n    return v instanceof Money\n  }\n}',
      'class Money {\n  #cents\n  constructor(c) {\n    this.#cents = c\n  }\n  static isMoney(v) {\n    return #cents in v\n  }\n}',
      "class Money {\n  #cents\n  constructor(c) {\n    this.#cents = c\n  }\n  static isMoney(v) {\n    return typeof v === 'object' && v !== null && #cents in v\n  }\n}",
      'class Money {\n  #cents\n  constructor(c) {\n    this.#cents = c\n  }\n  static isMoney(v) {\n    try {\n      return v.#cents !== undefined\n    } catch {\n      return false\n    }\n  }\n}',
    ],
    correctOption: 2,
    answerInFull: `class Money {
  #cents
  constructor(c) {
    this.#cents = c
  }
  static isMoney(v) {
    return typeof v === 'object' && v !== null && #cents in v
  }
}

#cents in v is the brand check: true if v was constructed by this class, which installed the private field on it, and false otherwise. It does not depend on the prototype chain, so a replaced prototype does not fool it, and it does not depend on identity of the class across realms. The guard is needed because the in operator throws a TypeError when its right-hand side is not an object, and "without throwing" was part of the requirement.`,
    explanation: `instanceof walks the prototype chain. Object.setPrototypeOf(money, null) makes it false, and an instance from another iframe's copy of Money fails too. It answers a different question.

The unguarded in check works for objects and throws for primitives: #cents in 5 is a TypeError. The requirement said anything else.

The try/catch version is close but wrong on one input: a real Money constructed with undefined cents, new Money(undefined), has the brand and returns false. It also uses an exception for control flow where the language provides the check directly.`,
    hints: [
      'What does the in operator do with a private name on the left?',
      'What does it do with a primitive on the right?',
    ],
    tags: ['classes', 'private', 'brand'],
  },
  {
    id: 'static-or-module-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'easy',
    prompt:
      'A module exports class Api with only static methods: Api.get, Api.post, and a static baseUrl. Nothing is ever instantiated and this is never used. A reviewer asks why it is a class. What is the right response?',
    options: [
      'Keep it: static methods are the standard way to group related functions and give them a namespace',
      'Keep it, but add a private constructor so nobody can instantiate it by mistake',
      'Replace it with plain module exports: export const baseUrl and export function get. The module is already the namespace, and a class with no instances and no this is a module in a costume',
      'Turn the statics into instance methods and export a single shared instance, so that this works',
    ],
    correctOption: 2,
    answerInFull: `A class earns its keyword by making instances, holding per-instance state, or participating in a prototype chain. A collection of static functions that never uses this does none of those. The module already provides the namespace and the import syntax, export { get, post, baseUrl } says the same thing with less machinery, the functions can be imported individually, and there is no this to lose when one is passed as a callback.

Static members are for the things that are genuinely about a class: factories that build instances, constants that describe the type, a registry shared by instances. When there are no instances, there is nothing for them to be about.`,
    explanation: `Grouping functions is what modules are for. A class adds a constructor that is never called, a prototype that is never used, and a this that can be lost.

JavaScript has no private constructors; a constructor that throws is the nearest thing and is more code in service of the wrong shape.

A singleton instance adds this without adding a reason for it. If the functions do not need shared mutable state, nothing is gained.`,
    hints: ['What does a class provide that a module does not, and is any of it used here?'],
    tags: ['classes', 'static', 'design'],
  },
  {
    id: 'encapsulation-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'How do you keep state private in JavaScript, what are the options, and when would you choose each?',
    answerInFull: `There are three real mechanisms and one convention.

The convention is an underscore prefix. It hides nothing, and its only virtue is that it costs nothing. It is the right choice for internals in code where nobody is going to misuse them and tooling would flag them anyway.

Closures are the oldest real mechanism. A factory function declares variables and returns an object whose methods close over them. The state is genuinely unreachable from outside. The costs are that every instance carries its own copies of the methods, so there is no shared prototype, and there is no instanceof or class to extend.

A WeakMap in module scope keyed by the instance is the pre-syntax way to do it in a class. Methods read state.get(this). The state is unreachable unless the map is exported, the methods stay on the prototype, and instances are collected normally because the map holds them weakly. It is what #private compiles down to under a transpiler, and it is the answer to "without the syntax".

#private fields are the language mechanism. Not properties, lexically scoped to the class body, checked by brand, invisible to every reflection API. The choice today, with two things to say about its edges: a Proxy around the instance breaks every method that touches a private name, because the proxy lacks the brand, and a subclass cannot reach a base's private state, so the base has to expose what subclasses need.

Choosing: #private for classes where the state must not leak. A WeakMap when the code has to run through tooling that does not support the syntax or when a wrapper like a reactive proxy is involved. Closures when a factory function is the natural shape anyway and instances are few. The underscore for the rest.`,
    explanation: `The answer being listened for is the WeakMap, because it shows you know what the syntax is made of, and the Proxy limitation, because it shows you have used private fields somewhere real. A candidate who only knows #private and the underscore has read the syntax and not shipped it.`,
    hints: [],
    tags: ['classes', 'private', 'encapsulation'],
  },
  {
    id: 'frozen-private-output',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `class Gauge {
  #level = 0
  reading = 0
  bump() {
    this.#level += 1
    this.reading += 1
    return this.#level
  }
}

const g = Object.freeze(new Gauge())
try {
  console.log(g.bump())
} catch (e) {
  console.log(e.constructor.name)
}
console.log(g.reading)`,
    options: ['TypeError\n0', '1\n1', '1\n0', 'TypeError\n1'],
    correctOption: 0,
    answerInFull: `TypeError
0

The private increment succeeds: Object.freeze acts on properties, and #level is not a property, so the frozen object still has a writable private slot and #level becomes 1. The very next line assigns to reading, an ordinary own property that freeze made non-writable. A class body is strict mode, so that assignment throws a TypeError instead of failing silently. The return is never reached, the catch prints the error name, and reading is still 0.

Two facts in one question: freeze does not reach private fields, and strict mode turns a silent non-write into a thrown error.`,
    explanation: `1 then 1 would need freeze to do nothing at all. It makes reading non-writable.

1 then 0 is what sloppy mode would give: the write to reading silently ignored and the function continuing to its return. Class bodies are strict, so the write throws.

TypeError then 1 has the throw happening after the property changed, which cannot be: the throw is the failed write.`,
    hints: [
      'Does freeze affect private fields?',
      'What does a write to a non-writable property do in strict mode?',
    ],
    tags: ['classes', 'private', 'freeze'],
  },
]
