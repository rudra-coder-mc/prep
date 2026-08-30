import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-decides-this',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What determines the value of `this` in a regular function?',
    options: [
      'The scope it was written in. this resolves outward through the enclosing scopes like any other name, so a method always sees the object literal it was defined inside',
      'How it is called. new gives a fresh object, call, apply and bind set it directly, a method call sets it to the object left of the dot, and a plain call gives undefined in strict code',
      'The object it was defined on. A function written as a property of obj keeps obj as its this wherever it is later called from',
      'The object left of the dot at the call site, for every kind of function. An arrow function called as obj.fn() sees obj, the same as a method would',
    ],
    correctOption: 1,
    answerInFull: `How it is *called*, not where it is defined. In precedence order:

1. new: this is the newly created object.
2. Explicit binding: call, apply or bind set it directly.
3. Method call: obj.fn() sets this to obj, the thing left of the dot.
4. Plain call: fn() gives undefined in strict mode and modules, globalThis otherwise.

Arrow functions are the exception. They have no this of their own and close over the surrounding one lexically, so nothing at the call site can change it, including call and apply.

"Left of the dot" is the useful shorthand for the common case, and it immediately explains why pulling a method off its object breaks it, because there is no longer anything left of the dot.`,
    explanation: `The lexical answer is the closure rule applied to this. It is exactly right for arrow functions and exactly wrong for everything else, which is why the two kinds exist: a regular function's this is the one thing in its body that scope does not decide.

"The object it was defined on" is what the lexical model predicts for a method, and it is the belief that breaks when a method is passed as a callback. The function does not remember its object. Only the call site knows.

The last option has the shorthand right and its limit wrong. Left of the dot decides this for a regular function. An arrow function ignores the dot, and call and apply, and bind.`,
    hints: ['Is this decided when the function is written, or when it is called?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'lost-this-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this do, run as a module?',
    code: `const counter = {
  count: 0,
  increment() {
    this.count += 1
    return this.count
  },
}

const inc = counter.increment
console.log(inc())`,
    options: [
      'Prints 1',
      'Prints NaN',
      "Throws a TypeError: Cannot read properties of undefined (reading 'count')",
      'Prints undefined',
    ],
    correctOption: 2,
    answerInFull: `It throws: "Cannot read properties of undefined (reading 'count')".

Assigning the method to a variable copies the function, not the relationship to the object. Nothing is left of the dot at the call site, so this is not counter. A module is strict code, and a plain call in strict code leaves this undefined, so the first property read fails.

In a sloppy script the same code prints NaN instead, because this is globalThis, globalThis.count is undefined, and undefined + 1 is NaN. Same bug, quieter failure.

This is the same bug as passing a method to setTimeout or to an array method, and the reason React class components needed constructor binding.`,
    explanation: `1 is the belief that the binding travels with the function: inc was taken from counter, so it still counts on counter. It does not. The method has no memory of where it came from.

NaN is the right answer in the wrong mode. It is what a sloppy script prints, and the reader who knows the bug from old browser code expects it here. A module is always strict, and strict code refuses to hand over globalThis.

undefined is the reader who has this as undefined and stops there, without noticing that the very next thing the function does is read a property off it.`,
    hints: ['What is to the left of the dot when inc() is called?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'arrow-vs-regular',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print, run as a module?',
    code: `const obj = {
  name: 'obj',
  regular() {
    return this.name
  },
  arrow: () => this?.name,
}

console.log(obj.regular(), obj.arrow())`,
    options: [
      "'obj' and 'obj'",
      "'obj' and undefined",
      'undefined and undefined',
      'It throws, because this is undefined inside the arrow and reading a property of undefined is a TypeError',
    ],
    correctOption: 1,
    answerInFull: `'obj' and undefined.

The arrow function is defined in the same scope as obj itself, not inside a method, so its this is whatever this was in the surrounding scope: undefined at the top level of a module, or globalThis in a script. The optional chain is what turns that into undefined rather than an error.

An object literal does not create a scope for this. That is why arrow functions are wrong for methods but right for callbacks defined *inside* methods, where the surrounding this is the method's, which is the object.`,
    explanation: `'obj' twice is the reader who treats the arrow as a method because it sits in the object literal. The braces of a literal are not a scope, and the arrow never looks at the dot.

undefined twice has the arrow right and the method wrong. The regular function is called as obj.regular(), so this is obj and the name is there.

The throw is the correct reasoning about this, stopped one token early. this is undefined inside the arrow, and this.name would throw. The code says this?.name, and the optional chain is there precisely so the question is about the binding and not about the error.`,
    hints: ['What is the surrounding this where the arrow is defined?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'call-apply-bind',
    type: 'interview',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'An interviewer asks for the difference between call, apply and bind. Which answer is correct?',
    options: [
      'call and apply invoke the function immediately with this set: call takes the arguments listed individually, apply takes them as an array. bind does not invoke. It returns a new function with this fixed, plus any arguments given now prepended to those given later',
      'All three invoke the function immediately with this set. call and apply differ in how they take arguments, and bind additionally remembers this for later calls of the original function',
      'call and apply invoke the function immediately with this set: call takes the arguments as an array, apply takes them listed individually. bind returns a new function with this fixed',
      'call and apply override this for one call. bind changes this on the original function permanently, so every later call of it uses the bound object',
    ],
    correctOption: 0,
    answerInFull: `All three set this explicitly.

- call invokes immediately, with arguments listed individually: fn.call(obj, a, b)
- apply invokes immediately, with arguments as an array: fn.apply(obj, [a, b])
- bind does not invoke. It returns a new function with this fixed, plus any arguments given now prepended to those given later.

Spread has made apply largely unnecessary: fn.call(obj, ...args) does the same job.

The distinction worth stating is that bind is the odd one out because it is lazy. The mnemonic most people use is that apply takes an array.`,
    explanation: `"All three invoke immediately" misses the one thing that makes bind useful. It exists for the case where you are not the caller: something else will call the function later, and the binding has to travel with it.

The swapped option has call taking the array. Apply, array, both start with a: that is the mnemonic, and it is the one detail of the three that interviewers check by asking you to write one.

"Changes the original function permanently" is what bind looks like from the outside and is not what happens. The original is untouched. bind returns a second function that wraps it, which is why you have to keep the return value, and why binding in a constructor assigns it back to this.method.`,
    hints: [],
    tags: ['this', 'functions'],
  },
  {
    id: 'settimeout-this',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This timer never updates timer.count. Why?',
    code: `const timer = {
  count: 0,
  start() {
    setInterval(function () {
      this.count += 1
    }, 1000)
  },
}

timer.start()`,
    options: [
      'The callback reads this.count once when setInterval registers it, so every tick increments a stale copy of the value. An arrow function fixes it because arrows read their variables live',
      'The callback is written with the function keyword, so it runs in the global scope and this.count is a global. Writing it as a function declaration inside start would fix it',
      "The callback is a regular function that the host calls with no receiver, so its this is not timer. Either an arrow function, which closes over start's this, or .bind(this) on the callback fixes it",
      'this is timer inside the callback and the increment works, but start() returns before the first tick fires, so anything that reads timer.count straight after start() sees 0',
    ],
    correctOption: 2,
    answerInFull: `The callback is a regular function called by the host, not as a method, so this is not timer. In browsers it ends up as the Window object, so it increments a global rather than timer.count.

Fix one, an arrow function, which closes over start's this:

  setInterval(() => { this.count += 1 }, 1000)

Fix two, bind:

  setInterval(function () { this.count += 1 }.bind(this), 1000)

The arrow function is the right answer in modern code. It works because it has no this of its own, so the lookup continues outward to start's this, which is timer.

Before arrows existed the common trick was const self = this, which is the same idea using a closure.`,
    explanation: `The stale copy option has the fix right and the reason wrong. Nothing is copied at registration. The callback reads this.count live every tick; it is just reading it off the wrong object.

"Runs in the global scope" is the definition-site model again. Where the callback is written changes nothing about its this, and a function declaration would lose its receiver the same way, because setInterval still calls it plainly.

The last option is the only one where the code works, and the code does not work. It is the reader who assumes the callback inherits start's this because it is nested inside start, which is precisely the assumption arrow functions were introduced to make true.`,
    hints: ['Who calls the interval callback, and how?'],
    tags: ['this', 'functions', 'async'],
  },
  {
    id: 'bind-once',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function whoAmI() {
  return this.name
}

const a = { name: 'a' }
const b = { name: 'b' }

const bound = whoAmI.bind(a)
const reBound = bound.bind(b)

console.log(bound(), reBound(), bound.call(b))`,
    options: ["'a', 'b', 'b'", "'a', 'a', 'b'", "'a', 'a', 'a'", "'a', 'b', 'a'"],
    correctOption: 2,
    answerInFull: `'a', 'a', 'a'

bind is permanent. The function it returns ignores every later attempt to change this, whether by binding again or by call and apply. Rebinding produces a wrapper whose own this is irrelevant, because the inner bound function already fixed it.

The one exception is new: calling a bound function with new uses the new instance as this and discards the bound value.`,
    explanation: `'a', 'b', 'b' is bind treated as a default that any later binding can replace. It is a fixed value, not a default.

'a', 'a', 'b' is the reader who knows a second bind does nothing and believes call is stronger. call on a bound function is received by the wrapper, which throws the receiver away and calls the inner function with the this it was given at bind time.

'a', 'b', 'a' has the two the other way round: rebind wins, call loses. Neither wins. The first bind decided, and nothing that comes after it is consulted.`,
    hints: ['Can a bound function ever be rebound?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'binding-precedence-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them, run as a module.',
    code: `function whoAmI() {
  console.log(this?.label ?? 'no receiver')
}
const lexical = () => console.log(this?.label ?? 'lexical')

const owner = { label: 'owner', whoAmI }
const holder = { label: 'holder', whoAmI }
const bound = whoAmI.bind({ label: 'bound' })

bound.call({ label: 'caller' })
lexical.call(owner)
const detached = holder.whoAmI
detached()`,
    items: ['owner', 'no receiver', 'caller', 'bound', 'holder', 'lexical'],
    correctOrder: [3, 5, 1],
    answerInFull: `bound, lexical, no receiver

Three calls, each settling this a different way.

bound.call({ label: 'caller' }) prints bound. bind fixed the receiver when the bound function was made, and call on a bound function is received by the wrapper, which ignores it.

lexical.call(owner) prints lexical. An arrow has no this of its own, so call has nothing to set. It closes over the this of the module's top level, which is undefined, and the optional chain turns that into the fallback.

detached() prints no receiver. The function was pulled off holder into a variable, so at the call site there is nothing left of the dot. In a module that is strict code, and a plain call leaves this undefined.

Neither owner nor holder is ever printed. owner is only ever used as an argument to call on an arrow, and holder is the object the method was taken from, which the method does not remember.`,
    explanation: `caller is the reader who has call beating bind. The order of precedence is new, then bind, then call and apply, then the dot, then nothing, and a bound function has already moved past the point where call is consulted.

owner is call applied to an arrow function. The arrow has no this to set, so call passes the receiver to nobody.

holder is the belief that a method carries its object with it. It does not. The object is decided at the call site, and at the call site of detached() there is no object.`,
    hints: [
      'Which of the three calls gives call something to set?',
      'What is left of the dot when detached() runs?',
    ],
    tags: ['this', 'functions'],
  },
  {
    id: 'class-field-vs-method',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'A colleague writes every class method as an arrow-function class field so that `this` is never lost. What are the trade-offs?',
    answerInFull: `It works: a class field is created per instance and captures the instance's this, so the method can be passed anywhere safely.

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
    form: 'choice',
    tier: 'staff',
    prompt:
      'Implement Function.prototype.myCall without using call, apply or bind. Which of these is correct?',
    options: [
      'Function.prototype.myCall = function (context, ...args) {\n  const target = Object.create(context)\n  target.fn = this\n  return target.fn(...args)\n}',
      "Function.prototype.myCall = function (context, ...args) {\n  const target = context ?? globalThis\n  const key = Symbol('fn')\n  target[key] = this\n  try {\n    return target[key](...args)\n  } finally {\n    delete target[key]\n  }\n}",
      'Function.prototype.myCall = function (context, ...args) {\n  const fn = this\n  const run = () => fn(...args)\n  return run.call(context)\n}',
      'Function.prototype.myCall = function (context, ...args) {\n  const target = context ?? globalThis\n  target.fn = this\n  const result = target.fn(...args)\n  delete target.fn\n  return result\n}',
    ],
    correctOption: 1,
    answerInFull: `Function.prototype.myCall = function (context, ...args) {
  const target = context ?? globalThis
  const key = Symbol('fn')

  target[key] = this
  try {
    return target[key](...args)
  } finally {
    delete target[key]
  }
}

The trick is that a method call sets this to the object left of the dot, so temporarily attaching the function to the target object gives exactly the binding you want.

Using a Symbol rather than a string key avoids clobbering an existing property, and the finally block cleans up even if the function throws. Both details are what an interviewer is actually watching for.`,
    explanation: `The string-key version is the one most people write first, and it is the answer the follow-up question exists for. If context already has a property called fn, it is overwritten and then deleted. If the function throws, fn is left behind on the object. The Symbol and the finally are the two fixes, and an interviewer who asks this question is waiting for both.

Object.create(context) is the tempting one, because it feels safer: attach the function to a throwaway object that inherits from context, and nothing on context is ever touched. The cost is that this becomes the throwaway object, not context. Reads still work through the prototype chain, but any write inside the function lands on the copy and is lost, so a function that sets this.label changes nothing on context.

The arrow version breaks the rule the question set and also does not work. An arrow function has no this for call to set, so run.call(context) runs fn as a plain call and this is undefined.`,
    hints: [
      'What is the one call form that sets this without call or apply?',
      'How do you avoid overwriting an existing property?',
    ],
    tags: ['this', 'functions', 'objects'],
  },
  {
    id: 'arrow-this-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What determines `this` inside an arrow function?',
    options: [
      'The scope it was defined in, lexically',
      'The object it is called on',
      'Whatever was passed to call or apply',
      'It is always undefined',
    ],
    correctOption: 0,
    answerInFull: `An arrow function has no this of its own, so the name resolves outward through the scope chain like any other variable. Written inside a method, it sees the method's this. Written at the top level of a module, it sees undefined, because that is what this is there.

That also means call, apply and bind cannot change it. There is nothing for them to set. It is exactly why arrows are the fix for a callback that loses its receiver: the receiver is captured where the callback is written, and nothing the caller does later can take it away.`,
    explanation: `"The object it is called on" is the rule for regular functions, and it is the reason an arrow is the wrong way to write a method: obj.arrow() sees no obj.

"Always undefined" is what an arrow at the top level of a module shows, and it is a coincidence of where it was written rather than a property of arrows. The same arrow inside a method sees the object.`,
    hints: [],
    tags: ['this', 'arrow-functions'],
  },
  {
    id: 'new-beats-bind-choice',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `function Person(name) {
  this.name = name
}

const Bound = Person.bind({ name: 'ignored' })
const person = new Bound('Ada')

console.log(person.name)`,
    options: [
      "'ignored'",
      'TypeError: Bound is not a constructor',
      "'Ada'",
      'undefined, because the name was written onto the object passed to bind',
    ],
    correctOption: 2,
    answerInFull: `'Ada'

new sits above bind in the order of precedence. Calling a bound function with new creates a fresh object, uses it as this, and discards the receiver that bind fixed. The bound arguments are still honoured, which is what makes bind usable for partial application of a constructor: Person.bind(null, 'Ada') gives a function that new can call with no arguments.

The one thing bind permanently fixes is the receiver for ordinary calls. new is the only caller it cannot say no to.`,
    explanation: `'ignored' is the previous question's lesson over-applied. bind is permanent against call, apply and a second bind. It is not permanent against new, which is the one exception the rule has.

"Not a constructor" is a reasonable guess, because arrow functions and methods are not constructors and a bound function looks like it might be another wrapper in that family. It is constructible whenever the original is.

The last option has the write landing on the object passed to bind, and then reads the name off the new instance. If bind had won, person.name would be 'Ada' on the ignored object and undefined here, which is a consistent picture of the wrong rule. new never lets it get that far.`,
    hints: ['Which comes first in the order of precedence, new or bind?'],
    tags: ['this', 'binding'],
  },
  {
    id: 'two-receivers-one-function-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const user = {
  name: 'Ada',
  greet() {
    return \`Hi, \${this.name}\`
  },
}

const other = { name: 'Grace', greet: user.greet }

console.log(user.greet(), other.greet())`,
    options: [
      "'Hi, Ada' and 'Hi, Ada'",
      "'Hi, Ada' and 'Hi, Grace'",
      "'Hi, Ada' and 'Hi, undefined'",
      "'Hi, Ada' and then a TypeError",
    ],
    correctOption: 1,
    answerInFull: `Hi, Ada and Hi, Grace.

There is one function here, not two. user.greet and other.greet are the same function object, because assigning it to another property copies a reference and nothing else.

this is decided by the call, and both of these are method calls, so each one gets the object left of the dot. The function has no memory of the literal it was written inside.

That is the rule stated the way round that makes it useful. The famous version is the one where it goes wrong, a method pulled into a bare variable and called with nothing left of the dot, and it is the same rule: no dot, no receiver.`,
    explanation: `Hi, Ada twice is the belief that a function remembers where it was written. If that were so, borrowing a method would be impossible, and borrowing is what call and apply exist for.

Hi, undefined is the reader expecting the copy to lose its receiver. Assigning the function to a property keeps a dot at the call site. It is assigning it to a bare variable that takes the dot away.

The TypeError is that same expectation carried one step further, to this being undefined and the property read off it throwing. That is what would happen to a bare const greet = user.greet, called as greet().`,
    hints: ['How many functions are there, and what is left of the dot in each call?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'plain-call-this-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A regular function is called on its own as fn(), with nothing left of the dot. What is this inside it?',
    options: [
      'globalThis, in every mode. A plain call has no receiver, so the global object stands in for one',
      'undefined, in every mode. A function called with no receiver has no this at all, which is what arrow functions were introduced to fix',
      'The function itself, since that is the only object involved in the call',
      'undefined in a module or in strict mode, and globalThis otherwise',
    ],
    correctOption: 3,
    answerInFull: `undefined in strict code, which includes every ES module and every class body, and globalThis in a sloppy script.

The precision matters because the two modes fail differently. In strict code the first property read off this throws a TypeError that names the line. In sloppy code the same mistake silently reads or writes a property on the global object, so a method that has lost its receiver does not crash, it corrupts a global and surfaces somewhere else entirely.

It is the same bug either way, and the reason the lost this bug was so hard to find in old browser code and is loud in modern code. That is a decent argument for modules on its own.`,
    explanation: `globalThis in every mode is the pre-2015 answer, and substituting the global object is exactly what strict mode was changed to stop. It hid the mistake.

undefined in every mode is half right and gets the reason wrong. A plain call in a sloppy script does have a this, and arrow functions were introduced for the callback case, where you want the surrounding this rather than none.

"The function itself" is a guess borrowed from other languages. No call form sets this to the function being called; the closest thing is a named function expression, which binds its own name, not this.`,
    hints: [],
    tags: ['this', 'functions'],
  },
  {
    id: 'forgot-new-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this do, run as a module?',
    code: `function Point(x) {
  this.x = x
}

const a = new Point(3)
const b = Point(5)

console.log(a.x, b)`,
    options: [
      'It prints 3 and undefined',
      'It prints 3 and 5',
      "It throws TypeError: Cannot set properties of undefined (setting 'x')",
      'It prints 3 and undefined, and leaves a global x set to 5',
    ],
    correctOption: 2,
    answerInFull: `It throws: "Cannot set properties of undefined (setting 'x')", on the line that calls Point without new.

new is the first of the four call forms. It creates a fresh object, sets this to it, runs the body and returns that object unless the body returns an object of its own. Take new away and the call is an ordinary plain call, so this is undefined in a module and the first line of the body writes to it.

The same code in a sloppy script prints 3 and undefined, and quietly sets a global x to 5, because there a plain call gets globalThis. Same mistake, no error, and a global nobody meant to create.

A class is the protection worth knowing about: calling one without new is always a TypeError that says so, in every mode. It is one of the smaller reasons to prefer class over a constructor function.`,
    explanation: `3 and 5 is new read as decoration. Even in the mode where the call succeeds, b would be undefined, because a plain call returns what the body returns and this body returns nothing.

3 and undefined is the sloppy script answer with its side effect left out, which is the half of that behaviour people remember.

The last option is the sloppy script answer in full, and it is exactly right for a file loaded with a script tag. A module is strict, and strict code leaves this undefined rather than substituting the global object, so the write throws instead of landing somewhere.`,
    hints: ['What is this in a plain call, run as a module?'],
    tags: ['this', 'functions'],
  },
  {
    id: 'bind-partial-application-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function log(level, message) {
  return \`[\${level}] \${message}\`
}

const warn = log.bind(null, 'WARN')

console.log(warn('disk full'))`,
    options: ['[disk full] WARN', '[WARN] disk full', '[disk full] undefined', '[WARN] undefined'],
    correctOption: 1,
    answerInFull: `[WARN] disk full

bind does two things, and the second is the one people forget. It fixes this, and it prepends any arguments given at bind time to whatever the caller passes later. So warn('disk full') calls log('WARN', 'disk full').

That is partial application, and it is most of what bind is used for in code with no this to worry about. null is the conventional first argument when the function never reads this, and it reads as "no receiver, I am here for the arguments".

An arrow says the same thing more plainly:

  const warn = (message) => log('WARN', message)

Reach for bind when the function is being handed to something that will call it later, and for the arrow when you are writing the wrapper anyway.`,
    explanation: `[disk full] WARN is the bound argument appended rather than prepended. Prepending is what makes bind useful, because it fixes the front of a signature and leaves the rest open.

[disk full] undefined is bind read as setting this and nothing else, with the extra argument dropped on the floor. bind never discards an argument.

[WARN] undefined is the opposite reading: bind freezes the whole argument list at bind time, so the caller's argument is the one thrown away. The bound function passes both along, in that order.`,
    hints: ['Where does the argument given to bind end up in the call?'],
    tags: ['this', 'functions'],
  },
]
