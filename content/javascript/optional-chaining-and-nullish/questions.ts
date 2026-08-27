import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-nullish-means',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which values does ?? treat as missing?',
    options: [
      'All eight falsy values, the same set || uses',
      'null, undefined and NaN, since none of them is a usable value',
      'null and undefined, and nothing else',
      'null, undefined and the empty string, since an empty string is a missing string',
    ],
    correctOption: 2,
    answerInFull: `null and undefined, the two nullish values. Nothing else.

That is the entire reason ?? exists. || already covered "fall back on anything falsy", and the bug it kept causing was replacing a 0, an empty string or a false that was a real answer. ?? draws the line at "was a value supplied at all", and 0, '', false and NaN are all values that were supplied.

The same pair is what ?. tests for before it short-circuits, so the two operators agree with each other about what missing means.`,
    explanation: `"All eight falsy values" is the || rule. If ?? used it there would be no reason for ?? to exist.

NaN is a value, a number that is not any particular number, and it was produced by something. ?? passes it through, which is occasionally annoying and always consistent: Number('abc') ?? 0 is NaN, and if you want 0 there you want ||.

The empty string is the trap in the other direction. A name that is empty is a name somebody supplied, and ?? keeps it. Whether that is right depends on the data, which is why both operators exist.`,
    hints: ['Why was ?? added when || already existed?'],
    tags: ['null', 'defaults'],
  },
  {
    id: 'short-circuit-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const user = { name: 'Ada', profile: null, tags: [] }

console.log('city', user.profile?.address.city)
console.log('tag', user.tags?.[0] ?? 'none')
console.log('name', user.name?.toUpperCase() || 'anon')
console.log('call', user.greet?.())`,
    items: [
      'tag undefined',
      'city undefined',
      'name anon',
      'tag none',
      'call null',
      'name ADA',
      'city null',
      'call undefined',
    ],
    correctOrder: [1, 3, 5, 7],
    answerInFull: `city undefined
tag none
name ADA
call undefined

user.profile is null, so ?. short-circuits there and the whole chain is undefined. .address.city is never evaluated, which is why there is no throw, and the result is undefined rather than the null that stopped it.

user.tags exists, so ?.[0] reads index 0 of an empty array, which is undefined, and ?? supplies 'none'.

user.name is a string, so the chain calls toUpperCase and gets 'ADA', which is truthy, so || leaves it alone.

user.greet does not exist. ?.() skips the call instead of throwing "greet is not a function", and the expression is undefined.`,
    explanation: `city null is the most common misreading: that ?. returns whatever stopped it. It always produces undefined when it short-circuits, whichever nullish value it met.

tag undefined forgets the ??, or assumes ?.[0] on an empty array short-circuits. The array exists, so the index is read, and the ?? then handles the undefined.

name anon would need toUpperCase to return something falsy. 'ADA' is not, so || keeps it.

call null is the same misreading as city null, applied to the call form. Skipped calls are undefined too.`,
    hints: ['What does ?. produce when it stops?', 'Which left sides are actually nullish?'],
    tags: ['syntax', 'null'],
  },
  {
    id: 'nullish-against-or-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const count = 0
const label = ''
console.log([count || 10, count ?? 10, label || 'n/a', label ?? 'n/a'])`,
    options: [
      "[ 10, 0, 'n/a', '' ]",
      "[ 10, 10, 'n/a', 'n/a' ]",
      "[ 0, 0, '', '' ]",
      "[ 0, 10, '', 'n/a' ]",
    ],
    correctOption: 0,
    answerInFull: `[ 10, 0, 'n/a', '' ]

|| tests for falsy. 0 and '' are both falsy, so both fall through to the right side.

?? tests for nullish. 0 and '' are both values, so both come through unchanged.

The first and third entries are the bug and the feature at once: replacing an empty label with 'n/a' is probably wanted, replacing a count of zero with 10 almost never is. Same operator, same rule, different data.`,
    explanation: `All four falling back is reading ?? as a synonym for ||. The whole point of ?? is the two entries where they differ.

Nothing falling back is the belief that || only fires on null and undefined, which is what people expect it to do the first time 0 disappears.

The last option has the operators swapped. || is the one that replaces falsy values.`,
    hints: ['Which operator cares about falsy, and which about nullish?'],
    tags: ['defaults', 'coercion'],
  },
  {
    id: 'zero-retries-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A caller sets retries: 0 to disable retrying, and the client still retries three times. What is the bug, and what is the fix?',
    code: `function createClient(config = {}) {
  const retries = config.retries || 3
  return { retries }
}`,
    options: [
      '0 is falsy, so || falls through to 3. Use ??, which only falls back on null and undefined: config.retries ?? 3',
      'The default for config is {}, which has no retries, so every caller gets 3. Move the default into the pattern: function createClient({ retries = 3 })',
      'The value arrives as a string "0" from the config file, which is truthy, so Number(config.retries) || 3 fixes it',
      '0 is falsy, so || falls through to 3. Guard the chain with optional chaining first: config?.retries || 3',
    ],
    correctOption: 0,
    answerInFull: `|| falls back on any falsy value and 0 is falsy, so a retries of 0 is replaced with 3. The caller supplied a value and the code threw it away.

  const retries = config.retries ?? 3

?? falls back only on null and undefined, so 0 is kept, and a caller who left retries out still gets 3. This is the canonical example of why ?? was added to the language: the || default had been silently rewriting zeros and empty strings for twenty years.`,
    explanation: `The destructuring default is a real improvement in style and fixes nothing here. A pattern default fires on undefined only, and that is correct behaviour; but the callers who pass 0 were never hitting the default. They were hitting ||, and this rewrite removes the || only by accident. If the body still says retries || 3 anywhere, the bug is back.

The string theory has the diagnosis backwards. "0" is truthy, so a string would have survived ||. The value is a number, and that is why it did not.

Optional chaining changes nothing about the fallback. config?.retries || 3 still feeds 0 to ||, which still replaces it. ?. is about whether config exists, not about which values count as missing.`,
    hints: ['Is 0 falsy?', 'Which operator only falls back on null and undefined?'],
    tags: ['defaults', 'coercion'],
  },
  {
    id: 'get-by-path',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write get(object, path, fallback) where path is a dotted string like "a.b.c", the fallback is used only when the value at the path is null or undefined, and a missing intermediate object never throws. Which of these is correct?',
    options: [
      "function get(object, path, fallback) {\n  const value = path.split('.').reduce((acc, key) => acc && acc[key], object)\n  return value || fallback\n}",
      "function get(object, path, fallback) {\n  return path.split('.').reduce((acc, key) => acc?.[key], object) ?? fallback\n}",
      "function get(object, path, fallback) {\n  return path.split('.').reduce((acc, key) => acc[key], object) ?? fallback\n}",
      "function get(object, path, fallback) {\n  const value = path.split('.').reduce((acc, key) => acc?.[key], object)\n  return value === undefined ? fallback : value\n}",
    ],
    correctOption: 1,
    answerInFull: `function get(object, path, fallback) {
  return path.split('.').reduce((acc, key) => acc?.[key], object) ?? fallback
}

Each step reads one key from whatever the previous step produced. acc?.[key] is what makes a missing intermediate safe: the moment acc is nullish, the read gives undefined instead of throwing, and every later step reads undefined?.[key], which is undefined again. The chain never throws and never recovers, which is right.

?? at the end applies the fallback to null and undefined only, so a stored 0, empty string or false comes back as itself. Both halves of the function use the same definition of missing, which is what keeps it predictable.`,
    explanation: `The && and || version works until the data contains a falsy value. acc && acc[key] stops walking at a 0 or an empty string, and value || fallback replaces one at the end. It is the pre-2020 helper, and it has the pre-2020 bug.

The version without ?. throws on the first missing intermediate, because undefined[key] is a TypeError. The ?? at the end never gets a chance to run.

The === undefined version is almost right and draws the line in the wrong place. A null stored at the path comes back as null rather than the fallback, which contradicts the spec, and it is what ?? would have handled in one token.`,
    hints: [
      'What does each step of the walk need to survive?',
      'What should the fallback apply to?',
    ],
    tags: ['null', 'objects'],
  },
  {
    id: 'optional-chaining-everywhere',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'In review you find order?.items?.[0]?.price?.toFixed(2) in a component, where every order has an items array and every item has a numeric price. What do you say, and what should it be?',
    answerInFull: `Say that the chain claims five things can be absent and the data model says one can: the array can be empty. The other four question marks are not defensive, they are hiding bugs. If order is ever undefined here, that is a rendering bug upstream and the component should throw so it gets found, not quietly render nothing. If an item arrives without a price, that is a data bug, and toFixed silently skipping it means a blank where a number should be, noticed weeks later.

So it should be:

  order.items[0]?.price.toFixed(2)

One ?. on the one step that can legitimately produce nothing. An empty array gives undefined from [0], the ?. stops the chain there, and the component can show a placeholder. Everything else throws if the data is wrong, which is what you want in development and what error tracking is for in production.

Then say the general rule, because that is what the reviewer is really asking for: ?. belongs exactly where absence is part of the data model, and nowhere else. Sprinkled everywhere it turns every wrong shape into undefined, and undefined surfaces as a bug three components away from its cause.`,
    explanation: `The answer being looked for is not "remove some question marks". It is the principle: ?. encodes a claim about the data, and a claim that is false hides a bug rather than preventing one. A candidate who says "it is harmless, it is just defensive" has the wrong model of what a throw is for.

A good follow-up is whether a placeholder belongs in the component or in the data layer, and either answer is fine if it comes with a reason.`,
    hints: [],
    tags: ['null', 'code-review'],
  },
  {
    id: 'which-default-operator-interview',
    type: 'interview',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Which is the right operator for a default, || or ???',
    options: [
      '?? is always right. || is a relic from before ?? existed and only survives in old code',
      'Neither is always right. ?? when the value can legitimately be 0, an empty string or false; || when any falsy value should be replaced, such as an empty form field',
      '|| is always right for defaults. ?? exists for TypeScript, where null and undefined are distinct types',
      '?? for objects and arrays, || for primitives, because primitives are the values that can be falsy',
    ],
    correctOption: 1,
    answerInFull: `Neither, and the interviewer is listening for whether you can say why rather than which.

?? answers "was a value supplied". It falls back on null and undefined only. Use it when 0, '' or false is a meaningful answer: a retry count, a volume, a flag, an optional string the user deliberately emptied.

|| answers "is there something usable here". It falls back on anything falsy. Use it when an empty string or a zero really should be replaced: a display name that defaults to "Anonymous" when the field is blank, a port that came through as 0 from a broken parser.

In practice, ?? is the right default for settings and API data, where a zero is usually real, and || is the right one at the edge of user input, where an empty field usually is not. Picking one rule for the whole codebase is how zeros go missing.`,
    explanation: `"?? is always right" is the overcorrection. A form that lets an empty name through as '' because somebody made a rule about ?? is as much a bug as the zero that || ate.

The TypeScript story confuses two things. ?? is a JavaScript operator, added in ES2020, and works identically with or without types.

Objects against primitives is not the line. An object is never falsy, so for an object the two operators agree; the question only arises for primitives, and it is about which primitives, not whether.`,
    hints: ['What question does each operator answer?'],
    tags: ['defaults', 'null'],
  },
  {
    id: 'mixing-needs-parentheses',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What happens with const x = a ?? b || c?',
    options: [
      'It evaluates left to right: a ?? b first, then || c',
      '|| binds tighter, so it is a ?? (b || c)',
      'It is a SyntaxError. ?? cannot be mixed with || or && without parentheses',
      '?? binds tighter, so it is (a ?? b) || c',
    ],
    correctOption: 2,
    answerInFull: `It is a SyntaxError, on purpose.

?? and || have different definitions of "missing", and whichever precedence the language picked, half of the people writing the expression would have meant the other one. So the grammar refuses the bare mix. You write (a ?? b) || c or a ?? (b || c), and the parentheses say which you meant.

It is one of the few places where the language chose a compile-time error over a quiet rule, and it is worth knowing because the error message says "cannot be mixed" and people read it as a bug in their tooling.`,
    explanation: `Left to right is how most binary operators of equal precedence go, and it is what the design deliberately avoided here, because the two operators are not interchangeable.

Both precedence answers are guesses at a rule that does not exist. No precedence between ?? and || is defined, which is exactly why neither reading is allowed.`,
    hints: ['Why might the language refuse to guess?'],
    tags: ['syntax', 'null'],
  },
  {
    id: 'logical-assignment-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const settings = { theme: null, volume: 0, debug: false }
settings.theme ??= 'dark'
settings.volume ||= 50
settings.debug &&= 'yes'
console.log(settings)`,
    options: [
      "{ theme: 'dark', volume: 50, debug: false }",
      "{ theme: 'dark', volume: 0, debug: false }",
      "{ theme: null, volume: 50, debug: 'yes' }",
      "{ theme: 'dark', volume: 50, debug: 'yes' }",
    ],
    correctOption: 0,
    answerInFull: `{ theme: 'dark', volume: 50, debug: false }

??= assigns when the current value is nullish. theme is null, so it becomes 'dark'.

||= assigns when the current value is falsy. volume is 0, which is falsy, so it becomes 50. This is the same zero-eating behaviour as || and it is why ??= is usually the one you want for settings.

&&= assigns only when the current value is truthy. debug is false, so nothing happens and it stays false.`,
    explanation: `volume staying 0 is reading ||= as if it were ??=. It is not; it has the || rule, and 0 is falsy.

theme staying null treats ??= like &&=, or assumes null is not nullish. null is exactly what ??= is for.

debug becoming 'yes' is &&= read backwards. It assigns when the left is already truthy, so it is for "if this is set, replace it with a derived value", not for setting a default.`,
    hints: ['Each operator assigns only when its own test passes. What are the three tests?'],
    tags: ['syntax', 'defaults'],
  },
  {
    id: 'chain-stops-where',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When a is null, what does a?.b.c.d evaluate to?',
    options: [
      'null, since that is what stopped the chain',
      'undefined. The chain short-circuits at ?. and .b, .c and .d are never evaluated',
      'A TypeError, because .c is read from undefined',
      'undefined only if every step is written with ?.; otherwise a TypeError',
    ],
    correctOption: 1,
    answerInFull: `undefined, for the whole expression.

?. checks its left side. a is null, so the entire rest of the chain is skipped, not just the next property. Nothing after the ?. is evaluated, so there is nothing to throw, and the result is undefined.

The other half of the rule is what happens when a exists and a.b is null: then .c throws, because only a was marked optional. A single ?. guards its own left side and short-circuits everything to its right. It does not guard anything to its right.`,
    explanation: `null is the natural guess, and ?. never produces it. A short-circuited chain is undefined whichever nullish value stopped it.

The TypeError is the belief that only one step is skipped and the chain resumes. It does not resume. Once it short-circuits, the remaining accesses are not evaluated.

"Only if every step has ?." is the opposite overcorrection. Extra ?. on .c and .d would change what happens when b or c is null; they change nothing about the case where a is.`,
    hints: ['Does the chain resume after the ?. stops it?'],
    tags: ['syntax', 'null'],
  },
  {
    id: 'optional-call-choice',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these lines throws?',
    code: `const api = { fetch: null }

console.log(api.fetch?.() ?? 'no fetch')
console.log(api.load?.())
api.onDone?.()`,
    options: [
      'The first: fetch is null rather than undefined, so ?.() still tries to call it',
      'The second: load does not exist on api at all, and ?. only guards a property that is null',
      'The third: a call whose result is not used cannot be optional',
      'None of them. ?.() skips the call whenever the function is null or undefined',
    ],
    correctOption: 3,
    answerInFull: `None of them.

?.() tests the value on its left for nullish and skips the call when it is. fetch is null, load is undefined, onDone is undefined, and all three are nullish, so all three calls are skipped. The first prints 'no fetch' because the skipped call is undefined and ?? fills in. The second prints undefined. The third does nothing.

Note what it does not do. If api.fetch were a number, ?.() would go ahead and call it, and that would throw "not a function" as usual. ?.() guards against missing, not against wrong.`,
    explanation: `null against undefined is a distinction ?. does not make. It treats both as nullish.

A property that does not exist reads as undefined, which is nullish, and is the most common case ?. exists for.

Whether the result is used has no bearing on any expression. A statement that is just an optional call is fine.`,
    hints: ['What does ?. test for?'],
    tags: ['syntax', 'null'],
  },
]
