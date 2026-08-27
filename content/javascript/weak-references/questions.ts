import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'no-iteration-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'staff',
    prompt: 'Why does a WeakMap have no size, no iteration and no clear?',
    options: [
      'Because the entries are stored on the key objects themselves rather than in the map, so there is no list to walk',
      'Because iterating would let a program observe when the collector ran, and collection timing is deliberately unobservable',
      'Because iteration order would be unstable, and the committee preferred no order to an unspecified one',
      'Because walking the entries would have to keep every key alive for the duration of the walk, which defeats the purpose',
    ],
    correctOption: 1,
    answerInFull: `Because the contents change without your program doing anything, and being able to look would turn that into information.

Ask a WeakMap for its size and the answer depends on whether the collector has run since the last time you asked. Nothing in your code caused the difference. That single number is enough to detect a collection, and once a program can detect one it can behave differently depending on it, which is the thing every engine and the specification work to prevent.

The same argument covers keys, values, entries, forEach and clear. What is left, get, set, has and delete, all take a key you already have, so they tell you nothing you did not already know.

The practical consequence is the rule for choosing. If you need to list what is in the collection, count it, or empty it, you need a Map, and the leak is now yours to manage with an eviction policy. If you only ever ask about an object you are already holding, a WeakMap does the same job with no policy at all.

It also means a WeakMap is not debuggable in the usual way. You cannot log its contents, and browser devtools show them only because the inspector sits outside the language rules the program plays by.`,
    explanation: `Storage on the key object is roughly how some engines implement it, and implementation is not the reason. An engine could keep a side table and still refuse to expose iteration, and it would still refuse for this reason.

Unstable order is a real property and not a blocker: a Set has a specified order and plenty of collections do not need one.

Keeping keys alive during a walk is a genuine implementation wrinkle, and it is solvable. The objection that killed iteration is observability.`,
    hints: ['What would a size that changes on its own be telling you?'],
    tags: ['memory', 'weakmap'],
  },
  {
    id: 'object-keys-only-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'Why can a string not be a WeakMap key?',
    options: [
      'Because strings are immutable, and a weak entry needs a mutable slot on the key',
      'Because there is nothing to become unreachable: two equal strings are the same value, so weakness would have no meaning',
      'Because strings are interned by the engine and interned values are never collected',
      'Because the specification reserves primitive keys for a future version',
    ],
    correctOption: 1,
    answerInFull: `Because weakness is about identity, and a primitive has none.

A weak reference means: when nothing else can reach this particular object, drop the entry. For an object, "this particular one" is meaningful, and two objects with identical contents are different keys. For a string it is not. The string "user-42" produced by two different expressions is the same value, so there is no moment at which the last reference to it goes away.

The API is asymmetric about it, and the asymmetry catches people.

    const meta = new WeakMap()
    meta.set('user-42', {})  // TypeError: Invalid value used as weak map key
    meta.get('user-42')      // undefined, no complaint at all

Writing rejects the key, reading does not. So a lookup that has been passing an id string instead of the object it meant returns undefined forever and never says why.

Current engines do accept one kind of primitive: an unregistered symbol, one made with Symbol(), which has identity in the way an object does. A registered symbol from Symbol.for is rejected, because the registry holds it forever.

When the key really is a string, a WeakMap is the wrong tool. Either the entries are bounded by something else, in which case use a Map with eviction, or the value's lifetime is what you want to follow, which is the narrow case WeakRef exists for.`,
    explanation: `Immutability is not the obstacle. Symbols are immutable too, and they are accepted, because what matters is identity rather than mutability.

Interning is close to the truth and stated as the wrong rule. The point is not that engines keep strings around; it is that a value with no identity cannot become unreachable.

Nothing is reserved for later. Symbols as keys is the change that did happen, and it happened precisely because they have identity.`,
    hints: ['What would it mean for a string to become unreachable?'],
    tags: ['memory', 'weakmap'],
  },
  {
    id: 'weakmap-lookup-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const meta = new WeakMap()
const key = { id: 1 }
meta.set(key, 'stored')

console.log(meta.get(key), meta.get({ id: 1 }), meta.has(key), meta.get('key'))`,
    options: [
      "'stored' 'stored' true undefined, because the second object has the same contents",
      "'stored' undefined true undefined, because keys are compared by identity and a primitive key simply misses",
      "'stored' undefined true, then a TypeError from getting with a string key",
      "'stored' undefined false undefined, because has only reports keys that are still strongly referenced",
    ],
    correctOption: 1,
    answerInFull: `'stored' undefined true undefined.

Three separate rules, one line.

Keys are compared by identity, exactly as in a Map. The second object literal is a different object with the same contents, so it is a different key and the lookup misses. Nothing about the WeakMap changes that; it is the ordinary rule for object keys.

has reports on the entry, which exists, because key is still referenced by a variable. There is no state in which an entry is present but hidden.

And the primitive lookup returns undefined rather than throwing. Only set and add reject a non-object; get, has and delete take anything and answer honestly, which is always no.

That last asymmetry is worth remembering as a debugging fact. Code that looks up by id string against a WeakMap keyed by objects returns undefined on every call and never produces an error, so the failure looks like missing data rather than like a bug.`,
    explanation: `Expecting the equal-looking object to match is the reflex from plain objects, where every key is stringified. Both Map and WeakMap compare object keys by identity.

There is no TypeError on the read. The rejection is on the write, which is where an unusable key would otherwise be stored silently.

has is not doing anything clever about reachability. It answers about the entry, and the key here is on the stack.`,
    hints: ['Which of these operations rejects a primitive, and which just miss?'],
    tags: ['memory', 'weakmap'],
  },
  {
    id: 'cycle-detection-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const seen = new WeakSet()

function walk(node, path) {
  if (seen.has(node)) {
    console.log('cycle at', path)
    return
  }
  seen.add(node)
  console.log('visit', path)

  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'object') walk(value, path + '.' + key)
  }
}

const a = { name: 'a', child: { name: 'b' } }
a.child.parent = a

walk(a, 'root')`,
    items: [
      'visit root.child',
      'cycle at root.child',
      'visit root',
      'visit root.child.parent',
      'cycle at root.child.parent',
    ],
    correctOrder: [2, 0, 4],
    answerInFull: `visit root, visit root.child, cycle at root.child.parent.

The walk marks each object as seen before descending into it, so when the child's parent property leads back to the object the walk started from, the check catches it and stops. Without the WeakSet this recursion never ends: root, child, parent, child, parent, until the call stack does.

This is the canonical use of a WeakSet, and the reason it is a WeakSet rather than a Set is about what happens after the walk. A Set of visited objects keeps every object it visited alive for as long as the Set exists. For a walk over a large graph, that is a copy of the graph's liveness held by a variable you have finished with.

    const seen = new WeakSet()

With the weak version the marks disappear as the objects do, and if the seen collection is a module-level one shared by many walks, the difference is the whole leak.

The same shape is behind deep clone, structural equality, JSON serialisation with cycle handling, and validators that walk user data. Any of them without a seen set is a stack overflow waiting for a self-referencing input.`,
    explanation: `cycle at root.child is in the pool for the reading where the object is marked as seen after its children are visited rather than before, which detects the cycle one level too early.

visit root.child.parent is what prints if the guard is missing entirely, and it is the first line of the infinite recursion that follows.`,
    hints: ['When is the node added to the set, relative to descending into it?'],
    tags: ['memory', 'weakset'],
  },
  {
    id: 'strong-key-elsewhere-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'This was written specifically to avoid a leak, and memory still grows without bound. Why?',
    code: `const mounted = []
const state = new WeakMap()

export function mount(component) {
  mounted.push(component)
  state.set(component, { renderedAt: Date.now(), tree: buildTree(component) })
}

export function unmount(component) {
  component.teardown()
}`,
    options: [
      'The WeakMap value holds a reference to the component through its tree, which keeps the key alive',
      'unmount never removes the component from the mounted array, and that array is a strong reference from a root, so no key is ever collectable',
      'WeakMap entries are only collected on a major collection, and a long-running page may not have one',
      'state.set was called after the push, so the entry was created with an already strong key',
    ],
    correctOption: 1,
    answerInFull: `The array. A weak key that something else holds strongly is not weak in any way that matters.

mounted is a module-level array, which is reachable from a root for the life of the program. Every component pushed into it stays reachable, so every WeakMap entry stays valid, and the trees inside those entries stay alive too. The WeakMap is doing exactly what it promises and the promise is worth nothing here.

    export function unmount(component) {
      component.teardown()
      mounted.splice(mounted.indexOf(component), 1)
    }

That is the fix, and it makes the point: the WeakMap removed one bookkeeping obligation and the array added it straight back.

The question worth asking whenever a WeakMap appears in a review is who else holds the key. If the answer is a registry, a list of active things, a closure, or an event handler, the weakness is decorative. If the answer is the DOM, the caller, or a framework, it is doing real work.

The value referencing its key, which is the other tempting answer here, is specifically not a problem. The specification says an entry whose key is only reachable through the WeakMap itself is removed, so a tree that points back at its component does not keep it alive.`,
    explanation: `The ephemeron rule is the one detail that makes the first option wrong, and it is worth knowing for exactly this reason: self-referencing values are the case people expect to leak and the case the specification handles.

Collection schedules do not create unbounded growth. A reachable object is not a candidate on any schedule.

Order of operations changes nothing. A key is weak because of how the WeakMap holds it, not because of what was true when it was inserted.`,
    hints: ['Who else is holding the key?'],
    tags: ['memory', 'weakmap', 'debugging'],
  },
  {
    id: 'finalizer-never-runs-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt: 'This cleanup callback never fires, no matter how much memory pressure there is. Why?',
    code: `const open = new Map()

const registry = new FinalizationRegistry((handle) => {
  handle.close()
  open.delete(handle.id)
})

function track(resource) {
  open.set(resource.id, resource)
  registry.register(resource, resource)
}`,
    options: [
      'The held value is the resource itself, so the registry holds the target strongly and it can never become unreachable',
      'register needs a third argument, the unregister token, or the entry is never activated',
      'FinalizationRegistry callbacks only run when the registry itself is collected',
      'The callback must be asynchronous, since finalization runs outside the main job queue',
    ],
    correctOption: 0,
    answerInFull: `The held value is the target. The registry keeps held values alive so it can pass them to the callback, so registering an object as its own held value guarantees it can never be collected, which guarantees the callback can never run.

    registry.register(resource, { id: resource.id, close: resource.close.bind(resource) })

That has the same problem in disguise: a bound method holds its receiver. The held value has to be something that does not reach the target at all, usually a plain key or id, and the callback then uses that key to clean up whatever it can reach without the target.

There is a second, larger bug in this code, and it is the reason the shape is worth recognising. open is a Map holding every resource strongly by id. Even with a correct held value, nothing would ever be collected.

The broader rule, and the one to say in an interview: a finalizer is a backstop, never a mechanism. A callback may never run, because the program exited, because the engine never collected that object, or because it collected it at shutdown and skipped the callbacks. Anything that must happen has to happen in code that runs: close the file, release the lock, unsubscribe, in a teardown or a finally.`,
    explanation: `The unregister token is optional. Its only job is to let you cancel a registration later, which you want when the resource is closed properly and you no longer need the backstop.

The registry does not need to be collected for callbacks to fire; it does need to be alive, which is one reason to keep it in a module-level constant.

Callbacks already run outside any job of yours, and the timing is unspecified. Nothing about making the callback async changes whether it is called.`,
    hints: ['What does the registry have to hold in order to hand it to the callback?'],
    tags: ['memory', 'weakref', 'debugging'],
  },
  {
    id: 'deref-liveness-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt: 'What can you rely on after ref.deref() returns an object rather than undefined?',
    options: [
      'That the object is alive for the rest of the current job, so it will not vanish partway through your synchronous work',
      'That the object is alive until you drop the local variable holding it',
      'That the object will still be there on the next deref, since it has been proven reachable',
      'Nothing: the object may be collected between the return of deref and the next line',
    ],
    correctOption: 0,
    answerInFull: `That it survives at least until the end of the current job. The specification says a target returned from deref is not reclaimed until the current job completes, and that guarantee is what makes WeakRef usable at all.

Without it the API would be unwritable: every property read after a successful deref would have to be defensive, because the object could vanish mid-expression. With it, the rule is simple.

    const thing = ref.deref()
    if (thing === undefined) return rebuild()
    // safe for the rest of this synchronous run
    use(thing.a, thing.b)

Two consequences follow. Deref once and keep the result in a local, rather than calling it repeatedly, both because it is clearer and because the local is an ordinary strong reference. And do not carry a conclusion across an await or a timer: a deref in one turn says nothing about the next one, and code that checks liveness early and uses the object later is the classic WeakRef bug.

The other half of the same rule is less known: merely constructing a WeakRef keeps its target alive until the end of the current job too. That stops a target from disappearing between creating the reference and doing anything with it.`,
    explanation: `The local variable answer is true in the ordinary sense, and it describes what your own reference does rather than what the specification guarantees about the collector. The reason to know the job rule is that it also covers the object being reachable while you are reading properties off a temporary.

Expecting the next deref to succeed is the mistake this design is most likely to produce. Liveness is a fact about a moment, and the next turn is a different moment.

Saying nothing is guaranteed over-corrects, and would make the API useless.`,
    hints: ['How long does the guarantee last, and why does it have to last that long?'],
    tags: ['memory', 'weakref'],
  },
  {
    id: 'private-data-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'You are writing a library that decorates objects created by somebody else, and you need to attach state to each one without touching it. What do you reach for?',
    options: [
      'A property with an unusual name, such as __libState, since users will not collide with it',
      'A Symbol-keyed property, so it does not appear in keys, JSON or spread',
      'A module-level WeakMap keyed by the object, so the state disappears when the object does',
      'A private class field, since #state is not accessible from outside',
    ],
    correctOption: 2,
    answerInFull: `A WeakMap keyed by the object.

    const state = new WeakMap()

    export function decorate(target) {
      state.set(target, { calls: 0, startedAt: Date.now() })
      return target
    }

    export function calls(target) {
      return state.get(target)?.calls ?? 0
    }

Nothing is added to the object, so it serialises, spreads and enumerates exactly as it did before, and your state cannot be reached by anyone who does not have the WeakMap. When the caller drops the object, your entry goes with it, with no unregister call for anyone to forget.

The comparison worth being able to make: a private field is the right answer for a class you write, because it is syntax rather than a side table, and it cannot be used here at all, since the objects are not yours to construct.

A symbol-keyed property is the reasonable second choice and differs in two ways. It is visible to Object.getOwnPropertySymbols and to Reflect.ownKeys, so it is hidden by convention rather than by access, and it lives on the object, so it survives a structured clone and shows up in a debugger. Sometimes that is what you want.

The one real cost of the WeakMap version is that you cannot enumerate what you have decorated, because a WeakMap cannot be iterated. If a report of every decorated object is a requirement, this is the wrong tool.`,
    explanation: `An unusual string key collides eventually, appears in JSON.stringify and in a spread, and turns your internal state into part of the user's data.

Symbols are a genuine alternative rather than a wrong answer. They lose on the one property the question asks for: the state stays on the object, so it lives as long as the object does regardless of whether you still care.

A private field is not available for an object you did not construct. Adding one requires being the class.`,
    hints: ['Whose objects are they, and who decides when they die?'],
    tags: ['memory', 'weakmap', 'coding'],
  },
  {
    id: 'weakref-cache-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'A service caches parsed documents by a string id. The parsed documents are large, and most of them are also held by whatever is currently rendering them. A colleague proposes a Map of id to WeakRef, with a FinalizationRegistry to delete dead entries. Is that the right design?',
    options: [
      'No: WeakRef exposes collection timing, and any use of it in production code is a defect',
      'It is a defensible fit, since the key is a primitive and the values are owned elsewhere, but a size-bounded cache with LRU eviction is more predictable and should be the default',
      'Yes, and it is strictly better than a bounded cache, because it never evicts anything that is still in use',
      'No: a WeakMap keyed by the id string does the same job with less code',
    ],
    correctOption: 1,
    answerInFull: `It fits the narrow case the API exists for, and it is still not the first thing to reach for.

The case fits because both halves are true. The key is a string, so a WeakMap cannot be used at all. And the values are genuinely owned elsewhere, so their lifetimes carry real information: an entry whose document nothing is rendering is exactly the entry worth dropping.

    const cache = new Map() // id -> WeakRef<Doc>
    const registry = new FinalizationRegistry((id) => cache.delete(id))

    function load(id) {
      const hit = cache.get(id)?.deref()
      if (hit) return hit
      const doc = parse(id)
      cache.set(id, new WeakRef(doc))
      registry.register(doc, id, doc)
      return doc
    }

What you give up is predictability. Hit rate now depends on the collector, so it varies between engines, between runs and with unrelated memory pressure. That makes performance untestable in the usual way, and it makes a bug report of "sometimes it is slow" nearly unanswerable.

An LRU cache with a maximum size has none of those problems: a fixed memory bound, a hit rate you can measure and reason about, and behaviour that does not change when somebody else allocates. Its cost is that it can evict something still in use, which merely means rebuilding it.

The honest recommendation is to start with the bounded cache, and to reach for the weak version only when profiling shows the bound itself is the problem, which is rare.`,
    explanation: `Calling any use a defect is the over-correction. The specification discourages depending on collection timing and the API exists because a few designs genuinely need it.

Claiming it is strictly better ignores what was traded away. Never evicting something in use also means never bounding memory: if everything stays referenced, the cache holds everything.

A WeakMap cannot be keyed by a string at all, so the last option does not compile, let alone work.`,
    hints: ['What does each design make predictable, and what does it hand to the collector?'],
    tags: ['memory', 'weakref', 'scenario'],
  },
  {
    id: 'weak-value-chain-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt:
      'A WeakMap holds two entries: key a maps to object b, and object b is the key of the second entry, whose value is a large state object. Only a is referenced from outside. What is alive?',
    options: [
      'All of it: a is reachable, its value b is held strongly by the entry, so b is reachable, so b entry and the state are alive too',
      'Only a and its entry: b is a weak key, so the second entry can be collected at any time',
      'Only a: entries are dropped as soon as the value is not separately referenced',
      'Nothing is guaranteed, because entry order in a WeakMap is unspecified',
    ],
    correctOption: 0,
    answerInFull: `All of it, and it follows from one rule: keys are weak, values are not.

Trace it from the root. a is on the stack, so a is reachable. Its entry therefore stands, and the entry holds its value strongly, so b is reachable. b being reachable means b's own entry stands, and that entry holds the large state object strongly. One live key at the head of the chain keeps everything behind it.

Drop the last outside reference to a and all of it becomes unreachable at once, because nothing outside the WeakMap reaches any of it.

This is the detail that decides whether a WeakMap actually bounds memory. It bounds entries by the lifetimes of their keys, so if the keys live for the life of the process, so does everything the values can reach. A WeakMap keyed by long-lived objects is not a bound at all.

The related rule, easy to confuse with this one, works in your favour. If a key is reachable only by following references that start inside the WeakMap itself, the entry is removed. So a value that points back at its own key is safe, and a cycle that lives entirely inside the map is collected.`,
    explanation: `The second option treats the weakness of b as if it were a property of b rather than of how the map holds it. b is strongly held here, by the first entry's value.

The third answer inverts the design: values are not the thing being held weakly, and an entry does not need its value referenced from elsewhere to survive.

There is no entry order in a WeakMap to be specified or unspecified, which is the point of the whole collection.`,
    hints: ['Follow the references from the root one at a time.'],
    tags: ['memory', 'weakmap'],
  },
  {
    id: 'weak-choice-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'When would you reach for a WeakMap, and when for a WeakRef? What would make you use neither?',
    answerInFull: `- The one-line version first: a WeakMap is for data about an object whose lifetime somebody else owns, and a WeakRef is for the rare case where you need to follow a lifetime you cannot key on.
- For the WeakMap I would name the shape rather than the API: metadata keyed by a DOM node, a request or a socket; private state for objects I did not construct; memoisation keyed by an object argument; and a WeakSet for have-I-seen-this, which is how you keep a graph walk from looping forever.
- The two details that show it has been used rather than read about: the keys are weak and the values are not, so a live key retains everything its value reaches; and it cannot be iterated, sized or cleared, because that would expose when the collector ran.
- The question I would ask in review is who else holds the key. A WeakMap whose keys are also in a module-level registry is not weak in any way that matters, and that is the version of this that actually ships.
- For a class I write, private fields beat a WeakMap: it is syntax, it needs no side table, and it says what it means. The WeakMap earns its place when the objects are not mine.
- WeakRef I would treat as a last resort, and I would say why in the specification's own terms: correct programs should not depend on the timing of collection, and WeakRef and FinalizationRegistry are the two things that let you. The case where it fits is a cache with primitive keys whose values are large and genuinely owned elsewhere.
- A finalizer is a backstop, never a mechanism. It may never run, and the held value must not reference the target or the target can never be collected in the first place.
- What I would use instead, most of the time, is a bounded cache: a maximum size with least-recently-used eviction, or an age bound. Predictable memory, a measurable hit rate, and behaviour that does not change because something unrelated allocated.

The summary I would give if pushed for one sentence: use the weakest tool whose behaviour you can still predict, which is usually a bounded Map, sometimes a WeakMap, and rarely a WeakRef.`,
    explanation: `The tell of a good answer is that it starts from lifetimes and ownership rather than from the API surface. Anybody can list the methods; what matters is the question of who decides when the object dies.

Two things read as real experience. Noticing that a weak key held strongly elsewhere buys nothing, which is the mistake that makes it into production. And treating finalizers as unreliable by design rather than as a cleanup hook, because the alternative is a resource leak that only appears under load.`,
    hints: [],
    tags: ['memory', 'weakmap', 'design'],
  },
]
