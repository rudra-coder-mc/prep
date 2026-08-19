import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-decides-this',
    type: 'concept',
    difficulty: 'medium',
    prompt: 'What determines the value of `this` in a function?',
    expectedAnswer: `For a regular function, how it is *called*, not where it is defined. In precedence order:

1. new: this is the newly created object.
2. Explicit binding: call, apply or bind set it directly.
3. Method call: obj.fn() sets this to obj, the thing left of the dot.
4. Plain call: fn() gives undefined in strict mode and modules, globalThis otherwise.

Arrow functions are the exception. They have no this of their own and close over the surrounding one lexically, so nothing at the call site can change it, including call and apply.`,
    explanation: `"Left of the dot" is the useful shorthand for the common case, and it immediately explains why pulling a method off its object breaks it: there is no longer anything left of the dot.`,
    hints: ['Is this decided when the function is written, or when it is called?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'lost-this-output',
    type: 'output',
    difficulty: 'medium',
    prompt: 'What does this print, and why?',
    code: `const counter = {
  count: 0,
  increment() {
    this.count += 1
    return this.count
  },
}

const inc = counter.increment
console.log(inc())`,
    expectedAnswer: `In a module or strict mode it throws: "Cannot read properties of undefined (reading 'count')". In sloppy mode it prints NaN, because this is globalThis, globalThis.count is undefined, and undefined + 1 is NaN.`,
    explanation: `Assigning the method to a variable copies the function, not the relationship to the object. Nothing is left of the dot at the call site, so this is not counter.

This is the same bug as passing a method to setTimeout or to an array method, and the reason React class components needed constructor binding.`,
    hints: ['What is to the left of the dot when inc() is called?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'arrow-vs-regular',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `const obj = {
  name: 'obj',
  regular() {
    return this.name
  },
  arrow: () => this?.name,
}

console.log(obj.regular(), obj.arrow())`,
    expectedAnswer: `'obj' and undefined.`,
    explanation: `The arrow function is defined in the same scope as obj itself, not inside a method, so its this is whatever this was in the surrounding scope: undefined in a module, or globalThis in a script.

An object literal does not create a scope for this. This is why arrow functions are wrong for methods but right for callbacks defined *inside* methods.`,
    hints: ['What is the surrounding this where the arrow is defined?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'call-apply-bind',
    type: 'interview',
    difficulty: 'easy',
    prompt: 'What is the difference between call, apply and bind?',
    expectedAnswer: `All three set this explicitly.

- call invokes immediately, with arguments listed individually: fn.call(obj, a, b)
- apply invokes immediately, with arguments as an array: fn.apply(obj, [a, b])
- bind does not invoke. It returns a new function with this fixed, plus any arguments given now prepended to those given later.

Spread has made apply largely unnecessary: fn.call(obj, ...args) does the same job.`,
    explanation: `The distinction worth stating is that bind is the odd one out because it is lazy. The mnemonic most people use is that apply takes an array.`,
    hints: [],
    tags: ['this', 'functions'],
  },
  {
    id: 'settimeout-this',
    type: 'debugging',
    difficulty: 'medium',
    prompt: 'This timer never updates the count. Explain why, and give two fixes.',
    code: `const timer = {
  count: 0,
  start() {
    setInterval(function () {
      this.count += 1
    }, 1000)
  },
}`,
    expectedAnswer: `The callback is a regular function called by the host, not as a method, so this is not timer. In browsers it ends up as the Window object, so it increments a global rather than timer.count.

Fix one, an arrow function, which closes over start's this:

  setInterval(() => { this.count += 1 }, 1000)

Fix two, bind:

  setInterval(function () { this.count += 1 }.bind(this), 1000)`,
    explanation: `The arrow function is the right answer in modern code, and it is worth knowing why it works: it has no this of its own, so the lookup continues outward to start's this, which is timer.

Before arrows existed the common trick was const self = this, which is the same idea using a closure.`,
    hints: ['Who calls the interval callback, and how?'],
    tags: ['this', 'functions', 'async'],
  },
  {
    id: 'bind-once',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `function whoAmI() {
  return this.name
}

const a = { name: 'a' }
const b = { name: 'b' }

const bound = whoAmI.bind(a)
const reBound = bound.bind(b)

console.log(bound(), reBound(), bound.call(b))`,
    expectedAnswer: `'a', 'a', 'a'`,
    explanation: `bind is permanent. The function it returns ignores every later attempt to change this, whether by binding again or by call and apply. Rebinding produces a wrapper whose own this is irrelevant, because the inner bound function already fixed it.

The one exception is new: calling a bound function with new uses the new instance as this and discards the bound value.`,
    hints: ['Can a bound function ever be rebound?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'class-field-vs-method',
    type: 'scenario',
    difficulty: 'medium',
    prompt:
      'A colleague writes every class method as an arrow-function class field so that `this` is never lost. What are the trade-offs?',
    expectedAnswer: `It works: a class field is created per instance and captures the instance's this, so the method can be passed anywhere safely.

The costs:
- Each instance gets its own function object rather than sharing one on the prototype, so many instances use more memory.
- The method is not on the prototype, so it cannot be overridden by a subclass in the usual way, and it is invisible to code that inspects the prototype.
- It cannot be called with super.

I would use a normal method by default and reach for a field only where the method is genuinely passed as a callback.`,
    explanation: `The memory point is real but usually small; the prototype and inheritance point is the one that actually bites, because it changes the shape of the class rather than just its cost.`,
    hints: [],
    tags: ['this', 'objects'],
  },
  {
    id: 'implement-call',
    type: 'coding',
    difficulty: 'hard',
    prompt: 'Implement Function.prototype.myCall without using call, apply or bind.',
    expectedAnswer: `Function.prototype.myCall = function (context, ...args) {
  const target = context ?? globalThis
  const key = Symbol('fn')

  target[key] = this
  try {
    return target[key](...args)
  } finally {
    delete target[key]
  }
}`,
    explanation: `The trick is that a method call sets this to the object left of the dot, so temporarily attaching the function to the target object gives exactly the binding you want.

Using a Symbol rather than a string key avoids clobbering an existing property, and the finally block cleans up even if the function throws. Both details are what an interviewer is actually watching for.`,
    hints: [
      'What is the one call form that sets this without call or apply?',
      'How do you avoid overwriting an existing property?',
    ],
    tags: ['this', 'functions', 'objects'],
  },
]
