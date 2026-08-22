import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-destructuring-does',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does const { name, address } = user actually do?',
    options: [
      'Creates two bindings by reading user.name and user.address, exactly as two separate const declarations would. The string is copied and the address object is shared',
      'Creates two bindings that stay linked to user, so a later change to user.name is visible through name',
      'Copies user into a new object and binds its name and address, so nothing about the original can be changed through them',
      'Moves the two properties out of user, which is why rest is needed to keep the ones you did not name',
    ],
    correctOption: 0,
    answerInFull: `It is property access written as a shape. The pattern reads user.name and user.address once, at that moment, and binds the results. There is no copy, no link and no mutation of user.

What each binding holds follows the normal rules for a value. name holds a string, which is a primitive, so it is a copy. address holds a reference to the same object user.address points at, so a write through address reaches user, and a write through user.address.city is visible through address. Destructuring changes nothing about how values work, it only changes how the reading is written.`,
    explanation: `The "stays linked" answer treats a binding as an alias for a property. A binding is filled once; reassigning user.name afterwards does not touch name, and reassigning name does not touch user. The only sharing is the ordinary one, where both names point at the same object.

The "copies user" answer gives destructuring a protective power it does not have. address is the same object, so address.city = 'x' is visible on user.

"Moves the properties out" is a misreading of rest. Rest builds a new object from what was not named. The source is never altered.`,
    hints: ['Write the longhand for it.'],
    tags: ['objects', 'syntax'],
  },
  {
    id: 'default-trigger-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `const { a = 1, b = 2, c = 3 } = { a: 0, b: null, c: undefined }
console.log(a, b, c)`,
    options: ['0 null 3', '1 2 3', '0 2 3', '1 null 3'],
    correctOption: 0,
    answerInFull: `0 null 3

A default applies when the property reads as undefined, and to nothing else. a is 0, which is a real value, so the default is ignored. b is null, which is also a real value as far as the pattern is concerned, so null comes through. c reads as undefined, and only there does the default fill in.

The null case is the one worth saying out loud in an interview, because it is what an API sends for a missing field and it bypasses every default in the pattern.`,
    explanation: `1 2 3 is the truthiness rule, as if a default were an || fallback. It is not; only undefined counts.

0 2 3 is halfway there. It keeps 0 but treats null as missing, which is the single most common misreading of the rule.

1 null 3 has it the other way round, replacing 0 and keeping null. Nothing in the rule is about whether the value is truthy, so 0 and null are treated identically: both come through.`,
    hints: ['Which one value does a default replace?'],
    tags: ['defaults', 'syntax'],
  },
  {
    id: 'nested-default-order',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function log(label) {
  console.log(label)
  return label
}

const { x = log('default x'), y: { z = log('default z') } = {} } = { x: 5 }
console.log('x', x)
console.log('z', z)`,
    items: ['x undefined', 'default z', 'z undefined', 'x 5', 'default x', 'z default z'],
    correctOrder: [1, 3, 5],
    answerInFull: `default z
x 5
z default z

Defaults are evaluated lazily and left to right. x reads as 5, so log('default x') never runs and nothing prints for it. y is missing, so the pattern's own default, an empty object, is matched instead. Inside it, z is missing too, so log('default z') runs, prints, and its return value becomes z.

Then the two console.log lines print what was bound. The order of the first line against the others is the point: a default is an expression that runs during the pattern, before the statements after it.`,
    explanation: `default x is what you print if you think every default is evaluated, as if they were plain arguments. A default runs only when it is needed, and x was present.

x undefined is the belief that a pattern with a default ignores the real value. It never does.

z undefined is what happens if the = {} on y is missed and you imagine the inner pattern silently giving up. Without the = {} it would not give up, it would throw, because it would be reading z from undefined. With it, z reads from an empty object and takes its default.`,
    hints: ['Which defaults actually run?', 'What does y get matched against?'],
    tags: ['defaults', 'syntax'],
  },
  {
    id: 'options-parameter-throws',
    type: 'debugging',
    form: 'choice',
    difficulty: 'easy',
    prompt:
      'Every caller that passes an object works, but connect() with no argument throws "Cannot destructure property host of undefined". What is the fix?',
    code: `function connect({ host, port = 5432 }) {
  return \`\${host}:\${port}\`
}`,
    options: [
      'Give each property a default, { host = "localhost", port = 5432 }, so nothing in the pattern is missing when there is no argument',
      'Give the whole parameter a default, { host, port = 5432 } = {}, so a call with no argument destructures an empty object instead of undefined',
      'Call it as connect(null) rather than connect(), since null has no properties and the defaults then apply',
      'Stop destructuring in the parameter and read options.host in the body, because a parameter pattern cannot be made safe',
    ],
    correctOption: 1,
    answerInFull: `The pattern is being matched against undefined, because the call passed nothing, and undefined has no properties to read. Property defaults cannot help, since there is no object for them to read from. The parameter itself needs a default:

  function connect({ host, port = 5432 } = {}) {}

Now a call with no argument destructures an empty object, host reads as undefined and port takes its default. The outer default covers the missing argument, the inner defaults cover missing properties, and an options object nearly always wants both.

Passing an object with host missing was never the problem; that gives host undefined, which may or may not be what the function wants, but it does not throw.`,
    explanation: `Per-property defaults are the natural first reach, and they change nothing here. The error is on the read from undefined, which happens before any default is considered.

null is worse than nothing. A parameter default applies to undefined only, so null skips it, and null cannot be destructured either. The same error, with null in the message instead.

Reading options.host in the body would throw in the same way on options being undefined. The parameter pattern is not the problem, the missing default is, and the fix is one token.`,
    hints: ['What value is the pattern being matched against?', 'Which default covers that?'],
    tags: ['functions', 'defaults'],
  },
  {
    id: 'first-and-last',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Write firstAndLast(list) that returns { first, last } for any array, using destructuring only. An empty array gives two undefineds and a single element is both first and last. Which of these is correct?',
    options: [
      'function firstAndLast(list) {\n  const [first, ...rest] = list\n  return { first, last: rest.at(-1) }\n}',
      'function firstAndLast(list) {\n  const [first, last = first] = list\n  return { first, last }\n}',
      'function firstAndLast(list) {\n  const [first] = list\n  const { length, [length - 1]: last } = list\n  return { first, last }\n}',
      'function firstAndLast(list) {\n  const { 0: first, [list.length]: last } = list\n  return { first, last }\n}',
    ],
    correctOption: 2,
    answerInFull: `function firstAndLast(list) {
  const [first] = list
  const { length, [length - 1]: last } = list
  return { first, last }
}

An array is an object with numeric keys and a length, so an object pattern can read it. length is bound first, then the computed key uses it to read the last index. Bindings in a pattern are initialised left to right, which is what lets a later key use an earlier one.

On an empty array length is 0, the computed key is -1, and reading index -1 gives undefined, so both are undefined. On one element the two reads hit the same index. Nothing is allocated, which is the advantage over the rest-based versions.

In an interview, say that list.at(-1) is what you would actually write, and that this version is the one that stays inside the exercise's constraint.`,
    explanation: `The rest version fails on one element. rest is empty, so rest.at(-1) is undefined while first holds the only item. It also copies the whole array to read one element off the end.

The last = first version reads index 1, not the last index. It is correct for arrays of length one and two and wrong for everything longer, which is the kind of bug that passes the tests somebody wrote in a hurry.

The list.length version is off by one. The last index is length - 1, so that key is always past the end and last is always undefined.`,
    hints: [
      'An array is an object. What are its keys?',
      'Can a pattern use a binding it made a moment ago?',
    ],
    tags: ['arrays', 'syntax'],
  },
  {
    id: 'null-branch-crash',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A handler destructures const { data: { items } } = response. Since the API started returning { data: null } on errors, every error crashes the page with a TypeError instead of showing the message. Why, and what is the fix?',
    options: [
      'A nested pattern reads into data, and null has no properties. A default on the branch, data: { items } = {}, does not help because a default fires on undefined only. Check the response before destructuring, or destructure from { data: response.data ?? {} }',
      'A nested pattern reads into data, and null has no properties. Give the branch a default, data: { items } = {}, so an absent data is matched against an empty object',
      'The default on items is missing. Write data: { items = [] } and a null data gives an empty list',
      'Use an optional pattern, data?: { items }, which skips the inner pattern when data is nullish',
    ],
    correctOption: 0,
    answerInFull: `The pattern reads items from response.data, and on an error response that is null. null has no properties, so the read throws, and it throws before the handler gets a chance to look at the error message.

A default on the branch is the first instinct and it does not work, because a destructuring default applies to undefined only. { data: null } is not { data: undefined }. The guard has to happen before the pattern, or the pattern has to be fed something destructurable:

  const { data: { items = [] } = {} } = { data: response.data ?? {} }

or, more honestly, check response.error first and only destructure a success. In practice the second is the better code: a handler that destructures before it knows what it was given is the actual bug, and the null is just what revealed it.`,
    explanation: `The branch default is right for an absent data and wrong for this one, and the distinction is the entire point. It is the answer someone gives who knows the = {} trick and not the rule underneath it.

A default on items is one level too deep. The throw happens reading items from null, and no default on items runs before that read does.

There is no optional pattern syntax. Optional chaining works in expressions, not in binding patterns, so data?: is a syntax error.`,
    hints: ['What does a default fire on?', 'Is null that?'],
    tags: ['defaults', 'errors'],
  },
  {
    id: 'response-destructuring-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'Walk me through what can go wrong when a function destructures an API response, and how you would defend against each.',
    answerInFull: `Four things, in the order they bite.

A missing branch. { data: { items } } throws when data is absent, because the pattern reads into undefined. A default on the branch, data: { items } = {}, covers that.

A null branch. The same pattern throws when data is null, and the branch default does not help, because defaults apply to undefined only. The guard has to be before the pattern: check the response shape first, or feed the pattern response.data ?? {}.

A field that is present with a value the code did not expect. A default on items covers absent, not null, so items = [] still binds null when the API sends null. Handling that means ?? after the pattern, or a schema check before it.

A renamed field. When the API renames total to count, the pattern silently binds undefined and nothing throws. That is the worst of the four because it passes every test that does not check the value. The defence is not in the pattern. It is validating the response against a schema at the boundary, once, so the rest of the code destructures a shape it can trust.

The theme is that a pattern is a reader, not a validator. It assumes the shape; it never checks it.`,
    explanation: `The answer being listened for is the last line. Anyone can list the null case; the strong answer is knowing that a pattern never checks anything, and that the fix is validating once at the edge rather than adding defaults everywhere.

The renamed field is the one most candidates miss, and it is the one that ships.`,
    hints: [],
    tags: ['objects', 'errors'],
  },
  {
    id: 'rest-against-spread-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these is true of rest and spread?',
    options: [
      'Rest collects what a pattern did not name into a new array or object and must be last; spread expands one value into many and can appear anywhere in a literal or a call',
      'Both produce a deep copy of what they are applied to, which is why they are the safe way to duplicate state',
      'Rest can appear anywhere in a pattern as long as it appears only once',
      'Spreading an object copies every property it can reach, including inherited and non-enumerable ones',
    ],
    correctOption: 0,
    answerInFull: `They are the same three dots doing opposite jobs, and the side of the = tells you which.

Rest lives in a pattern. It collects the elements or own enumerable properties the pattern did not name, into a new array or object, and it has to come last because it takes everything that is left.

Spread lives in a literal or a call. It expands an iterable into elements, an object into properties, or an array into arguments, and since it is producing values rather than collecting them, it can go anywhere and appear more than once.

Both are one level deep. The nested objects inside what rest collected, or what spread copied, are the same objects as before.`,
    explanation: `"Deep copy" is the belief that makes spread-based state updates go wrong. Both are shallow, and a nested object is shared after either one.

"Anywhere in a pattern" is a syntax error. [...head, last] is not allowed; rest takes the remainder, so nothing can follow it.

Spreading an object copies own enumerable properties, the same set Object.keys lists, plus own enumerable symbols. Inherited properties and anything non-enumerable are left behind.`,
    hints: ['Which side of the = is each one on?'],
    tags: ['syntax', 'objects'],
  },
  {
    id: 'object-rest-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const { a, ...rest } = { a: 1, b: { n: 2 }, c: 3 }
const copy = { ...rest }
rest.b.n = 9
console.log(a, copy.b.n, 'c' in rest)`,
    options: ['1 9 true', '1 2 true', '1 9 false', '1 2 false'],
    correctOption: 0,
    answerInFull: `1 9 true

rest is a new object holding b and c, the own enumerable properties the pattern did not name. copy is another new object made by spreading rest. Neither copies the object b points at, so rest.b, copy.b and the original b are one object, and the write to 9 is visible through copy.

c is in rest because rest takes everything the pattern did not name, and the pattern named only a.`,
    explanation: `1 2 true treats spread as a deep copy. Spread copies one level, so copy.b is the same object rest.b is.

1 9 false comes from thinking rest only collects what comes after the last named key in source order, or that it drops primitives. It collects every own enumerable property not in the pattern, whatever its type or position.

1 2 false is both mistakes at once.`,
    hints: ['How deep does rest copy?', 'What does rest collect?'],
    tags: ['objects', 'memory'],
  },
  {
    id: 'rename-and-computed-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Given const { [key]: value = 0, size: n } = stats, which bindings exist afterwards?',
    options: [
      'key, value, size and n',
      'value and n. key is evaluated to find the property and size is the source key, so neither becomes a binding',
      'value and size, since a renamed property keeps its original name as well',
      'None, because a computed key is not allowed in a pattern',
    ],
    correctOption: 1,
    answerInFull: `value and n.

The left of a colon is always the source key and the right is always the target. [key] is a computed source key: the expression key is evaluated, whatever string it holds names the property, and that property's value is bound to value, or to 0 if it reads as undefined. size is a plain source key, and its value is bound to n.

Neither key nor size becomes a variable. key already is one, somewhere in scope, which is why it could be used in the brackets. size is only ever a name on stats.`,
    explanation: `"key, value, size and n" binds both sides of each colon. A colon in a pattern means rename or go deeper; the source name is consumed, not bound.

"value and size" has the rename backwards, as if the right side were the source. Reading it as source: target every time stops this one.

Computed keys are allowed in patterns and are the destructuring form of bracket access. They are rare in practice, which is why they read as suspicious.`,
    hints: ['Which side of the colon becomes a variable?'],
    tags: ['syntax', 'objects'],
  },
  {
    id: 'iterable-pattern-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `const [a, , b = 'x', ...rest] = 'hey'
console.log(a, b, rest)`,
    options: ['h y []', 'h e []', 'h x []', "TypeError: 'hey' is not an array"],
    correctOption: 0,
    answerInFull: `h y []

An array pattern works on any iterable, and a string iterates over its characters. a takes the first, the hole skips the second, b takes the third, which is 'y', so its default is not used, and rest collects what is left, which is nothing.

Had the string been two characters long, b would have read as undefined, taken its default and printed x.`,
    explanation: `h e [] ignores the hole. An empty slot in an array pattern consumes a position without binding it.

h x [] applies the default even though the position had a value. A default fills in undefined only, and the third character exists.

The TypeError is the belief that array patterns need an array. They need an iterable, and a string is one; it is null and undefined that throw here.`,
    hints: ['What does an array pattern iterate over?'],
    tags: ['arrays', 'syntax'],
  },
]
