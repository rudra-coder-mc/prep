import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-is-a-higher-order-function',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What makes a function a higher order function?',
    options: [
      'It returns a function, so the returned one closes over what it was built with',
      'It is written in a functional style, with no loops and no mutation',
      'It takes a function as an argument, returns a function, or both',
      'It works on values of any type, because it never inspects its arguments',
    ],
    correctOption: 2,
    answerInFull: `A higher order function is one that takes a function as an argument, returns a function, or both. It is possible because functions in JavaScript are ordinary values: they can be stored, passed and returned like any object.

What it buys is that the varying step of an algorithm becomes a parameter. Two pieces of code that differ only in one step collapse into one implementation plus a callback, and the wrapper and the work no longer have to know anything about each other.

Examples worth naming: map, filter and reduce take one; once, memoize and debounce return one; Express middleware and React higher order components are the returning kind at a larger scale.`,
    explanation: `Returning a function is half the definition, and it is the half people remember, because middleware and decorators are the memorable examples. Taking one is the half that covers map, forEach, setTimeout and addEventListener, which is nearly everything anybody actually writes.

Functional style is an aesthetic, not a definition. A reduce implemented with a for loop and a reassigned accumulator is still a higher order function.

The last option is a different idea altogether. Working on any type is parametric polymorphism, and a function can be higher order without being generic or generic without being higher order.

The answer that stops at "it makes code reusable" is true of every abstraction and says nothing. Naming the mechanism, that a step becomes an argument, is what leads into the follow-up, which is always a request to implement one.`,
    hints: ['What kind of value is a function in JavaScript?'],
    tags: ['functions', 'callbacks'],
  },
  {
    id: 'foreach-return-and-throw',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const items = ['a', 'b', 'c']

try {
  items.forEach((item) => {
    if (item === 'b') return
    if (item === 'c') throw new Error('stop')
    console.log('item ' + item)
  })
  console.log('forEach finished')
} catch (error) {
  console.log('caught ' + error.message)
}

console.log('after')`,
    items: ['forEach finished', 'item a', 'item c', 'caught stop', 'item b', 'after'],
    correctOrder: [1, 3, 5],
    answerInFull: `item a, caught stop, after

Three rules, one for each line that is missing.

return inside a forEach callback ends that one call and nothing more. The loop carries straight on with the next element, so it behaves like continue rather than break, which is why "item b" is skipped rather than the iteration stopping there.

A throw inside the callback is not caught by forEach. The callback runs on top of forEach, which runs on top of your code, so the error unwinds all three frames together. That is why the try around forEach catches it, and why "forEach finished" never runs: control jumps from inside the callback to the catch block.

"item c" never prints because the throw on that pass happens before the log.

The sentence to carry away is that a callback runs on the caller's stack. return returns from the callback, and throw travels back out through everything that called it.`,
    explanation: `"forEach finished" is in the pool for anyone who reads forEach as containing the error, the way a loop with a try inside its body would. Nothing in forEach catches anything, and nothing in it is even aware an error was raised.

"item b" covers two misreadings at once. If return were ignored, b would print like the others. If it were a break, b and c would both be skipped, no error would be thrown, and "forEach finished" would print instead. Neither happens: return skips exactly one element and the loop carries on.

"item c" is there for a reader who puts the log before the throw on that pass. Which of the two lines comes first is the only thing deciding whether it prints.`,
    hints: ['What does return do inside a forEach callback, and what does throw do?'],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'async-foreach',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This logs "all saved" immediately, with every save still in flight. Why?',
    code: `async function saveAll(items) {
  items.forEach(async (item) => {
    await save(item)
  })
  console.log('all saved')
}`,
    options: [
      'The callback is async, so forEach calls every one of them without awaiting, and only a for...of loop can await a callback',
      'forEach ignores what its callback returns, so the promise each call produces is dropped and nothing is left holding it',
      'save is called without await inside the arrow, so each call is fire and forget',
      'saveAll is async but never awaits anything, so its body runs straight through to the end',
    ],
    correctOption: 1,
    answerInFull: `forEach ignores whatever its callback returns.

The async callback returns a promise as soon as it hits the first await. forEach throws that promise away, starts the next call straight away, finishes the loop, and saveAll reaches the log with every save still in flight. Nothing is awaited because nothing is holding the promises.

Fix one, sequential:

  for (const item of items) {
    await save(item)
  }

Fix two, concurrent:

  await Promise.all(items.map((item) => save(item)))

They are not interchangeable. The first saves one at a time and stops at the first failure. The second starts everything at once and rejects on the first failure while the rest keep running. Which one is right depends on whether the saves can run in parallel and on what should happen when one of them fails.

The root cause is a property of forEach rather than of async: it has no way to consume a return value, so it can never wait for one. Any higher order function that discards its callback's result has the same problem, which is why the Promise.all fix starts by switching to map.`,
    explanation: `The first option has the shape right and the reason wrong. It is not that a callback cannot be awaited. It is that forEach drops the value that would be awaited. map keeps those promises, and Promise.all over them waits perfectly well.

The second option is worth reading the code again for. There is an await inside the arrow and it does suspend that callback. What it cannot do is suspend forEach, which has already moved on to the next element.

The last option is true, and it is the symptom rather than the cause. Putting await in front of items.forEach(...) awaits undefined, which resolves immediately and changes nothing.`,
    hints: [
      'What does an async function return the moment it awaits?',
      'What does forEach do with that value?',
    ],
    tags: ['functions', 'callbacks', 'async'],
  },
  {
    id: 'implement-reduce',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are implementing reduce(array, fn, initial) by hand. How should it decide whether an initial value was passed?',
    options: [
      'Test initial === undefined, and start from the first element when it is',
      'Give initial a default of array[0] in the parameter list, so the default does the work',
      'Count the arguments, because undefined is a legitimate initial value',
      'Test initial == null, so that null and undefined both count as no initial value',
    ],
    correctOption: 2,
    answerInFull: `Count the arguments:

  function reduce(array, fn, ...rest) {
    const hasInitial = rest.length > 0
    let acc = hasInitial ? rest[0] : array[0]
    let index = hasInitial ? 0 : 1

    if (!hasInitial && array.length === 0) {
      throw new TypeError('Reduce of empty array with no initial value')
    }

    for (; index < array.length; index++) {
      acc = fn(acc, array[index], index, array)
    }

    return acc
  }

Three details separate a real answer from a sketch.

Whether an initial value was passed has to be decided by counting arguments rather than by testing for undefined, because undefined is a legitimate initial value. A rest parameter is the cleanest way to count, and arguments.length is the older one.

The callback takes four arguments, accumulator, value, index and array, not two.

Without an initial value the first element becomes the accumulator and the callback is never called with it, so a single element array returns that element with zero calls. An empty array with no initial value is a TypeError, which is the case people forget until it happens in production.`,
    explanation: `Testing for undefined is what almost every hand-written reduce does, including the one in this topic's lesson, and it is wrong for exactly one input: reduce(xs, fn, undefined). That looks contrived until the initial value arrives from a lookup or a config object that returned nothing.

Defaulting the parameter to array[0] has the same hole and adds another. A default is applied precisely when the argument is undefined, so it cannot tell the two cases apart either, and it leaves the loop starting at index 0, which feeds the first element in twice.

Treating null as absent is the same mistake made wider, and null is an even more plausible accumulator than undefined.`,
    hints: [
      'How do you tell "no initial value" apart from "an initial value of undefined"?',
      'How many arguments does the real callback receive?',
      'What should an empty array with no initial value do?',
    ],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'function-identity',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function makeHandler() {
  return () => console.log('click')
}

const first = makeHandler()
const second = makeHandler()

console.log(first === second, String(first) === String(second))`,
    options: ['true true', 'false true', 'false false', 'true false'],
    correctOption: 1,
    answerInFull: `false true

Every evaluation of a function expression creates a new function object, so two calls to makeHandler produce two objects that happen to have identical source. Comparing them with === compares identity, which is false.

Converting them to strings compares their source text, which is the same, so that is true. Nothing in the language treats two functions as equal because they look alike.

That is exactly why removeEventListener needs the same object you added rather than an equivalent one, why bind returns a new function every time it is called, and why an inline arrow in a dependency array never settles.`,
    explanation: `true true is equality by value, which no part of JavaScript applies to functions or to any other object. If it did, every inline callback would be interchangeable and none of the identity bugs in this topic would exist.

false false is the answer if identity is assumed to leak into the string. It does not. Function.prototype.toString returns source text, and two functions written the same way stringify the same.

true false is the same belief the other way round, that toString produces something unique per object. Nothing on a function hands you its address.`,
    hints: ['How many function objects does calling makeHandler twice create?'],
    tags: ['functions', 'references'],
  },
  {
    id: 'listener-never-removed',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A widget adds a scroll listener when it opens and removes it when it closes. Listeners keep accumulating and scrolling gets slower on every reopen. The add and remove calls both look correct. What would you check first?',
    options: [
      'Whether removeEventListener failed, since it returns false when nothing matched and that is easy to miss',
      'Whether scroll events are arriving faster than the handler runs, so they pile up',
      'Whether the handler is created inline at both call sites, so the function passed to remove is a different object from the one added',
      'Whether the widget is ever opened twice without being closed in between, so one add has no matching remove',
    ],
    correctOption: 2,
    answerInFull: `Almost certainly the handler is being created inline in both places, so the function passed to removeEventListener is a different object from the one that was added:

  window.addEventListener('scroll', () => this.onScroll())
  window.removeEventListener('scroll', () => this.onScroll())

removeEventListener matches by identity, together with the type and the capture flag. Two arrow functions with the same body are two objects, so the remove silently matches nothing and the old listener stays attached.

The fix is to hold on to the one function:

  const handler = () => this.onScroll()
  window.addEventListener('scroll', handler)
  // later
  window.removeEventListener('scroll', handler)

An AbortController signal passed to addEventListener is the modern alternative, and it removes the whole class of bug because there is nothing to match.

Two other things worth checking: that the capture flag matches on both calls, and that a bound method is not being re-bound at each call site, since bind also returns a new function every time.

The reason this bug survives review is that both lines read correctly in isolation. Nothing warns you, because removeEventListener with an unmatched handler is not an error.`,
    explanation: `The first option is tempting because a return value would be exactly what you want here, and there is none. removeEventListener returns undefined whether it removed something or not, which is why the bug is silent.

Events arriving faster than the handler runs is a real problem with a different signature: it makes scrolling janky while the widget is open, and it does not accumulate across reopens or survive a close.

Unbalanced opens are worth ruling out with a counter, and they would explain accumulation. They do not fit a widget where every open is paired with a close, which is what the report describes, so it is the second thing to check rather than the first.

The general rule is that any API which registers a function and later unregisters it is comparing identity, so the function has to be stored somewhere.`,
    hints: ['How does removeEventListener decide which listener to remove?'],
    tags: ['functions', 'callbacks', 'references'],
  },
  {
    id: 'when-callbacks-hurt',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt: 'When do higher order functions make code worse rather than better?',
    answerInFull: `Four situations where the abstraction costs more than it saves:

- One caller. Pulling a step into a callback so that a single call site can pass it is indirection with nothing on the other side. Wait for the second case.
- Stack traces and debugging. Three layers of wrapper mean an error surfaces inside machinery the reader did not write, and the frame that matters is buried.
- Hot loops. A callback per element is a call per element, and an inlined loop is measurably faster when the array is large and the body is small. Measure before caring.
- Chains that build intermediate arrays. filter then map then reduce walks the data three times and allocates twice. Usually fine, occasionally the thing to fix.

There is also a readability limit. Point free style, where the arguments are never named, reads well for one or two steps and becomes a puzzle beyond that. A plain arrow with named parameters is not a worse answer.`,
    explanation: `Interviewers ask this to find out whether the pattern is a tool or a habit. The candidate who cannot name a downside usually applies it everywhere. Naming the single-caller case in particular shows the judgement they are looking for, because that is the mistake that actually shows up in code review.`,
    hints: [],
    tags: ['functions', 'design'],
  },
  {
    id: 'reduce-single-element',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `let calls = 0

const total = [7].reduce((a, b) => {
  calls += 1
  return a + b
})

console.log(total, calls)`,
    options: ['NaN 1', '7 1', '7 0', 'TypeError: Reduce of empty array with no initial value'],
    correctOption: 2,
    answerInFull: `7 0

With no initial value, reduce takes the first element as the accumulator and starts iterating from the second. A single element array has no second element, so the loop body never runs and the callback is never called at all.

The element is returned through unchanged, so total is 7 and calls is 0. The same rule is why an empty array with no initial value throws a TypeError rather than returning undefined: there is no first element to start from.

Passing an initial value of 0 makes both of those cases ordinary, and the count here would be 1.`,
    explanation: `7 1 is the answer if reduce is read as starting from an implicit zero, which is what nearly every reduce anybody writes looks like, because they sum numbers and pass 0. Without an initial value there is no zeroth call for the first element.

NaN 1 is the more careful version of the same mistake: one call per element, with an accumulator that does not exist yet, so 7 plus undefined. It is what would happen if reduce started at index 0 with the accumulator unset.

The TypeError is the empty array rule applied one element too early. Empty with no initial throws. One element with no initial returns that element untouched.`,
    hints: ['What becomes the accumulator when no initial value is given?'],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'which-is-higher-order-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these is not a higher order function?',
    options: ['setTimeout', 'Array.prototype.map', 'Number.parseInt', 'Function.prototype.bind'],
    correctOption: 2,
    answerInFull: `Number.parseInt.

It takes a string and a radix and returns a number. No function goes in and none comes out, so it is an ordinary function. setTimeout and map take one, and bind returns one.

The definition is only about whether a function is an argument or the result, not about how clever the function is or the style it is written in.

parseInt is worth knowing here for the opposite reason. ['1', '2', '3'].map(parseInt) gives [1, NaN, NaN], because map passes the index as a second argument and parseInt reads it as the radix. It is not a higher order function, and it is the classic victim of one.`,
    explanation: `bind is the one people hesitate over, because nothing goes into it but a this value and some arguments. It returns a function, which is the other half of the definition and the half that middleware, decorators and every wrapper in this topic rest on.

setTimeout is easy to overlook because it is a platform API rather than something that feels like functional programming. Taking a callback is all it takes to qualify.

map is the one nobody doubts, and it is in the list to make the point that this is a question about definitions rather than about difficulty.`,
    hints: [],
    tags: ['functions', 'callbacks'],
  },
  {
    id: 'filter-boolean-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this evaluate to?',
    code: `['0', '', 'false', 0, null, []].filter(Boolean)`,
    options: ["['0', 'false']", '[]', "['0', '', 'false', []]", "['0', 'false', []]"],
    correctOption: 3,
    answerInFull: `['0', 'false', []]

filter(Boolean) keeps everything truthy. The strings "0" and "false" are non-empty strings, so they are truthy whatever they happen to say, and an empty array is an object, so it is truthy too. The empty string, the number 0 and null are the falsy ones and are dropped.

Two things are worth saying about the idiom. It works because Boolean takes exactly one argument, so the index and the array that filter also passes are ignored harmlessly. That is not true of every function you might pass straight through, which is the map(parseInt) trap.

And in TypeScript, filter(Boolean) does not narrow the element type on its own, which is why codebases end up writing a typed isDefined helper instead.`,
    explanation: `['0', 'false'] is the answer if an empty array reads as falsy. Every object is truthy, including [] and {}. It is only == that makes [] look false, and that is coercion to a primitive rather than truthiness.

[] is the answer that reads the strings as their contents, "0" as zero and "false" as false. Truthiness of a string is about its length and nothing else.

The four element answer keeps the empty string, which is the falsy value people forget because they are busy thinking about null and undefined.`,
    hints: [],
    tags: ['functions', 'callbacks', 'coercion'],
  },
  {
    id: 'stop-a-foreach-choice',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'How do you stop iterating early inside a forEach?',
    options: [
      'return false from the callback',
      'break inside the callback',
      'You cannot; use for...of, some, or find instead',
      'return from the callback',
    ],
    correctOption: 2,
    answerInFull: `You cannot. forEach offers no way out.

break is a syntax error, since the callback is a function body rather than a loop body. Returning ends that one call, so it behaves like continue.

What to reach for instead:
- for...of, which supports break directly and also allows await inside the loop.
- some or every, which stop as soon as the callback settles the answer. some is the honest way to write "stop when you find one".
- find or findIndex, which stop at the first match and hand you the element.

The reason to know this rather than look it up is the workaround people invent when they do not: throwing an exception to escape a forEach, catching it outside, and leaving the next reader to work out which errors are control flow and which are real.`,
    explanation: `return false is the jQuery.each convention, where a falsy return really did stop the loop, so the habit is older than most codebases. forEach ignores the return value entirely, along with every other value the callback produces.

break reads as though it should work, because the callback looks like a loop body. It is a function body, so break outside a loop is a syntax error and this one fails before it runs.

Returning is the near miss. It does end the current call, which is enough to look like it worked whenever the elements after it happen not to matter.`,
    hints: [],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'called-instead-of-passed',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'The message appears the moment the page loads, and clicking the button does nothing at all. Why?',
    code: `function save() {
  console.log('saved')
}

button.addEventListener('click', save())`,
    options: [
      'save has no parameters, so it cannot be used as a listener. A listener must accept the event object',
      'The listener has to be registered after the button exists in the DOM, and this line runs too early. Move it inside a load handler',
      'save is a function declaration, so it is hoisted and runs once at registration. Assign it to a const instead',
      'The parentheses call save immediately and pass its return value, undefined, as the listener. Pass the function itself: addEventListener("click", save)',
    ],
    correctOption: 3,
    answerInFull: `save() calls the function. The parentheses are the call, so the log happens at the moment that line runs, and what is handed to addEventListener is what save returned, which is undefined.

Pass the function rather than its result:

  button.addEventListener('click', save)

A listener of undefined is legal, so nothing complains. The browser accepts it and registers nothing, which is why the failure is completely silent. Node is stricter in the equivalent case: setTimeout(save(), 1000) throws a TypeError naming the callback, which is a nicer failure than the one you get here.

When the callback needs an argument, wrap it rather than calling it:

  button.addEventListener('click', () => save(id))

That is the whole distinction a higher order function rests on. save is a value; save() is what running it produces.`,
    explanation: `A listener does not have to accept the event. Every callback is called with whatever arguments the caller supplies, and a function is free to ignore them, which is why the no-parameter version would work perfectly once the parentheses are removed.

The DOM timing option is a real cause of listeners never firing, and it fails differently: button would be null and the line would throw on reading addEventListener of null. Here the line succeeded and the log already ran.

Hoisting is why calling save above its definition works, and it has nothing to do with when it runs. A declaration does not execute itself; the parentheses on the last line did.`,
    hints: ['What is the difference between save and save()?'],
    tags: ['functions', 'callbacks'],
  },
  {
    id: 'returned-function-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `function multiplier(factor) {
  return (n) => n * factor
}

const double = multiplier(2)

console.log(double(5), multiplier(3)(5))`,
    options: ['10 15', '10 10', 'NaN NaN', '2 3'],
    correctOption: 0,
    answerInFull: `10 15

multiplier does not multiply anything. It builds and returns a function that will, and the factor it was given stays available to that function through the closure over multiplier's scope.

double is the function built with a factor of 2, so double(5) is 10. multiplier(3)(5) is the same thing without keeping the intermediate function: the first call returns a function, and the second pair of parentheses calls it with 5.

This is the returning half of what a higher order function is, and it is the shape behind partial application, middleware, and every configure-then-use API. The reason to reach for it is that the configuration and the call happen at different times and in different places.`,
    explanation: `10 10 is the answer if factor were shared between every function multiplier produces. Each call creates a new scope with its own factor, which is exactly why double keeps working after the second call.

NaN NaN is multiplier read as returning n * factor directly, so that the outer call is doing the arithmetic with an n that does not exist yet. It returns the function unevaluated; nothing multiplies until the inner call supplies n.

2 3 reads the second pair of parentheses as doing nothing, leaving each expression at whatever the factor was. Calling the returned function is what produces a number.`,
    hints: ['What does multiplier(3) evaluate to, before the second call?'],
    tags: ['functions', 'closure'],
  },
  {
    id: 'callback-arguments-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What arguments does map call its callback with?',
    options: [
      'The element only',
      'The element and the index',
      'The element, the index and the whole array',
      'The element, the index, the whole array and the accumulator',
    ],
    correctOption: 2,
    answerInFull: `Three: the element, its index, and the array being mapped. forEach, filter, find, some and every all pass the same three.

reduce is the odd one out, and passes four: the accumulator, the element, the index and the array.

The reason to know the count rather than look it up is what happens when you pass an existing function straight through. ['1','2','3'].map(parseInt) gives [1, NaN, NaN], because parseInt's second parameter is the radix and map is supplying the index for it. Boolean survives the same treatment only because it ignores everything past the first argument.

The habit that avoids it is to wrap anything you did not write: .map((s) => parseInt(s, 10)).`,
    explanation: `"The element only" is what almost every callback anybody writes actually uses, so it is the natural assumption. The extra arguments are always sent; the callback usually declines them.

"Element and index" stops one short, and the array is the argument that makes a callback able to look at its neighbours without closing over anything.

The four-argument answer is reduce's signature applied to map. Knowing that reduce is different, and different by having its accumulator first, is worth as much as knowing the three.`,
    hints: [],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'filter-missing-return',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'This is meant to keep the even numbers. It returns an empty array. Why?',
    code: `const nums = [1, 2, 3, 4]

const evens = nums.filter((n) => {
  n % 2 === 0
})

console.log(evens)`,
    options: [
      'The braces make it a block body, so the callback returns undefined on every element. filter keeps the truthy ones, and undefined is falsy, so it keeps none. Either add return, or drop the braces',
      'filter needs a comparison against true, so the callback has to end in === true for the result to count',
      'n % 2 === 0 is a statement rather than an expression, so it is evaluated and thrown away before filter sees it',
      'filter passes the index as well as the element, so n is the index on some calls and the arithmetic is done against the wrong value',
    ],
    correctOption: 0,
    answerInFull: `An arrow function with braces has a block body, and a block body returns undefined unless something in it says return. The callback computes the comparison and discards it, so filter is told undefined for all four elements, and undefined is falsy.

Either say return:

  nums.filter((n) => {
    return n % 2 === 0
  })

or drop the braces, which makes the body an expression and the return implicit:

  nums.filter((n) => n % 2 === 0)

The second is what most code does, and the block form is what you get the moment you add a console.log inside the callback to debug something. Adding a line to a working filter and finding it now matches nothing is this bug, and it is a matter of seconds to spot once you have met it.

The same trap applies to map, which fills its array with undefined, and to sort's comparator, which then never says "before".`,
    explanation: `filter converts whatever the callback returns to a boolean. There is nothing to compare against true, and adding === true would change nothing here, because undefined === true is false as well.

n % 2 === 0 is an expression, and expressions are perfectly legal as statements. That is exactly the problem: it is evaluated, it produces true or false, and then a block body throws the value away rather than returning it.

filter does pass the index as a second argument, and this callback declares one parameter, so it never sees it. n is the element on every call.`,
    hints: ['What does an arrow function with braces return?'],
    tags: ['functions', 'callbacks', 'arrays'],
  },
]
