import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'pass-by-value-or-reference',
    type: 'concept',
    difficulty: 'medium',
    prompt: 'Is JavaScript pass by value or pass by reference? Explain precisely.',
    expectedAnswer: `Pass by value, always. What gets copied into the parameter is the value of the argument, and for an object that value is a reference.

The consequence is the pair of behaviours people trip over:
- Mutating the argument - o.count += 1 - changes the object the caller can see, because both names point at it.
- Reassigning the argument - o = {} - only repoints the local parameter, and the caller sees nothing.

If it were genuinely pass by reference, the second case would replace the caller's object too. Some people call the actual behaviour "pass by sharing", which is a clearer name for it.`,
    explanation: `The reassignment case is the whole test. It is also the reason a function that wants to "return" an object usually returns it rather than writing into an out parameter, which is a pattern that simply cannot work here.

Primitives make this hard to see, because a primitive being immutable means there is no mutation to observe - only reassignment, which is local either way.`,
    hints: ['What happens if the function assigns a whole new object to its parameter?'],
    tags: ['memory', 'functions'],
  },
  {
    id: 'mutate-versus-reassign-output',
    type: 'output',
    difficulty: 'easy',
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
    expectedOutput: '1',
    explanation: `mutate reaches through the reference and changes the object both names point at, so count becomes 1. reassign only repoints its own parameter at a new object; box still points at the original, which is untouched, and the new object becomes garbage as soon as the function returns.

This is the clearest one-screen demonstration that the language passes references by value rather than passing by reference.`,
    hints: ['Which of the two functions changes the object, and which changes only a name?'],
    tags: ['memory', 'functions'],
  },
  {
    id: 'spread-versus-alias-output',
    type: 'output',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const a = { n: 1 }
const copy = { ...a }
const alias = a

a.n = 2

console.log(copy.n, alias.n)`,
    expectedOutput: '1 2',
    explanation: `Spread built a new object and copied the value of n into it at that moment, so copy is unaffected by later changes to a. alias never copied anything - it holds the same reference, so it sees the mutation.

The copy is only shallow, though. If n had been an object rather than a number, copy.n and a.n would point at the same thing and the answer would be different.`,
    hints: [],
    tags: ['memory', 'objects'],
  },
  {
    id: 'shallow-copy-bug',
    type: 'debugging',
    difficulty: 'medium',
    prompt:
      'Every request after the first one uses a 50ms timeout, even though the defaults say 1000. Explain why, and fix it.',
    code: `const defaults = { retries: 3, timeout: { ms: 1000 } }

function withFastTimeout() {
  const config = { ...defaults }
  config.timeout.ms = 50
  return config
}`,
    expectedAnswer: `Spread copies one level. config.timeout is the same object as defaults.timeout, so writing to it edits the shared defaults, permanently, for every later caller.

Fix one, copy the level being changed:

  const config = { ...defaults, timeout: { ...defaults.timeout, ms: 50 } }

Fix two, copy the whole structure:

  const config = structuredClone(defaults)
  config.timeout.ms = 50

The first is what I would ship - it is cheaper and it says exactly which part is being replaced. Freezing defaults would also have turned this into an error at the write instead of a silent corruption.`,
    explanation: `The give-away in the symptom is "every request after the first". A bug that changes shared state rather than local state shows up as behaviour that depends on history, which is why it survives unit tests that each start fresh.

The general rule for immutable updates: copy every level on the path you are changing, share everything else.`,
    hints: ['How many levels does spread copy?', 'Which object does config.timeout point at?'],
    tags: ['memory', 'objects'],
  },
  {
    id: 'deep-freeze',
    type: 'coding',
    difficulty: 'medium',
    prompt:
      'Write deepFreeze(value) that freezes an object and everything reachable from it, and survives a structure that contains a cycle.',
    expectedAnswer: `function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return value

  seen.add(value)
  Object.freeze(value)

  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen)
  }

  return value
}`,
    explanation: `Three details carry the question. The null check has to come before typeof, since typeof null is 'object'. The WeakSet is what makes a cycle terminate, and a WeakSet rather than a Set so the bookkeeping does not keep the objects alive. Reflect.ownKeys rather than Object.keys picks up symbol keys and non-enumerable ones, which Object.freeze covers but Object.keys would skip.

Worth saying afterwards that freezing deeply is rarely the right answer at scale - it costs a walk of the whole structure and only reports violations in strict code. Not sharing a mutable object is the better fix when it is available.`,
    hints: [
      'What stops the recursion on a structure that points back at itself?',
      'Which keys does Object.keys miss?',
    ],
    tags: ['objects', 'immutability'],
  },
  {
    id: 'state-not-updating',
    type: 'scenario',
    difficulty: 'medium',
    prompt:
      'A list component does not re-render after items are added, even though the array clearly has more entries. The code does items.push(next) and then sets state to items. What is happening?',
    expectedAnswer: `The state was never replaced. push mutates the existing array, so the reference stored in state is the same before and after, and a framework that compares state by identity concludes nothing changed.

The fix is to produce a new array: setItems([...items, next]), or setItems((current) => [...current, next]) if the update depends on the previous value.

The same trap applies one level down: replacing an object inside the array means copying the array and the object being changed, not mutating the element in place.`,
    explanation: `Identity comparison is a deliberate trade. Comparing contents deeply on every render would be correct and far too slow, so frameworks require you to signal change by producing a new reference. That is the entire reason immutable update patterns exist in React and Redux, rather than a stylistic preference.

The functional form of the setter matters for a second reason unrelated to this bug: it reads the latest state rather than the value captured when the handler was created.`,
    hints: ['Does push return a new array?'],
    tags: ['memory', 'immutability'],
  },
  {
    id: 'object-equality-interview',
    type: 'interview',
    difficulty: 'medium',
    prompt: 'How would you check whether two objects are equal?',
    expectedAnswer: `First I would ask what equal means for this data, because the language only gives identity: === is true only when both names point at the same object.

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
    id: 'array-identity-mcq',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'What is the value of [1, 2] === [1, 2]?',
    options: ['true', 'false', 'It depends on the contents', 'It throws a TypeError'],
    correctOption: 1,
    explanation:
      '=== on objects compares identity, not contents. These are two separate arrays, so they are never equal regardless of what is inside them. The same is true of {} === {}, and it is why Set, Map and framework render checks can compare in constant time.',
    hints: [],
    tags: ['equality', 'objects'],
  },
  {
    id: 'json-round-trip-mcq',
    type: 'mcq',
    difficulty: 'medium',
    prompt: 'What survives JSON.parse(JSON.stringify(value)) unchanged?',
    options: [
      'A Date, which comes back as a Date',
      'A nested plain object of strings and numbers',
      'A property whose value is undefined',
      'A Map with two entries',
    ],
    correctOption: 1,
    explanation:
      'Only the plain nested data. A Date is serialised to an ISO string and comes back as a string, an undefined value is dropped from the output entirely, and a Map serialises as {} because it has no own enumerable properties. structuredClone handles all three, and throws on functions rather than dropping them silently.',
    hints: [],
    tags: ['objects', 'immutability'],
  },
  {
    id: 'const-mutation-mcq',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'Which line throws, given const config = { retries: 3 }?',
    options: [
      'config.retries = 5',
      'config.timeout = 1000',
      'config = { retries: 5 }',
      'delete config.retries',
    ],
    correctOption: 2,
    explanation:
      'Only the reassignment. const protects the binding, so the name cannot be pointed at a different object, while the object itself stays fully mutable - properties can be added, changed and deleted. Object.freeze is what stops the other three, one level deep, and only throws in strict code.',
    hints: [],
    tags: ['objects', 'immutability'],
  },
]
