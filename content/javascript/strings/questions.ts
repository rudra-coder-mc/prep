import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'length-of-an-emoji',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `console.log('👍'.length)
console.log([...'👍'].length)`,
    options: ['1, 1', '2, 1', '2, 2', '1, 2'],
    correctOption: 1,
    answerInFull: `2
1

A JavaScript string is a sequence of UTF-16 code units, and a code unit is sixteen bits. That emoji is a code point above U plus FFFF, so it is stored as two code units, a surrogate pair, and length counts those. Spread uses the string iterator, which walks code points and keeps the pair together, so the array has one entry.

The consequence people meet first is a character limit. A field limited with length charges an emoji twice, and a name with an accent written as a combining mark also costs more than it looks.

There are three units of length and they answer different questions: code units, which length reports and slicing uses; code points, which iteration walks; and grapheme clusters, which is what a reader calls a character and only Intl.Segmenter counts.`,
    explanation: `1, 1 is the answer if a string is a sequence of characters, which is the model most languages give you and the one JavaScript does not.

2, 2 is code units applied consistently to both lines. It is the right count for the first and the wrong one for the second: iteration is the thing that switches to code points, which is why spread is the usual fix.

1, 2 has it backwards, and it is worth knowing why nothing produces that answer. No operation counts an astral code point as one and then splits it into two.`,
    hints: ['How many bits is a UTF-16 code unit, and how many does that emoji need?'],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'slicing-a-string-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const text = '\u{1F44D}ok'
console.log(text.length)
console.log([...text].length)
console.log(text.slice(0, 1) === '\u{1F44D}')
console.log(text.slice(0, 2) === '\u{1F44D}')`,
    items: ['3', '4', 'true', 'false', '2', '1', 'undefined'],
    correctOrder: [1, 0, 3, 2],
    answerInFull: `4
3
false
true

The emoji is a code point above U plus FFFF, so it is stored as two UTF-16 code units, and the two letters are one each. length counts code units, so it is 4. Spread uses the string iterator, which walks code points, so it is 3.

slice counts in code units as well. Taking one gives half a surrogate pair, which is a lone surrogate, a perfectly valid string of length one that renders as a replacement character and is not equal to the emoji. Taking two gives both halves, so the fourth line is true.

The rule to carry: anything that iterates a string walks code points. That is for...of, spread, Array.from and a regex with the u flag. Anything that indexes, cuts or measures a string works in code units: length, charAt, slice, substring and split with an empty separator.

Iterating is not a complete fix either, because it stops at code points. A family emoji is five code points joined by zero-width joiners, so splitting it by code point still produces nonsense. Intl.Segmenter with grapheme granularity is the only correct answer there.`,
    explanation: `3 as the first line is length credited with the iterator's behaviour. Only iteration switched to code points; length never did, and that is the whole trap.

true for the third line is slice assumed to cut where a reader would. It cuts between code units, and the first one on its own is not the emoji.

2 and 1 are in the pool because they are what the first two lines would print if length counted graphemes and spread counted something smaller. Neither operation does either thing, but they are the two numbers a reader reaches for when they know the counts disagree and not which way round.`,
    hints: [
      'Which of these operations iterate, and which index?',
      'How many code units does that emoji occupy?',
    ],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'reversing-a-string',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You need reverse(text) for user-supplied text that can contain any language and any emoji. Which is the best of these?',
    options: [
      "const reverse = (text) => text.split('').reverse().join('')",
      "const reverse = (text) => [...text].reverse().join('')",
      "const reverse = (text) =>\n  [...new Intl.Segmenter().segment(text)].map((s) => s.segment).reverse().join('')",
      "const reverse = (text) => {\n  let out = ''\n  for (let i = text.length - 1; i >= 0; i -= 1) out += text[i]\n  return out\n}",
    ],
    correctOption: 2,
    answerInFull: `const reverse = (text) =>
  [...new Intl.Segmenter().segment(text)].map((s) => s.segment).reverse().join('')

Intl.Segmenter defaults to grapheme granularity, which is the unit a reader calls a character. It is the only one of the four that survives every case in the question.

Spread is the answer people give, and it is a real improvement: it walks code points, so a surrogate pair stays whole and a plain emoji reverses correctly. It still breaks on anything built from more than one code point: a family emoji joined by zero-width joiners, a flag made of two regional indicators, and a letter followed by a combining accent, which ends up attached to the letter before it.

split('') and the index loop are the same bug written twice. Both work in code units, so both tear surrogate pairs in half and produce lone surrogates that render as replacement characters.

The wider point is that "reverse a string" is an interview exercise rather than a real requirement, and the reason is exactly this: there is no unit of reversal that is right for every script. Reversing Arabic or Devanagari is not a meaningful operation whatever unit you pick.`,
    explanation: `The spread version is the one worth arguing about, because in a code review it looks correct and it is the standard fix for this bug. It is right for a single emoji and wrong for a family emoji, a flag, and any accent written as a combining mark, which is most European text pasted out of macOS.

split('') is the version in every tutorial. It is the code unit cut, so it breaks the first case the question names.

The index loop reads as the careful low-level answer and is exactly split('') with more steps. Indexing a string is indexing code units.`,
    hints: [
      'Which unit does each of these walk in?',
      'What is a family emoji made of, and does walking code points keep it together?',
    ],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'template-literal-interpolation',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does a template literal do with an interpolated value?',
    options: [
      'It calls JSON.stringify on it, so objects and arrays appear as JSON and strings appear with quotes around them',
      'It converts it with String(), so an object becomes "[object Object]" unless it has its own toString',
      'It inserts it unchanged, so an object stays an object and the result is only a string when every interpolated value already was one',
      'It calls String() on primitives and JSON.stringify on objects, so both read correctly in a log line',
    ],
    correctOption: 1,
    answerInFull: `It converts with String(), which is the same conversion string concatenation does. So a number becomes its digits, null becomes 'null', and a plain object becomes '[object Object]', because String() calls toString and the one Object.prototype provides says only what kind of thing it is.

That is the single most common template literal complaint, and the fix is to convert deliberately:

  console.log(\`user: \${JSON.stringify(user)}\`)

An array is the confusing middle case. Array.prototype.toString joins with commas, so an array of ids interpolates as '1,2,3', which looks fine right up until one of the entries is an object and that entry becomes [object Object] on its own.

One more: a template literal keeps the indentation of the source file, so a multi-line template inside an indented function carries that whitespace into the string.`,
    explanation: `The JSON.stringify option is what people wish it did, and adopting it would break the ordinary case, since a string would arrive with quotes around it.

"Inserts it unchanged" describes what a tagged template's values array holds, which is the one place the raw values survive. A plain template literal always produces a string.

"String() for primitives and JSON.stringify for objects" is the helpful behaviour nobody implemented. It would also have to decide what to do with a Date, a Map and a class instance, and the answers disagree.`,
    hints: ['What does String({}) give you?'],
    tags: ['strings', 'templates'],
  },
  {
    id: 'tagged-template-arguments',
    type: 'output',
    form: 'choice',
    tier: 'senior',
    prompt: 'What does this print?',
    code: `function tag(strings, ...values) {
  console.log(strings.length, values.length)
  console.log(strings[0])
}

const name = 'Ada'
tag\`Hi \${name}, you have \${2} messages\``,
    options: [
      "3 2, then 'Hi '",
      "2 2, then 'Hi '",
      "3 2, then 'Hi Ada'",
      "1 2, then 'Hi Ada, you have 2 messages'",
    ],
    correctOption: 0,
    answerInFull: `3 2
Hi 

A tag receives the literal parts as its first argument and the interpolated values as the rest. There is always exactly one more literal part than there are values, because the parts are what sits between and around the holes: here 'Hi ', ', you have ' and ' messages', with 'Ada' and 2 between them. A template that starts or ends with a hole gets an empty string at that end, which is what keeps the count consistent.

The first literal part is 'Hi ' with its trailing space. Nothing has been joined, which is the entire point: the tag can see which text the developer wrote and which came from a variable.

That separation is what makes tagged templates the right tool for escaping. An HTML tag escapes every value and leaves the literal parts alone. A SQL tag turns every value into a bound parameter, so an injection is impossible by construction rather than by discipline. The sql, css and graphql tags you have seen are all this.

strings also carries a raw property holding the text before escape sequences were processed, which is what String.raw exposes.`,
    explanation: `2 2 is the count you get from assuming one literal part per value. The invariant is parts equal values plus one, and it holds even when the template begins or ends with an interpolation, by inserting an empty string there.

'Hi Ada' is the tag imagined as receiving the already-interpolated text in pieces. If it did, it could not tell a value from a literal, and every use of tagged templates for escaping would be unsafe.

The last option is the template evaluated normally and then handed over as one string. That is what happens without the tag in front of it.`,
    hints: ['How many gaps are there around two holes?'],
    tags: ['strings', 'templates'],
  },
  {
    id: 'normalisation-search-miss',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A customer search for a name with an accent in it returns nothing, even though the record is visibly there and the two strings look identical on screen. Pasting both into the console shows the same text and === says false. What is going on?',
    code: `const match = customers.filter((customer) => customer.name.includes(query))`,
    options: [
      'The two strings are in different Unicode normalisation forms: one spells the accented letter as a single code point and the other as a plain letter followed by a combining accent. Normalise both to NFC before comparing',
      'includes compares by reference for strings longer than a small threshold, so two equal strings from different sources can miss. Use === inside an explicit loop instead',
      'The stored name has a different character encoding from the query, so the bytes differ. Decode both to UTF-8 before comparing',
      'includes is case sensitive and the accented character has a case fold the plain one does not, so the comparison fails on case rather than on the accent. Lowercase both first',
    ],
    correctOption: 0,
    answerInFull: `Unicode can spell the same text more than one way. An e-acute is either one code point, U plus 00E9, or two: a plain e followed by a combining acute accent, U plus 0301. They render identically and they are different strings, so === is false and includes finds nothing.

Which form you get depends on where the text came from. macOS filenames are decomposed, most web form input is composed, and a paste out of a PDF can be either.

The fix is to normalise once, at the boundary, and compare normalised text after that:

  const normalised = (text) => text.normalize('NFC')
  const match = customers.filter((customer) =>
    normalised(customer.name).includes(normalised(query)),
  )

NFC composes and is the right default for storage and comparison. NFKC also folds compatibility characters, turning a circled digit into a plain one and the fi ligature into two letters, which is what you want for a search index and not what you want for a name you display back.

For search specifically, the fuller answer is to store a normalised, case-folded, accent-stripped search key alongside the name, so the query does not have to match the way the customer typed it either.`,
    explanation: `"includes compares by reference" is not true of any string comparison in JavaScript. Strings are primitives and are always compared by value, however long they are.

Character encoding is the right neighbourhood and the wrong layer. Both strings are already decoded and both are sequences of code units; the difference is which code points they are made of, not which bytes they came from. Nothing in a running program is holding UTF-8 bytes here.

The case option is the reflex when a comparison misses, and lowercasing both changes nothing: the two spellings of the accent differ in the same way in lower case.`,
    hints: ['Are the two strings the same length?'],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'strings-are-immutable',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'The label is still lower case when it is rendered. Why?',
    code: `function titleFor(input) {
  const label = input.trim()
  label.toUpperCase()
  return label
}`,
    options: [
      'trim returns a frozen string, and toUpperCase cannot modify a frozen value. Reorder the two calls so the case change happens first',
      'toUpperCase only affects the first character unless a locale is passed. Use toLocaleUpperCase to change the rest',
      'Strings are immutable, so toUpperCase returns a new string and changes nothing. The return value has to be used: return input.trim().toUpperCase()',
      'label is declared with const, so it cannot be reassigned. Declaring it with let lets toUpperCase write back into it',
    ],
    correctOption: 2,
    answerInFull: `Strings are primitives and primitives are immutable. Every string method returns a new string and leaves the original alone, so a call whose result is thrown away does nothing at all.

  function titleFor(input) {
    return input.trim().toUpperCase()
  }

The same mistake in its other form is assigning to an index. label[0] = 'X' fails silently in sloppy mode and throws a TypeError in strict mode, which includes every module.

The rule generalises past strings: every method on a string, and every non-mutating array method such as map, filter, slice and toSorted, returns a value you have to use. The array methods that do mutate, push, sort, splice and reverse, are the exceptions worth memorising precisely because everything else does not.`,
    explanation: `The const option is the tempting one, because const really does prevent reassignment and the code really does use const. It is a rule about the binding, not about the value: an object declared with const can still be mutated. Changing it to let would let you write label = label.toUpperCase(), and it is the assignment doing the work, not the let.

"trim returns a frozen string" invents a distinction that does not exist. Every string is immutable, including the one that arrived as the argument, so reordering the calls changes nothing.

toUpperCase does not stop at the first character. toLocaleUpperCase differs only for the handful of languages where case mapping is locale-dependent, such as Turkish dotted and dotless i.`,
    hints: ['What does toUpperCase return, and where does that value go?'],
    tags: ['strings'],
  },
  {
    id: 'replace-only-the-first',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `console.log('a-b-c'.replace('-', '_'))
console.log('a-b-c'.replace(/-/g, '_'))
console.log('a-b-c'.replaceAll('-', '_'))`,
    options: [
      'a_b_c, a_b_c, a_b_c',
      'a_b-c, a_b_c, a_b_c',
      'a_b-c, a_b-c, a_b_c',
      'a_b-c, a_b_c, then a TypeError',
    ],
    correctOption: 1,
    answerInFull: `a_b-c
a_b_c
a_b_c

replace with a string pattern replaces the first occurrence only. It is the single most common surprise in the string methods, and it is silent: the code looks right and the output is wrong only for input with more than one match.

Two fixes. A regex with the g flag, which is what everybody did before 2021, or replaceAll, which is clearer and says what it does.

One edge on replaceAll: passing it a regex without the g flag throws a TypeError, deliberately, because "replace all with something that only matches once" is a contradiction rather than a thing to guess about.`,
    explanation: `a_b_c on the first line is the reasonable expectation, and it is the assumption almost everyone starts with. replace has always meant "replace the first", and the name has never said so.

a_b-c on the second line is the g flag missed. Without it a regex behaves exactly like the string pattern.

The TypeError belongs to a case this code does not have: replaceAll throws when it is given a regex without g, and it is perfectly happy with a string.`,
    hints: ['How many matches does replace with a string pattern take?'],
    tags: ['strings'],
  },
  {
    id: 'sorting-names',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: "What is the result of ['Zoe', 'Ängela', 'apple'].sort(), and why?",
    options: [
      "['Ängela', 'apple', 'Zoe']. sort with no comparator uses the runtime's locale, which is what makes it acceptable for user-facing lists in a single-locale application",
      "['apple', 'Ängela', 'Zoe']. sort is case-insensitive by default and orders accented letters immediately after their unaccented forms",
      "['Zoe', 'apple', 'Ängela']. sort with no comparator compares code units, and 'Z' is 90, 'a' is 97 and 'Ä' is 196, so every capital sorts before every lower case letter and accented letters land last",
      "['Zoe', 'Ängela', 'apple']. sort with no comparator is stable and performs no comparison at all on strings, so the original order is preserved",
    ],
    correctOption: 2,
    answerInFull: `['Zoe', 'apple', 'Ängela']

sort with no comparator converts each element to a string and compares code unit by code unit. 'Z' is 90, 'a' is 97 and 'Ä' is 196, so every capital letter sorts before every lower case one and anything outside ASCII lands after both. No address book in the world sorts that way.

The comparator that knows about language is localeCompare:

  ['Zoe', 'Ängela', 'apple'].sort((a, b) => a.localeCompare(b))
  // ['Ängela', 'apple', 'Zoe']

For a long list, Intl.Collator does the same work with the locale setup done once instead of on every comparison, and it is materially faster.

localeCompare also takes options, and sensitivity: 'base' is the one worth remembering: it treats case and accent differences as equal, which is how you get a case-insensitive and accent-insensitive comparison without stripping characters out of the string first.`,
    explanation: `The locale-aware answer is what people expect sort to do, and it is what localeCompare is for. The default comparator is deliberately locale-independent, so that the same array sorts identically on every machine.

Case-insensitive by default would at least be defensible and it is not what happens: 'Zoe' before 'apple' is only explicable by 'Z' being the smaller code unit.

"Performs no comparison at all" confuses stability with not sorting. Stability is about how equal elements are ordered relative to each other, and it only applies once a comparison has called two elements equal.`,
    hints: ['What is the numeric value of the first character of each string?'],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'a-search-that-matches-names',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'You are building name search for a directory whose users type names in any language, from any device. What would you build, and what would you deliberately not do?',
    answerInFull: `The shape I would build is a stored search key alongside the display name, rather than transforming the query and the data at comparison time.

Building the key, in this order:
- Normalise to a single form. NFKC rather than NFC, because a search index should treat a circled digit and a plain one, or the fi ligature and the two letters, as the same. Compatibility folding is destructive, which is exactly why it belongs in the key and not in the stored name.
- Case fold, with toLocaleLowerCase rather than toLowerCase, so Turkish dotted and dotless i behave.
- Strip combining marks, by normalising to NFD and removing the combining range, so a search for Angela finds Ängela. This is the step that makes the key wrong to display and right to match on.
- Collapse whitespace, including the non-breaking spaces that arrive from pasted documents, and remove zero-width characters, which are invisible and break an exact match with no visible cause.

Then search against the key and display the original.

What I would deliberately not do:
- Compare with === or includes on the raw names. The same name has more than one spelling before it is normalised, so exact comparison fails on data that is correct.
- Overwrite the stored name with the normalised form. The key is for matching; the name is the user's, including the accents, and destroying it to make search easier is the wrong trade.
- Reach for a fuzzy match first. Normalisation fixes the failures that are the system's fault. Fuzzy matching fixes the ones that are the typist's, and it brings false positives, so it belongs on top of a correct exact match rather than instead of one.
- Use a length limit measured in code units. A name in a non-Latin script costs more code units per character, so a limit that is generous in English is not in Japanese. Count code points at least, and graphemes if the limit is shown to the user.

What I would worry about: names are the domain where every simplifying assumption is somebody's identity. The accent stripping that makes search work is the same operation that spells a person's name wrong, so it goes in the key and never in the record, and anywhere the name is shown, it is shown as typed.`,
    explanation: `The general principle is to separate matching from identity. A search key is a lossy derivative built for one job, and the moment it is allowed to replace the value it was derived from, a user's name is damaged to save a comparison.

The detail that separates a good answer is naming the invisible failures: a zero-width space or a non-breaking space produces a search miss with no visible cause, and no amount of staring at two identical-looking strings explains it. Anyone who has debugged one says it unprompted.`,
    hints: ['What would you store, and what would you compare?'],
    tags: ['strings', 'unicode'],
  },
  {
    id: 'counting-characters',
    type: 'interview',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'How do you count the characters in a string?',
    options: [
      'Use length. It is the character count, and the cases where it disagrees are broken input rather than a real distinction',
      'Ask which unit the count is for. length is code units, spread or Array.from gives code points, and Intl.Segmenter gives grapheme clusters, which is what a person means by a character',
      'Use [...text].length. It is the code point count, which is the correct character count for every string, and length is only kept for compatibility',
      'Use a regex with the u flag and match every character, which is the only method that is Unicode-aware in every case',
    ],
    correctOption: 1,
    answerInFull: `The answer is a question back: which unit is the count for?

- length counts UTF-16 code units. It is right for a storage limit and for nothing that a person reads.
- Spread or Array.from counts code points. It is right for most validation, and it is one character of typing away from length.
- Intl.Segmenter with grapheme granularity counts what a reader calls a character. A family emoji is one grapheme, five code points and eight code units.

Then give the consequence, because that is what the question is really about. A 280-character limit enforced with length charges an emoji twice and a Devanagari word far more than it looks, so the counter shown to the user and the limit enforced by the database are measuring different things and will disagree in front of the user.

Where each belongs: graphemes for anything a person sees counted, code points for validation, code units for storage sizing, since that is what the string actually occupies.`,
    explanation: `"length is the character count" is the answer that passes for every string in ASCII and fails on the first emoji, accent or non-Latin script. The cases it misses are ordinary input, not broken input.

The code point answer is the common half-correct one. It is a genuine improvement over length and it still splits a family emoji into five, a flag into two, and a letter from its combining accent.

The regex answer is the same code point count with more machinery. The u flag makes a pattern match by code point, so it agrees with spread exactly, including on the cases spread gets wrong. Only Intl.Segmenter goes further.`,
    hints: [],
    tags: ['strings', 'unicode'],
  },
]
