import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-is-coercion',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is coercion, and what decides which conversion happens?',
    options: [
      'Converting a value from one type to another. The values decide: a string operand always turns the expression into string handling, whichever operator is used',
      'Converting a value from one type to another. It only happens when you call Number(), String() or Boolean(); operators throw a TypeError when given the wrong type',
      'Converting a value from one type to another. The operator decides: each operator wants a type, and converts its operands to get it, which is why the same pair behaves differently under + and -',
      'Converting a value to a boolean so a statement can test it. Arithmetic on mismatched types is not coercion, it is the result of numbers and strings sharing one representation',
    ],
    correctOption: 2,
    answerInFull: `Coercion is converting a value from one type to another. It is explicit when you call Number(), String() or Boolean(), and implicit when an operator or a statement needs a type it was not given.

The places it happens implicitly:
- Arithmetic and comparison operators, which convert to number. The exception is +, which concatenates if either side ends up a string.
- ==, which converts until both sides share a type.
- Anything that tests a value: if, while, ||, &&, !, the ternary.
- Template literals and string concatenation, which convert to string.
- Property keys, which become strings unless they are symbols.

The operator decides the conversion, not the values. The same pair of operands behaves differently under + and -, which is why "3" - 1 is 2 and 1 + "2" is "12". Once you ask "what does this operator want?" rather than "what are these values?", the surprising cases stop being surprising.`,
    explanation: `"The values decide" is the model that makes '3' - 1 surprising. A string operand turns + into concatenation and nothing else: - still wants numbers, and gets them.

"Only when you call Number()" is what a stricter language does. JavaScript throws for almost nothing here, which is the whole reason the topic exists.

The last option has the boolean case and misses the rest. Numbers and strings are different types, and 1 + '2' converts the 1. Nothing is shared.`,
    hints: ['Think about which operators need a specific type to mean anything.'],
    tags: ['coercion', 'types'],
  },
  {
    id: 'plus-and-minus-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `console.log(1 + '2')
console.log('3' - 1)
console.log([] + {})
console.log([1, 2] + [3])`,
    items: ['3', '12', '1,2,3', '31', '[object Object]', 'NaN', '1,23', '2'],
    correctOrder: [1, 7, 4, 6],
    answerInFull: `12
2
[object Object]
1,23

+ converts both sides to primitives and concatenates if either is a string; every other arithmetic operator converts to number. So 1 + '2' is '12' and '3' - 1 is 2.

Arrays and plain objects always become strings under +, because their valueOf returns the object itself, which is not a primitive, so toString runs instead. [] is '' and {} is '[object Object]', so the third line is '' + '[object Object]'. An array's toString joins the elements with commas, so the fourth is '1,2' + '3'.`,
    explanation: `3 is the first line with + treated like every other arithmetic operator. It is the one operator that prefers strings, and it only takes one string operand to make it concatenate.

31 is the second line with - treated like +. Nothing but + concatenates. Every other arithmetic operator converts to number, even when both operands are strings.

NaN is [] + {} converted to numbers: [] is 0, {} is NaN, and 0 + NaN is NaN. That is what - would give. Under + both become strings first, and the string of an empty array is empty.

1,2,3 is the belief that + on two arrays concatenates them. It concatenates their strings, and '1,2' + '3' has no comma in the middle.`,
    hints: ['What does each operator want its operands to be?', 'What does an array convert to?'],
    tags: ['coercion'],
  },
  {
    id: 'null-comparisons-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `console.log(null == 0)
console.log(null >= 0)
console.log(null > 0)`,
    options: [
      'true, true, false',
      'false, true, false',
      'false, false, false',
      'true, false, false',
    ],
    correctOption: 1,
    answerInFull: `false, true, false

== gives null a special case: it equals undefined and nothing else, with no conversion attempted. Relational operators have no such rule, so they convert null to 0. That makes null >= 0 the comparison 0 >= 0, which is true, while null > 0 is 0 > 0, which is false.

So null is simultaneously "not equal to 0" and "greater than or equal to 0". Nothing reconciles those two, because they are answered by different parts of the specification.`,
    explanation: `true, true, false is the consistent world where null becomes 0 everywhere. It is the right rule for >= and >, and == is the one operator that refuses to convert null at all.

false, false, false is the other consistent world, where null is a special case everywhere and never becomes a number. That is how undefined behaves: it converts to NaN, so every relational comparison is false. null is the odd one out and converts to 0.

true, false, false is the real rule mirrored: == converting and the relational operators refusing. It reads as plausible because == is the operator with the reputation for converting, and here it is the one that does not.`,
    hints: ['Do == and >= use the same conversion rules?'],
    tags: ['coercion', 'equality'],
  },
  {
    id: 'falsy-default-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A user who sets their display count to 0 sees 10 items instead, and a user with an empty bio sees the placeholder text they deleted. What is the bug, and what is the fix?',
    code: `function settings(input) {
  return {
    perPage: input.perPage || 10,
    bio: input.bio || 'No bio yet',
  }
}`,
    options: [
      "Only the perPage line is wrong. 0 is falsy, so || replaces it, but '' is a string and || keeps it; the bio user has a different bug. Change perPage to ?? and leave bio alone",
      "|| falls back on any falsy value, and 0 and '' are both falsy. ?? would do the same, since it treats every falsy value as missing, so the fix is an explicit input.perPage !== undefined check on each line",
      "|| falls back on any falsy value, and 0 and '' are both falsy, so two legitimate values are treated as missing. Replace || with ??, which only falls back on null and undefined",
      'The defaults are evaluated before input is read, so every user gets 10 and the placeholder. Move them into a parameter default so they only apply when the argument is missing',
    ],
    correctOption: 2,
    answerInFull: `|| falls back whenever the left side is falsy, and 0 and '' are falsy. Both users supplied a legitimate value that the code treats as missing.

The fix is ??, which only falls back on null and undefined:

  function settings(input) {
    return {
      perPage: input.perPage ?? 10,
      bio: input.bio ?? 'No bio yet',
    }
  }

If input.perPage can arrive as an empty string from a form, converting and validating it first is better than either operator, since '' ?? 10 is ''.

This is the most common coercion bug in production code, and it is invisible in testing because the defaults look correct for every value except the falsy ones. The rule worth carrying: || asks "is this truthy", ?? asks "is this present". They are different questions, and almost every default wants the second one.`,
    explanation: `"Only perPage" has half the falsy list. '' is falsy too, which is exactly why the bio user sees the placeholder. Same bug, both lines.

The second option knows the bug and not the fix. ?? does not look at truthiness at all: 0 ?? 10 is 0 and '' ?? 'x' is ''. The explicit undefined check works, and is what ?? was added to replace.

"Evaluated before input is read" would give every user the defaults, and the report says only two kinds of user see them. The symptom names the falsy values, and so does the bug.`,
    hints: ['Which values does || treat as missing?'],
    tags: ['coercion', 'defaults'],
  },
  {
    id: 'is-empty',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write isEmpty(value) that is true for null, undefined, an empty string, an empty array and an object with no own keys, and false for 0, false and NaN. Which of these is correct?',
    options: [
      "function isEmpty(value) {\n  if (!value) return true\n  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0\n  if (typeof value === 'object') return Object.keys(value).length === 0\n  return false\n}",
      "function isEmpty(value) {\n  if (typeof value === 'object') return Object.keys(value).length === 0\n  if (value === undefined) return true\n  if (typeof value === 'string') return value.length === 0\n  return false\n}",
      'function isEmpty(value) {\n  return value == null || value.length === 0 || Object.keys(value).length === 0\n}',
      "function isEmpty(value) {\n  if (value === null || value === undefined) return true\n  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0\n  if (typeof value === 'object') return Object.keys(value).length === 0\n  return false\n}",
    ],
    correctOption: 3,
    answerInFull: `function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

The point of the question is that "empty" and "falsy" are different sets, and only one of them has a language operator. 0 and false are falsy but not empty; [] and {} are empty but truthy. Anything that reaches for !value here gets both halves wrong.

Two details to say out loud. The null check has to come before typeof, because typeof null is 'object'. And Object.keys ignores symbol keys and inherited properties, which is usually what you want, but say that you know it.`,
    explanation: `The !value version is the falsy check wearing the empty check's clothes. It returns true for 0, false and NaN, the three values the question says must be false, because all three are falsy.

The typeof first version throws on null. typeof null is 'object', so the first line runs Object.keys(null), which is a TypeError. The null check has to come first, and that ordering is the detail the question is testing.

The one line version looks right for every value in the list, until Object.keys(0) and Object.keys(false) both come back as []. Object.keys wraps a primitive rather than rejecting it, so 0, false and NaN are all reported empty.`,
    hints: [
      'Which of these values are falsy, and does that line up with being empty?',
      'What does typeof null return?',
    ],
    tags: ['coercion', 'types'],
  },
  {
    id: 'string-ids-from-api',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'An API returns ids as strings, and the codebase compares them with numeric ids using ==. It works today. What would you change, and what would you worry about?',
    answerInFull: `== works here only because the string is numeric and the conversion happens to be right. It stops being right the moment an id is '0012', ' 42 ', an empty string, or larger than Number.MAX_SAFE_INTEGER, and it silently makes '' == 0 true.

What I would do:
- Normalise at the boundary: convert ids to one representation as they enter the system, and compare with === everywhere after that.
- Choose string as that representation if ids are opaque identifiers, since converting to number can lose precision and cannot round trip leading zeroes.
- Add a parse step that rejects anything that is not a valid id, rather than letting a bad value become NaN and compare unequal to everything.`,
    explanation: `The general principle is that coercion at the point of comparison is a decision made in the wrong place. Every call site has to get it right, and none of them are the place that knows what the data means. Converting once at the boundary means the rest of the code never has to think about it.

The precision point matters in practice. Ids from a database bigint column exceed what a JavaScript number can hold exactly, and the failure is silent. Two different ids can convert to the same number.`,
    hints: ['What happens to this comparison for an id like "0012"?'],
    tags: ['coercion', 'equality', 'api'],
  },
  {
    id: 'when-is-loose-equality-ok',
    type: 'interview',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Is there ever a good reason to use == instead of ===?',
    options: [
      'No. == always converts, so the result depends on a table nobody remembers, and every linter bans it outright',
      'Yes, when comparing a number to a numeric string from an API. == does the conversion that === would force you to write by hand',
      "Yes, value == false, which catches every falsy value in one check instead of testing 0, '', null and undefined separately",
      "Yes, value == null, which is true for exactly null and undefined and false for everything else, including 0, '' and NaN",
    ],
    correctOption: 3,
    answerInFull: `One: value == null, which is true for exactly null and undefined and false for everything else, including 0, '' and NaN. It is the idiomatic way to ask "is this missing" when either can appear, and it is shorter than value === null || value === undefined.

Everywhere else ===, because == needs the reader to reconstruct a conversion table to know what the line does.

The honest answer includes the fact that linters generally allow this exception. ESLint's eqeqeq has a "smart" option and an explicit null exception, which is a decent signal that it is accepted practice rather than a personal preference.

Saying "never use ==" is a defensible answer too, but knowing the one exception and why it is safe is a better one.`,
    explanation: `"No" is defensible and it is not the best answer, and the detail it leans on is wrong: eqeqeq has a null exception precisely because the community settled on this one case.

The numeric string case is the bug from the scenario question. It works until an id is '0012' or '', and it puts the conversion at every comparison instead of once at the boundary.

value == false does not do what it says. '' == false and 0 == false are true, but NaN == false, null == false and undefined == false are all false, so it misses three of the falsy values. The one == check that is safe is the one where the conversion never happens: null and undefined equal each other and nothing else.`,
    hints: [],
    tags: ['equality'],
  },
  {
    id: 'typeof-null-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does typeof null return?',
    options: ["'null'", "'undefined'", "'object'", 'It throws a TypeError'],
    correctOption: 2,
    answerInFull:
      "'object', which is a bug from the first implementation that could not be fixed without breaking the web. The practical consequence is that typeof is not a null check: a value guard needs value !== null && typeof value === 'object'.",
    explanation: `'null' is what a language designed later would return, and what TypeScript calls the type. typeof predates both.

'undefined' is the reader who has null and undefined as one thing. typeof undefined is 'undefined'; null is the one that lies.`,
    hints: [],
    tags: ['types'],
  },
  {
    id: 'truthy-string-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these is truthy?',
    options: ['0n', "''", "'0'", 'NaN'],
    correctOption: 2,
    answerInFull:
      "The string '0' is a non-empty string, and every non-empty string is truthy regardless of what it contains. The falsy values are exactly false, 0, -0, 0n, '', null, undefined and NaN, which means [] and {} are truthy too.",
    explanation: `'0' is tempting to call falsy because Number('0') is 0 and 0 is falsy. Truthiness does not convert to a number first. It checks the string itself, and the string has a character in it.

0n is the BigInt zero, and it is on the falsy list alongside 0, which is the one most people have not seen.`,
    hints: [],
    tags: ['coercion'],
  },
  {
    id: 'empty-array-equals-false-choice',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What is the value of [] == false?',
    options: ['true', 'false', 'It throws a TypeError', 'undefined'],
    correctOption: 0,
    answerInFull:
      'true. == converts a boolean to a number first, so false becomes 0. Then an object compared with a number is converted to a primitive: [] becomes the empty string, which converts to 0. The comparison that actually runs is 0 == 0. With ===, no conversion happens and the answer is false.',
    explanation: `false is the answer a reader gives from truthiness: [] is truthy, so it must not equal false. == never asks whether something is truthy. It converts both sides until their types match, and the conversion runs through the number 0 on both sides.`,
    hints: [],
    tags: ['coercion', 'equality'],
  },
  {
    id: 'nan-comparison-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Which of these evaluates to true?',
    options: ['NaN === NaN', 'NaN == NaN', 'Object.is(NaN, NaN)', '[NaN].indexOf(NaN) > -1'],
    correctOption: 2,
    answerInFull:
      'Only Object.is. NaN is not equal to itself under == or ===, and indexOf uses === internally, so it never finds a NaN. includes uses the same rules as Object.is, which is why [NaN].includes(NaN) is true while indexOf returns -1. To test a single value, use Number.isNaN.',
    explanation: `== is the tempting one, because == is the operator that bends the rules. NaN is the value that neither operator bends for: it is unequal to everything, itself included.

indexOf is the trap for anyone who knows the NaN rule and not which comparison each array method uses. indexOf is ===, includes is SameValueZero, and only the second finds NaN.`,
    hints: [],
    tags: ['equality', 'types'],
  },
  {
    id: 'array-type-check-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'How do you check that a value is an array?',
    options: [
      "typeof value === 'array'",
      'Array.isArray(value)',
      "typeof value === 'object' && value !== null",
      'value.length !== undefined',
    ],
    correctOption: 1,
    answerInFull: `Array.isArray(value).

typeof reports 'object' for every object, so it cannot tell an array from a plain object, from a Date or from null. There is no 'array' for it to return.

Array.isArray is also the only check that survives a value crossing a realm. An array from an iframe, a worker or Node's vm module was built by a different Array constructor, so value instanceof Array is false for it while Array.isArray is true.`,
    explanation: `typeof value === 'array' is the check people write first, and it is false for every value in the language. typeof returns one of eight strings and 'array' is not among them.

The object check is the same reader one step further on, remembering that typeof null is 'object' and stopping there. It is true for {}, for a Date and for a Map as well as for an array.

The length check is duck typing, and it is true for every string and every function, both of which have a length. It is also true for anything somebody put a length property on, which includes the arguments object and a DOM node list.`,
    hints: [],
    tags: ['types'],
  },
  {
    id: 'sort-without-comparator-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const scores = [10, 9, 1]
console.log(scores.sort())`,
    options: ['[1, 9, 10]', '[1, 10, 9]', "['1', '10', '9']", '[10, 9, 1]'],
    correctOption: 1,
    answerInFull: `[1, 10, 9]

sort with no comparator converts every element to a string and compares those, character by character. '10' sorts before '9' because '1' comes before '9'. Numbers need a comparator:

  scores.sort((a, b) => a - b)

Two things worth saying alongside it. sort mutates the array and returns that same array, so the original order is gone rather than copied, and toSorted returns a new array if you need to keep it. And undefined is the one value the string rule skips: undefined always sorts to the end, whatever the comparator says.`,
    explanation: `[1, 9, 10] is what everyone expects, and it is what the comparator is for. The default is not "no ordering", it is a specific ordering that happens to be the wrong one for numbers.

The array of strings is the conversion taken too far. Elements are converted for the comparison only. Nothing is written back, so the array still holds numbers afterwards.

[10, 9, 1] unchanged is sort read as a no-op without a comparator. It always sorts. That is why a number list quietly comes back in an order nobody chose.`,
    hints: [],
    tags: ['coercion', 'arrays'],
  },
  {
    id: 'number-and-parseint-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `console.log(Number('12px'))
console.log(parseInt('12px'))
console.log(Number('  42  '))
console.log(parseInt('px12'))`,
    options: ['12, 12, 42, 12', 'NaN, 12, NaN, NaN', 'NaN, 12, 42, NaN', 'NaN, NaN, 42, NaN'],
    correctOption: 2,
    answerInFull: `NaN
12
42
NaN

Number is all or nothing. It converts the whole string or gives NaN, and surrounding whitespace is the one thing it forgives, which is also why Number('') and Number('   ') are both 0.

parseInt is lenient in one direction. It reads digits from the front and stops at the first character that is not one, so '12px' gives 12 and 'px12' gives NaN, because there was nothing to read before the p.

Which to reach for: Number when the whole string is meant to be a number, which is what a form field and an API field almost always mean. parseInt when you are deliberately pulling a number off the front of something, such as the 12 in a CSS '12px'. Pass the radix, parseInt(value, 10), out of habit.`,
    explanation: `12, 12, 42, 12 is parseInt's leniency applied to both functions. Number has none: one stray character and the answer is NaN.

NaN, 12, NaN, NaN is Number treated as strict about whitespace too. Whitespace is trimmed before the conversion, which is what makes Number safe on a value that came from an input field and unsafe on one that is empty.

NaN, NaN, 42, NaN is parseInt held to Number's standard, which would leave it with no reason to exist.`,
    hints: [],
    tags: ['coercion', 'types'],
  },
  {
    id: 'empty-field-passes-validation',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A required quantity field is submitted empty and this validator accepts it, so the order is created with a quantity of 0. What is wrong?',
    code: `function validQuantity(input) {
  if (isNaN(input)) return false
  return Number(input) <= 100
}`,
    options: [
      "isNaN converts its argument before testing it, so isNaN('') asks whether Number('') is NaN, and Number('') is 0. The empty string is reported as a perfectly good number. Reject empty and whitespace-only input before converting anything",
      'isNaN is the wrong function. Number.isNaN is the one that does not convert, so swapping to it rejects the empty string',
      'input arrives as a string and isNaN cannot judge one. Converting first, isNaN(Number(input)), gives the check a real number to look at and the empty field is rejected',
      'The empty string gets past isNaN because it is a string rather than a value. Trimming it, isNaN(input.trim()), gives isNaN something it can reject',
    ],
    correctOption: 0,
    answerInFull: `isNaN converts before it tests. Number('') is 0, so isNaN('') is false and the empty field is reported as a number. Number('   ') is 0 as well, so a field holding only spaces passes too.

  function validQuantity(input) {
    const text = String(input).trim()
    if (text === '') return false

    const quantity = Number(text)
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 100
  }

Two rules come out of it. Presence and validity are separate questions, and no conversion can answer the first one: every conversion has an answer for the empty string, and none of them is "missing". And once you are holding a number, use Number.isNaN, because isNaN's answer about a string says nothing you asked about.`,
    explanation: `Number.isNaN is the better function and it is not this fix. It is false for every value that is not a number, the empty string included, so the same submission is accepted and nothing new is rejected.

Converting first changes nothing, because isNaN already converts. isNaN(Number('')) is isNaN(0), which is false, exactly as before.

Trimming an empty string gives an empty string. It fixes the whitespace-only field only once something else is already rejecting the empty one, which is the check the validator does not have.`,
    hints: ['What is Number of the empty string?'],
    tags: ['coercion', 'types'],
  },
]
