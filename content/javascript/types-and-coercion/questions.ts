import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-coercion',
    type: 'concept',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What is coercion, and where does JavaScript apply it without being asked?',
    answerInFull: `Coercion is converting a value from one type to another. It is explicit when you call Number(), String() or Boolean(), and implicit when an operator or a statement needs a type it was not given.

The places it happens implicitly:
- Arithmetic and comparison operators, which convert to number. The exception is +, which concatenates if either side ends up a string.
- ==, which converts until both sides share a type.
- Anything that tests a value: if, while, ||, &&, !, the ternary.
- Template literals and string concatenation, which convert to string.
- Property keys, which become strings unless they are symbols.`,
    explanation: `The useful framing is that the operator decides the conversion, not the values. The same pair of operands behaves differently under + and -, which is why "3" - 1 is 2 and 1 + "2" is "12". Once you ask "what does this operator want?" rather than "what are these values?", the surprising cases stop being surprising.`,
    hints: ['Think about which operators need a specific type to mean anything.'],
    tags: ['coercion', 'types'],
  },
  {
    id: 'plus-and-minus-output',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `console.log(1 + '2')
console.log('3' - 1)
console.log([] + {})
console.log([1, 2] + [3])`,
    answerInFull: `12
2
[object Object]
1,23`,
    explanation: `+ converts both sides to primitives and concatenates if either is a string; every other arithmetic operator converts to number. Arrays always become strings, because their valueOf returns the array itself, which is not a primitive, so toString runs instead and joins the elements with commas.

That leaves [] as '' and {} as '[object Object]', so the third line is string concatenation, and the fourth is '1,2' + '3'.`,
    hints: ['What does each operator want its operands to be?', 'What does an array convert to?'],
    tags: ['coercion'],
  },
  {
    id: 'null-comparisons-output',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `console.log(null == 0)
console.log(null >= 0)
console.log(null > 0)`,
    answerInFull: `false
true
false`,
    explanation: `== gives null a special case: it equals undefined and nothing else, with no conversion attempted. Relational operators have no such rule, so they convert null to 0. That makes null >= 0 the comparison 0 >= 0, which is true, while null > 0 is 0 > 0, which is false.

So null is simultaneously "not equal to 0" and "greater than or equal to 0". Nothing reconciles those two, because they are answered by different parts of the specification.`,
    hints: ['Do == and >= use the same conversion rules?'],
    tags: ['coercion', 'equality'],
  },
  {
    id: 'falsy-default-bug',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'A user who sets their display count to 0 sees 10 items instead, and a user with an empty bio sees the placeholder text they deleted. Explain the bug and fix it.',
    code: `function settings(input) {
  return {
    perPage: input.perPage || 10,
    bio: input.bio || 'No bio yet',
  }
}`,
    answerInFull: `|| falls back whenever the left side is falsy, and 0 and '' are falsy. Both users supplied a legitimate value that the code treats as missing.

The fix is ??, which only falls back on null and undefined:

  function settings(input) {
    return {
      perPage: input.perPage ?? 10,
      bio: input.bio ?? 'No bio yet',
    }
  }

If input.perPage can arrive as an empty string from a form, converting and validating it first is better than either operator, since '' ?? 10 is ''.`,
    explanation: `This is the most common coercion bug in production code, and it is invisible in testing because the defaults look correct for every value except the falsy ones. The rule worth carrying: || asks "is this truthy", ?? asks "is this present". They are different questions, and almost every default wants the second one.`,
    hints: ['Which values does || treat as missing?'],
    tags: ['coercion', 'defaults'],
  },
  {
    id: 'is-empty',
    type: 'coding',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'Write isEmpty(value) that is true for null, undefined, an empty string, an empty array and an object with no own keys, and false for 0, false and NaN.',
    answerInFull: `function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}`,
    explanation: `The point of the question is that "empty" and "falsy" are different sets, and only one of them has a language operator. 0 and false are falsy but not empty; [] and {} are empty but truthy. Anything that reaches for !value here gets both halves wrong.

Two details to say out loud. The null check has to come before typeof, because typeof null is 'object'. And Object.keys ignores symbol keys and inherited properties, which is usually what you want, but say that you know it.`,
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
    difficulty: 'medium',
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
    form: 'open',
    difficulty: 'easy',
    prompt: 'Is there ever a good reason to use == instead of ===?',
    answerInFull: `One: value == null, which is true for exactly null and undefined and false for everything else, including 0, '' and NaN. It is the idiomatic way to ask "is this missing" when either can appear, and it is shorter than value === null || value === undefined.

Everywhere else ===, because == needs the reader to reconstruct a conversion table to know what the line does.`,
    explanation: `The honest answer includes the fact that linters generally allow this exception. ESLint's eqeqeq has a "smart" option and an explicit null exception, which is a decent signal that it is accepted practice rather than a personal preference.

Saying "never use ==" is a defensible answer too, but knowing the one exception and why it is safe is a better one.`,
    hints: [],
    tags: ['equality'],
  },
  {
    id: 'typeof-null-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does typeof null return?',
    options: ["'null'", "'undefined'", "'object'", 'It throws a TypeError'],
    correctOption: 2,
    answerInFull:
      "'object', which is a bug from the first implementation that could not be fixed without breaking the web. The practical consequence is that typeof is not a null check: a value guard needs value !== null && typeof value === 'object'.",
    hints: [],
    tags: ['types'],
  },
  {
    id: 'truthy-string-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these is truthy?',
    options: ['0n', "''", "'0'", 'NaN'],
    correctOption: 2,
    answerInFull:
      "The string '0' is a non-empty string, and every non-empty string is truthy regardless of what it contains. The falsy values are exactly false, 0, -0, 0n, '', null, undefined and NaN, which means [] and {} are truthy too.",
    hints: [],
    tags: ['coercion'],
  },
  {
    id: 'empty-array-equals-false-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    prompt: 'What is the value of [] == false?',
    options: ['true', 'false', 'It throws a TypeError', 'undefined'],
    correctOption: 0,
    answerInFull:
      'true. == converts a boolean to a number first, so false becomes 0. Then an object compared with a number is converted to a primitive: [] becomes the empty string, which converts to 0. The comparison that actually runs is 0 == 0. With ===, no conversion happens and the answer is false.',
    hints: [],
    tags: ['coercion', 'equality'],
  },
  {
    id: 'nan-comparison-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Which of these evaluates to true?',
    options: ['NaN === NaN', 'NaN == NaN', 'Object.is(NaN, NaN)', '[NaN].indexOf(NaN) > -1'],
    correctOption: 2,
    answerInFull:
      'Only Object.is. NaN is not equal to itself under == or ===, and indexOf uses === internally, so it never finds a NaN. includes uses the same rules as Object.is, which is why [NaN].includes(NaN) is true while indexOf returns -1. To test a single value, use Number.isNaN.',
    hints: [],
    tags: ['equality', 'types'],
  },
]
