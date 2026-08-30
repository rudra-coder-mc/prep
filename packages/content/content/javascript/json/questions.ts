import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-stringify-drops',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What does JSON.stringify do with a property whose value is undefined, a function or a symbol?',
    options: [
      'Throws a TypeError, since none of them is a JSON value',
      'Writes the string "undefined" for all three',
      'Drops the property from an object, and writes null in its place inside an array',
      'Writes null for all three, in objects and arrays alike',
    ],
    correctOption: 2,
    answerInFull: `Inside an object the property is dropped: the key does not appear in the output at all. Inside an array the value becomes null, because an array cannot lose a position without every later index shifting.

All three are treated identically because none of them is a JSON value, and stringify's policy for a value it cannot write is to leave it out rather than fail. The one place it does fail is the root: JSON.stringify(undefined) returns undefined rather than a string, which code expecting a string then trips over.

The two values that do throw are a BigInt and a cycle. Everything else that does not fit is dropped or converted silently.`,
    explanation: `The TypeError is what BigInt and cycles get, and people extend it to undefined by analogy. stringify is more permissive than that, which is the whole problem: the loss is silent.

"undefined" as a string would at least be visible. It never happens.

null everywhere is half right. It is what arrays get, and the reason is positional. An object has no positions to preserve, so the key simply goes.`,
    hints: ['What would dropping a value do to an array that it does not do to an object?'],
    tags: ['json', 'serialisation'],
  },
  {
    id: 'mixed-values-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `console.log(
  JSON.stringify({
    a: undefined,
    b: () => 1,
    c: [undefined, NaN],
    d: new Date(0),
  }),
)`,
    options: [
      '{"c":[null,null],"d":"1970-01-01T00:00:00.000Z"}',
      '{"a":null,"b":null,"c":[null,null],"d":"1970-01-01T00:00:00.000Z"}',
      '{"c":[],"d":"1970-01-01T00:00:00.000Z"}',
      '{"c":[null,null],"d":{}}',
    ],
    correctOption: 0,
    answerInFull: `{"c":[null,null],"d":"1970-01-01T00:00:00.000Z"}

a is undefined and b is a function, so both properties are dropped from the object. Inside the array, undefined and NaN each become null, because an array keeps its positions. The Date has a toJSON method that returns its ISO string, and that string is what gets written.

Four properties in, two out, and the two that survived are a pair of nulls and a string that used to be a Date.`,
    explanation: `Writing null for a and b is the array rule applied to an object. An object has no positions to hold, so the keys go.

An empty array for c is the object rule applied to an array. Dropping the elements would shift every later index, so they are nulled in place.

{} for the Date is what a Map or a Set would give, since those have no own enumerable properties and no toJSON. Date has a toJSON, and that is the only reason it comes out as anything useful.`,
    hints: [
      'Which rule applies inside an array, and which inside an object?',
      'What does Date have that Map does not?',
    ],
    tags: ['json', 'serialisation'],
  },
  {
    id: 'tojson-replacer-order',
    type: 'output',
    form: 'ordering',
    tier: 'staff',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const item = {
  name: 'pen',
  price: 2,
  toJSON() {
    console.log('toJSON')
    return { name: this.name, price: this.price }
  },
}

const text = JSON.stringify(item, (key, value) => {
  console.log('replacer', JSON.stringify(key))
  return value
})
console.log(text)`,
    items: [
      'replacer ""',
      'replacer "toJSON"',
      'toJSON',
      'replacer "name"',
      '{"name":"pen","price":2,"toJSON":{}}',
      'replacer "price"',
      '{"name":"pen","price":2}',
      'replacer "0"',
    ],
    correctOrder: [2, 0, 3, 5, 6],
    answerInFull: `toJSON
replacer ""
replacer "name"
replacer "price"
{"name":"pen","price":2}

For each value, stringify calls toJSON first and then the replacer. The root value is item, so its toJSON runs and returns a plain object, and then the replacer is called for the root with the empty string as its key and that plain object as its value.

stringify then walks the replacement's own enumerable properties, name and price, calling the replacer for each. The toJSON method is not on the replacement object, so the replacer never sees a toJSON key, and the output has two fields.`,
    explanation: `replacer "toJSON" is what you would see if stringify walked the original object. It walks what toJSON returned, and that object has no toJSON property.

The output ending in "toJSON":{} is the same misreading taken to its conclusion: the method serialised as an empty object. A function is dropped, never written as {}, and it was never visited in any case.

replacer "0" is an array key. Nothing here is an array.

Putting replacer "" before toJSON is the order reversed. toJSON runs first, on every value that has one, and the replacer sees its result. That is why a replacer looking for a Date never finds one.`,
    hints: [
      'Which hook runs first for a single value?',
      'What object does the walk continue into?',
    ],
    tags: ['json', 'serialisation'],
  },
  {
    id: 'date-round-trip-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'State is saved to localStorage with JSON.stringify and loaded back with JSON.parse. After a reload, state.createdAt.getTime is not a function. What happened, and what is the fix?',
    options: [
      'localStorage cannot hold Dates and corrupts them. Store the timestamp as a number under a separate key',
      'stringify wrote the Date as an ISO string through toJSON, and parse has no way to know it was ever a Date. Revive it: parse with a reviver that turns that key back into new Date(value), or wrap the field after loading',
      'JSON.parse needs the option { dates: true } to restore Date objects',
      'Use structuredClone instead of JSON for the save, since it preserves Dates',
    ],
    correctOption: 1,
    answerInFull: `On the way out, Date.prototype.toJSON turned the Date into an ISO string, and that string is all that reached storage. On the way back, parse sees a string and gives you a string. It cannot tell a date from any other text, so nothing on the parsed object is a Date any more.

The fix is on the loading side:

  const state = JSON.parse(text, (key, value) =>
    key === 'createdAt' ? new Date(value) : value,
  )

or new Date(state.createdAt) after parsing, if there is only one. For a state object with several dates, a tag on the way out and a reviver that checks the tag is the pattern that scales.

This is the first lossy row of the round trip table that most people meet, and the reason every JSON-backed store ends up with a revive step.`,
    explanation: `localStorage stores strings and does nothing else to them. The conversion happened in stringify, before storage was involved, and a number under a separate key is the same problem with more keys.

There is no dates option on parse. The reviver is the mechanism, and it is general rather than date-specific.

structuredClone does preserve Dates and cannot write to localStorage, which holds strings only. It is the right answer to a different question.`,
    hints: ['What did stringify write for the Date?', 'What can parse know about a string?'],
    tags: ['json', 'dates'],
  },
  {
    id: 'stringify-safe',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      "Write stringifySafe(value) that serialises like JSON.stringify but writes the string '[Circular]' wherever it meets an object it has already written, so a cyclic structure no longer throws. Which of these is correct?",
    options: [
      "function stringifySafe(value) {\n  const seen = new WeakSet()\n  return JSON.stringify(value, (key, v) => {\n    if (seen.has(v)) return '[Circular]'\n    seen.add(v)\n    return v\n  })\n}",
      "function stringifySafe(value) {\n  try {\n    return JSON.stringify(value)\n  } catch {\n    return '[Circular]'\n  }\n}",
      "function stringifySafe(value) {\n  const seen = new WeakSet()\n  return JSON.stringify(value, (key, v) => {\n    if (typeof v === 'object' && v !== null) {\n      if (seen.has(v)) return '[Circular]'\n      seen.add(v)\n    }\n    return v\n  })\n}",
      "function stringifySafe(value) {\n  return JSON.stringify(value, ['[Circular]'])\n}",
    ],
    correctOption: 2,
    answerInFull: `function stringifySafe(value) {
  const seen = new WeakSet()
  return JSON.stringify(value, (key, v) => {
    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) return '[Circular]'
      seen.add(v)
    }
    return v
  })
}

The replacer sees every value before it is written. Each object is recorded in a WeakSet the first time, and any later visit to the same object writes the marker instead, which is what breaks the cycle. The typeof guard with the null check matters because a WeakSet only holds objects, and typeof null is 'object'.

Say the limitation out loud: this marks every repeated reference, not only cycles. Two properties pointing at the same shared object will write the second one as '[Circular]' even though nothing loops. A precise version tracks the path of ancestors using the replacer's this, which is the holder, and that is what the libraries do.`,
    explanation: `The version without the guard calls seen.add on the first primitive it meets, and a WeakSet throws on a non-object. It fails on almost any input, cyclic or not.

The try/catch replaces the entire output with the marker the moment a cycle exists, rather than marking the one place it occurs. It also swallows a BigInt error as if it were a cycle.

A replacer given as an array is an allow-list of keys. No key is called '[Circular]', so the output is {} for any object, and a cycle still throws on the way in.`,
    hints: ['Where can you see every value before it is written?', 'What can a WeakSet hold?'],
    tags: ['json', 'objects'],
  },
  {
    id: 'large-ids-precision',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A backend sends 64-bit numeric ids. Some of them arrive in the frontend a few units off, and requests back to the server then hit the wrong record. Why, and what is the fix?',
    options: [
      'Parse the id with parseInt, which reads the digits exactly rather than through a floating point conversion',
      'JSON numbers become doubles, which are exact only up to 2 ** 53. Larger ids are rounded during parse and the original digits are gone. Have the backend send ids as strings, and keep them as strings',
      'Wrap the parsed id in BigInt(id) on arrival, which restores the full precision',
      'The rounding happens in stringify on the way back, so send ids in the URL instead of the body',
    ],
    correctOption: 1,
    answerInFull: `Every number in JavaScript is a double, and a double holds integers exactly only up to 2 ** 53, around nine quadrillion. A 64-bit id above that is rounded to the nearest representable double at the moment JSON.parse reads it, and parse has no option to do otherwise. The digits are gone before any application code runs.

The fix is to never let the id be a number: the backend serialises ids as strings, the frontend keeps them as strings, and comparisons are string comparisons. That is why every large API, including ones for tweets and snowflake-style ids, sends ids as strings.

If the backend cannot change, the remaining options are all worse: a reviver cannot help because it receives the already-rounded number, and the only precise route is JSON.rawJSON and source-text access in newer engines, or a custom parser.`,
    explanation: `parseInt is given a number that has already been rounded, or a string of that rounded number. The precision was lost in parse, before anything application-side could read digits.

BigInt of a rounded double is a BigInt of the wrong value. It restores nothing.

The loss happens on the way in, in parse, not on the way out. Moving the id to the URL changes where it is written, not where it was rounded.`,
    hints: ['At what point are the digits lost?', 'Can any code after that point recover them?'],
    tags: ['json', 'numbers'],
  },
  {
    id: 'json-for-state-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'You are persisting application state as JSON, in localStorage or over the wire. What breaks, and how do you handle it?',
    answerInFull: `Start with the list of what JSON cannot hold, because that is what breaks: Dates become strings, Map and Set become empty objects, undefined disappears, NaN becomes null, class instances lose their prototype, BigInt throws, a cycle throws, and integers above 2 ** 53 are rounded. Anything in state that is one of those comes back different or not at all.

Then the three ways to handle it, in the order I would reach for them.

First, keep state JSON-shaped. Store timestamps as numbers or ISO strings, store collections as arrays or plain objects, keep ids as strings. Most state can be designed this way, and then there is nothing to convert.

Second, where a richer type is genuinely wanted in memory, convert at the boundary. A serialise step that tags values, { $type: 'Date', value }, and a reviver that knows the tags. toJSON on a class for the way out, a static from method for the way back. The conversion lives in one place, and the rest of the code never sees JSON.

Third, validate on load. Stored state is input from an older version of the program, and a schema check on the parsed object is what stops a renamed field from becoming undefined three screens away.

And say what I would not do: rely on JSON.parse(JSON.stringify(x)) as a deep copy anywhere, since it has every loss above, when structuredClone is built in.`,
    explanation: `The answer being listened for is the first option, designing state to be JSON-shaped, because candidates usually jump to the clever reviver and miss that most of the problem can be avoided. The validate-on-load point is the other one that marks experience: stored state is from the past, and the past had a different schema.`,
    hints: [],
    tags: ['json', 'state'],
  },
  {
    id: 'reviver-order-choice',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt: 'In what order does a JSON.parse reviver visit the values of {"a":{"b":1},"c":2}?',
    options: [
      'The root first, then a, then b, then c, top down in source order',
      'b, then a, then c, then the root under the key "". Innermost values first, each object after its children',
      'a, b, c in source order, and the root is never passed to the reviver',
      'Only the leaves: b and c',
    ],
    correctOption: 1,
    answerInFull: `b, a, c, then the root with the empty string as its key.

The reviver runs bottom up. For each object, its properties are revived first, in order, and then the object itself is passed to the reviver. So b is revived, then a, whose value by then already holds the revived b, then c, and finally the root.

That order is what makes tagging work: when the reviver sees a tagged wrapper, its children have already been revived, so a tagged Map whose values are tagged Dates comes back fully built. It is the mirror of the replacer, which runs top down and sees each parent before its children.`,
    explanation: `Top down is the replacer's order and the one people assume for both. Reviving top down would hand you an object whose children are still raw.

Skipping the root would mean a reviver could never replace the whole document, and it can; the root is passed last with the key "".

Leaves only would mean the reviver never sees an object, and seeing objects is how a tagged wrapper gets replaced.`,
    hints: ['When the reviver sees an object, what state are its children in?'],
    tags: ['json', 'serialisation'],
  },
  {
    id: 'proto-key-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `const parsed = JSON.parse('{"__proto__": {"admin": true}, "name": "x"}')
console.log(parsed.admin, Object.keys(parsed))`,
    options: [
      "undefined [ '__proto__', 'name' ]",
      "true [ 'name' ]",
      "true [ '__proto__', 'name' ]",
      'It throws a SyntaxError, since __proto__ is not a valid JSON key',
    ],
    correctOption: 0,
    answerInFull: `undefined [ '__proto__', 'name' ]

JSON.parse creates properties with the equivalent of defineProperty, not assignment. A key spelled __proto__ in the text becomes an ordinary own property with that name, and the object's prototype is untouched, so parsed.admin is undefined and the key shows up in Object.keys like any other.

The place this turns into prototype pollution is the next step: a merge that does target[key] = source[key] for every key, where the assignment to target.__proto__ does set the prototype. parse is safe on its own; a naive deep-merge of what it returned is not.`,
    explanation: `true [ 'name' ] is what an object literal with that key would give, because in a literal __proto__ sets the prototype. parse deliberately does not follow that rule.

true with the key still listed is inconsistent: if the prototype had been set, the key would not be an own property.

__proto__ is an ordinary string as far as JSON's grammar is concerned. Nothing about parsing it fails.`,
    hints: ['Does parse assign properties or define them?'],
    tags: ['json', 'security'],
  },
  {
    id: 'map-stringify-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: "What does JSON.stringify(new Map([['a', 1]])) return?",
    options: ['\'[["a",1]]\'', '\'{"a":1}\'', "'{}'", 'It throws a TypeError'],
    correctOption: 2,
    answerInFull: `'{}'

stringify writes an object from its own enumerable properties. A Map keeps its entries in an internal slot, not as properties, and it has no toJSON, so there is nothing to write and the result is an empty object. Set does the same.

To serialise one, convert first: JSON.stringify([...map]) gives the entries as an array of pairs, and JSON.stringify(Object.fromEntries(map)) gives an object, when the keys are strings.`,
    explanation: `The array of pairs is what spreading the Map gives, and it is the right thing to write. stringify does not iterate; it reads properties.

{"a":1} assumes stringify knows what a Map is. It knows what toJSON is, and Map does not have one.

Nothing throws. Silent emptiness is the failure mode, which is what makes it easy to ship.`,
    hints: ['Where does a Map keep its entries?'],
    tags: ['json', 'collections'],
  },
  {
    id: 'indent-argument-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'JSON.stringify(config, 2) is meant to pretty-print and the output is still one line. Why?',
    options: [
      'The second argument is the replacer. A number there is ignored, and the indent goes in the third slot: JSON.stringify(config, null, 2)',
      'Indentation is capped at 10, and 2 is too small to produce visible whitespace',
      'The indent must be a string, so pass "  " rather than 2',
      'config has a toJSON method that returns a compact string',
    ],
    correctOption: 0,
    answerInFull: `The signature is stringify(value, replacer, space). The 2 landed in the replacer position, where anything that is not a function or an array is ignored, and space was left undefined, so the output is compact.

  JSON.stringify(config, null, 2)

null in the replacer slot means no replacer, and the 2 in the third slot is the number of spaces per level. A string works there too, "\\t" being the common one, and a number above 10 is treated as 10.`,
    explanation: `The cap at 10 is real and cuts the other way: larger numbers are reduced, small ones are used as given. 2 is the most common value and works fine in the right slot.

Both a number and a string are accepted for space. The problem is which argument it is, not which type.

A toJSON would change what is written, not how it is indented. Indentation is applied to the output regardless of where the values came from.`,
    hints: ['What are the three parameters of stringify?'],
    tags: ['json', 'serialisation'],
  },
]
