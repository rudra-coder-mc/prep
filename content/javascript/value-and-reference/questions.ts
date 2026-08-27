import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'pass-by-value-or-reference',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Is JavaScript pass by value or pass by reference?',
    options: [
      'Pass by value for primitives and pass by reference for objects, which is why a function can change an object it was given but not a number',
      'Pass by value, always. For an object the value copied into the parameter is a reference, so mutating it reaches the caller and reassigning it does not',
      'Pass by reference, always. Primitives are immutable, so there is no mutation to observe and the two models are indistinguishable for them',
      'Pass by value, always. The object is copied into the parameter, which is why reassigning the parameter inside the function leaves the caller untouched',
    ],
    correctOption: 1,
    answerInFull: `Pass by value, always. What gets copied into the parameter is the value of the argument, and for an object that value is a reference.

The consequence is the pair of behaviours people trip over:
- Mutating the argument, o.count += 1, changes the object the caller can see, because both names point at it.
- Reassigning the argument, o = {}, only repoints the local parameter, and the caller sees nothing.

If it were genuinely pass by reference, the second case would replace the caller's object too. Some people call the actual behaviour "pass by sharing", which is a clearer name for it.`,
    explanation: `"By reference for objects" is the answer interviewers are listening for you not to give. It predicts that reassigning the parameter replaces the caller's object, and it does not. The reassignment case is the whole test.

"By reference, always" has the right observation about primitives and the wrong conclusion. Immutability hides the difference for primitives, but an object shows it the moment a function assigns to its parameter.

"The object is copied" explains reassignment and breaks on mutation. If the parameter held a copy, o.count += 1 would be invisible to the caller, and it is the one thing everyone agrees is visible.`,
    hints: ['What happens if the function assigns a whole new object to its parameter?'],
    tags: ['memory', 'functions'],
  },
  {
    id: 'mutate-versus-reassign-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `function mutate(o) {
  o.count += 1
}

function reassign(o) {
  o = { count: 99 }
}

const box = { count: 0 }
mutate(box)
reassign(box)
console.log(box.count)`,
    options: ['0', '1', '99', 'It throws a TypeError'],
    correctOption: 1,
    answerInFull: `1

mutate reaches through the reference and changes the object both names point at, so count becomes 1. reassign only repoints its own parameter at a new object; box still points at the original, which is untouched, and the new object becomes garbage as soon as the function returns.

This is the clearest one-screen demonstration that the language passes references by value rather than passing by reference.`,
    explanation: `99 is pass by reference: if the parameter were the caller's binding, o = { count: 99 } would repoint box. It repoints o, a local name that dies at the return.

0 is the belief that a parameter receives a copy of the object. Then mutate would be working on a private copy and the caller would see nothing from either call.

The TypeError comes from reading o = ... as a write to the const. box is const; o is a parameter, which is a fresh let-like binding, and assigning to it is ordinary.`,
    hints: ['Which of the two functions changes the object, and which changes only a name?'],
    tags: ['memory', 'functions'],
  },
  {
    id: 'copy-depth-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const user = { name: 'Ada', tags: ['admin'] }
const copy = { ...user }
const clone = structuredClone(user)

copy.name = 'Bob'
copy.tags.push('staff')
clone.tags.push('guest')

console.log('name', user.name)
console.log('tags', user.tags.length)
console.log('clone', clone.tags.length)
console.log('shared', copy.tags === user.tags)`,
    items: [
      'tags 1',
      'shared true',
      'name Bob',
      'clone 2',
      'name Ada',
      'shared false',
      'tags 2',
      'clone 3',
    ],
    correctOrder: [4, 6, 3, 1],
    answerInFull: `name Ada
tags 2
clone 2
shared true

Spread copies one level. copy got its own name property, so writing Bob into it leaves user.name alone. copy.tags is the same array user.tags is, so the push through copy is a push into user's array, and its length is 2.

structuredClone copies every level. clone.tags is a separate array, holding its own 'admin' plus the 'guest' pushed into it, so its length is 2 as well, and user's array never saw that push.

The last line is the whole topic in one expression: the shallow copy's nested array is identical to the original's, not merely equal to it.`,
    explanation: `name Bob is spread read as an alias, as if { ...user } were user. It is a new object. Its top-level properties are its own, which is exactly why the nested array being shared is a surprise.

tags 1 is spread read as a deep copy. Then copy.tags would be a separate array and the push would not reach user. Spread copies the reference to the array, not the array.

clone 3 is structuredClone read as shallow. If clone.tags were user.tags, it would hold 'admin', 'staff' and 'guest' by the time it is printed. structuredClone walks the whole structure, so clone's array is its own.

shared false is the same misreading as tags 1, asked directly. Anyone who answered tags 1 has to answer shared false as well, and both are wrong for the same reason.`,
    hints: ['How many levels does spread copy?', 'Which of the three objects share an array?'],
    tags: ['memory', 'objects'],
  },
  {
    id: 'shallow-copy-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Every request after the first one uses a 50ms timeout, even though the defaults say 1000. What is the bug, and what is the fix?',
    code: `const defaults = { retries: 3, timeout: { ms: 1000 } }

function withFastTimeout() {
  const config = { ...defaults }
  config.timeout.ms = 50
  return config
}`,
    options: [
      'Spread copies one level, so config.timeout is the same object as defaults.timeout and the write edits the shared defaults. Copy the level being changed: { ...defaults, timeout: { ...defaults.timeout, ms: 50 } }',
      'Spread copies one level, so config.timeout is the same object as defaults.timeout. Freeze defaults with Object.freeze so the write cannot reach it',
      'Spread returns the same object it was given, so config is defaults and every write hits it. Copy with Object.assign({}, defaults) instead',
      'config is declared with const, so it cannot hold its own copy of timeout and the write goes through to defaults. Declare it with let',
    ],
    correctOption: 0,
    answerInFull: `Spread copies one level. config.timeout is the same object as defaults.timeout, so writing to it edits the shared defaults, permanently, for every later caller.

Fix one, copy the level being changed:

  const config = { ...defaults, timeout: { ...defaults.timeout, ms: 50 } }

Fix two, copy the whole structure:

  const config = structuredClone(defaults)
  config.timeout.ms = 50

The first is what I would ship. It is cheaper, and it says exactly which part is being replaced. Freezing defaults would also have turned this into an error at the write instead of a silent corruption.

The give-away in the symptom is "every request after the first". A bug that changes shared state rather than local state shows up as behaviour that depends on history, which is why it survives unit tests that each start fresh.`,
    explanation: `Freezing has the right diagnosis and no fix. Object.freeze is one level deep, so defaults.timeout stays writable, and even a deep freeze would only turn the silent corruption into a thrown error. The function still has to produce its own timeout object.

Object.assign has the wrong diagnosis and a fix that changes nothing. Spread does build a new object, and Object.assign builds one the same way, one level deep. Run it and defaults.timeout.ms is still 50 afterwards.

The const story confuses the binding with the object. const stops config being repointed; it says nothing about what config holds, and let would behave identically.`,
    hints: ['How many levels does spread copy?', 'Which object does config.timeout point at?'],
    tags: ['memory', 'objects'],
  },
  {
    id: 'deep-freeze',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write deepFreeze(value) that freezes an object and everything reachable from it, and survives a structure that contains a cycle. Which of these is correct?',
    options: [
      "function deepFreeze(value, seen = new WeakSet()) {\n  if (typeof value !== 'object') return value\n  if (seen.has(value)) return value\n\n  seen.add(value)\n  Object.freeze(value)\n\n  for (const key of Reflect.ownKeys(value)) {\n    deepFreeze(value[key], seen)\n  }\n\n  return value\n}",
      "function deepFreeze(value) {\n  if (value === null || typeof value !== 'object') return value\n  if (Object.isFrozen(value)) return value\n\n  Object.freeze(value)\n\n  for (const key of Reflect.ownKeys(value)) {\n    deepFreeze(value[key])\n  }\n\n  return value\n}",
      "function deepFreeze(value, seen = new WeakSet()) {\n  if (value === null || typeof value !== 'object') return value\n  if (seen.has(value)) return value\n\n  seen.add(value)\n  Object.freeze(value)\n\n  for (const key of Reflect.ownKeys(value)) {\n    deepFreeze(value[key], seen)\n  }\n\n  return value\n}",
      "function deepFreeze(value, seen = new WeakSet()) {\n  if (value === null || typeof value !== 'object') return value\n  if (seen.has(value)) return value\n\n  seen.add(value)\n  Object.freeze(value)\n\n  for (const key of Object.keys(value)) {\n    deepFreeze(value[key], seen)\n  }\n\n  return value\n}",
    ],
    correctOption: 2,
    answerInFull: `function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return value

  seen.add(value)
  Object.freeze(value)

  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen)
  }

  return value
}

Three details carry the question. The null check has to come before typeof, since typeof null is 'object'. The WeakSet is what makes a cycle terminate, and a WeakSet rather than a Set so the bookkeeping does not keep the objects alive. Reflect.ownKeys rather than Object.keys picks up symbol keys and non-enumerable ones, which Object.freeze covers but Object.keys would skip.

Say afterwards that freezing deeply is rarely the right answer at scale. It costs a walk of the whole structure and only reports violations in strict code. Not sharing a mutable object is the better fix when it is available.`,
    explanation: `The version without the null check throws on the first null it meets. typeof null is 'object', so null gets past the guard, and seen.add(null) is a TypeError because a WeakSet holds objects only. A structure with a single null field breaks it.

The Object.isFrozen version terminates a cycle and stops too early everywhere else. An object somebody else froze one level deep reports frozen, the walk returns there, and everything under it stays mutable. Frozen at the top is not the same fact as frozen all the way down.

The Object.keys version freezes the object and skips its symbol-keyed and non-enumerable children. Object.freeze locks those properties; it is their values that never get visited, so they stay writable.`,
    hints: [
      'What stops the recursion on a structure that points back at itself?',
      'Which keys does Object.keys miss?',
    ],
    tags: ['objects', 'immutability'],
  },
  {
    id: 'state-not-updating',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A list component does not re-render after items are added, even though the array clearly has more entries. The code does items.push(next) and then sets state to items. What is happening?',
    options: [
      'The framework compares the new state to the old one by contents, sees the same items plus one it already rendered, and skips the update. Give every item a unique id so the comparison can tell them apart',
      'push mutates the array in place, so the reference stored in state is the same before and after, and a framework comparing state by identity concludes nothing changed. Set state to a new array: setItems([...items, next])',
      'The setter is being called with the stale array the handler closed over, so the update is lost. Use the functional form: setItems((current) => { current.push(next); return current })',
      'State is updated correctly, but the rows are keyed by index, so the framework reuses the existing row elements and the new one never mounts. Key the rows by id',
    ],
    correctOption: 1,
    answerInFull: `The state was never replaced. push mutates the existing array, so the reference stored in state is the same before and after, and a framework that compares state by identity concludes nothing changed.

The fix is to produce a new array: setItems([...items, next]), or setItems((current) => [...current, next]) if the update depends on the previous value.

The same trap applies one level down: replacing an object inside the array means copying the array and the object being changed, not mutating the element in place.

Identity comparison is a deliberate trade. Comparing contents deeply on every render would be correct and far too slow, so frameworks require you to signal change by producing a new reference. That is the entire reason immutable update patterns exist in React and Redux, rather than a stylistic preference.`,
    explanation: `"Compares by contents" is the model the topic exists to correct. No framework walks two arrays on every state change; if one did, the extra entry would be noticed and the list would render. Identity is the cheap check and the only one being made.

The functional form fixes a different bug. It reads the latest state instead of a captured one, which matters for rapid updates, but the callback here still pushes into that array and returns the same reference. Same identity, same skipped render.

Index keys produce the wrong rows, not no rows. A list whose state reference changed re-renders whatever its keys are; bad keys make the framework reuse elements for the wrong items. The report says nothing re-renders at all, which is the identity check saying no.`,
    hints: ['Does push return a new array?'],
    tags: ['memory', 'immutability'],
  },
  {
    id: 'object-equality-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt: 'How would you check whether two objects are equal?',
    answerInFull: `First I would ask what equal means for this data, because the language only gives identity: === is true only when both names point at the same object.

Then, in order of increasing cost:
- If the objects are plain, JSON-safe and produced by the same code, comparing JSON.stringify output can be acceptable. It breaks on different key order, undefined values, Date, Map, Set, NaN and cycles.
- If the shape is known and small, comparing the handful of fields that define equality is faster and clearer than any generic solution.
- Otherwise a recursive comparison, with decisions made explicitly about NaN, arrays versus objects, prototypes and how deep to go. In most codebases that means importing one rather than writing one.`,
    explanation: `The answer being looked for is the first sentence: that JavaScript has no structural equality, so "equal" is something you define. Jumping straight to a recursive implementation misses the point of the question, which is whether you know why the language does not have one.

The performance angle is the other half. Deep comparison is O(size) on every call, which is exactly why identity comparison is what frameworks and Map keys use.`,
    hints: [],
    tags: ['objects', 'equality'],
  },
  {
    id: 'array-identity-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is the value of [1, 2] === [1, 2]?',
    options: ['true', 'false', 'It depends on the contents', 'It throws a TypeError'],
    correctOption: 1,
    answerInFull:
      '=== on objects compares identity, not contents. These are two separate arrays, so they are never equal regardless of what is inside them. The same is true of {} === {}, and it is why Set, Map and framework render checks can compare in constant time.',
    explanation: `true is the answer from looking at the contents, which is what === does for strings and numbers and never does for objects. Two literals are two allocations.

"It depends on the contents" is the same belief hedged. Nothing about the contents is consulted, so nothing about them can change the answer.`,
    hints: [],
    tags: ['equality', 'objects'],
  },
  {
    id: 'json-round-trip-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What survives JSON.parse(JSON.stringify(value)) unchanged?',
    options: [
      'A Date, which comes back as a Date',
      'A nested plain object of strings and numbers',
      'A property whose value is undefined',
      'A Map with two entries',
    ],
    correctOption: 1,
    answerInFull:
      'Only the plain nested data. A Date is serialised to an ISO string and comes back as a string, an undefined value is dropped from the output entirely, and a Map serialises as {} because it has no own enumerable properties. structuredClone handles all three, and throws on functions rather than dropping them silently.',
    explanation: `The Date is tempting because stringify does handle it, by calling toJSON. The output is a string, and parse has no way to know it was ever anything else.

undefined is the one that bites in practice: the key vanishes, so a later "in" check or Object.keys count is off by one and nothing threw.

The Map looks like it should work because it is iterable and has a size. JSON only sees own enumerable properties, and a Map keeps its entries elsewhere.`,
    hints: [],
    tags: ['objects', 'immutability'],
  },
  {
    id: 'const-mutation-choice',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which line throws, given const config = { retries: 3 }?',
    options: [
      'config.retries = 5',
      'config.timeout = 1000',
      'config = { retries: 5 }',
      'delete config.retries',
    ],
    correctOption: 2,
    answerInFull:
      'Only the reassignment. const protects the binding, so the name cannot be pointed at a different object, while the object itself stays fully mutable. Properties can be added, changed and deleted. Object.freeze is what stops the other three, one level deep, and only throws in strict code.',
    explanation: `The other three are all writes to the object, and const has never had an opinion about the object. Changing a property is the one most people reach for, adding one feels like it should be stricter, and delete looks destructive enough to be blocked. All three are ordinary on a const binding, and all three are what Object.freeze exists to stop.`,
    hints: [],
    tags: ['objects', 'immutability'],
  },
]
