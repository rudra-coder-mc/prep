import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-the-chain',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What happens when you read a property an object does not have?',
    options: [
      'It walks the prototype chain and throws a TypeError once it reaches the end without a match',
      'It walks the chain and returns the last match it finds, so the furthest prototype wins',
      'It walks the chain and returns undefined once it reaches the end without a match',
      'undefined, since a read looks only at own properties and an inherited one has to be reached through the prototype',
    ],
    correctOption: 2,
    answerInFull: `Every object has an internal link to another object, its prototype, or to null. Reading a property checks the object's own properties first; if it is not there, the lookup follows the link and checks that object, and so on until it finds the property or reaches null, at which point the result is undefined.

Two things people miss:
- Writing does not walk the chain. Assigning creates an own property on the object itself, shadowing whatever was inherited.
- Methods are not copied onto instances. They live on the prototype and are found by lookup, which is why adding a method to a prototype affects objects that already exist.

Reading walks and writing does not is the asymmetry worth stating out loud. It explains shadowing, why mutating an inherited array is shared while assigning one is not, and why monkey patching a built-in prototype works retroactively.`,
    explanation: `The TypeError is the answer from a language with declared shapes. Reading a property nobody defined is not an error here, which is why a typo in a property name is silent and a typo in a method name is a TypeError one line later, when undefined is called.

Returning the last match inverts the rule and would make inheritance useless: an override on the object itself would always lose to the thing it was overriding. First match wins, which is what makes a subclass method beat its parent's.

The last option describes a language where inheritance exists for methods and not for data. Nothing distinguishes the two here. A method is a property whose value happens to be a function, and it is found by exactly the same walk.`,
    hints: ['What happens when the property is not found on the object itself?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'shadowing-output',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const parent = { greeting: 'hello' }
const child = Object.create(parent)

console.log(child.greeting)
child.greeting = 'hi'
console.log(child.greeting, parent.greeting)
delete child.greeting
console.log(child.greeting)`,
    items: ['hi hi', 'hello', 'undefined', 'hi hello', 'hello'],
    correctOrder: [1, 3, 4],
    answerInFull: `hello, then hi hello, then hello

child has no own properties, so the first read follows the link to parent and finds hello there.

The assignment does not follow that link. A write always lands on the object itself, so it creates an own greeting on child that shadows the inherited one, and parent is untouched. That is why the second line reads hi from one object and hello from the other.

Deleting the own property removes only the shadow. The inherited value is still there and becomes visible again, which is why delete can appear to restore an old value rather than produce undefined.

The rule underneath all three lines is that reading walks the chain and writing does not.`,
    explanation: `"hi hi" is the pool's version of a write that walks. If assignment followed the link and updated wherever the property was found, every object sharing a prototype would overwrite the others, and Object.create would be useless for defaults.

"undefined" is what most people expect from the last line, because deleting a property normally leaves nothing behind. Here it leaves what was always underneath it. Only the own property existed to be deleted.

Nothing in this reaches parent at any point after the first line, which is the fact to say out loud: two of the three lines are about an object that was never modified.`,
    hints: ['Does assignment modify the prototype or the object?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'patching-a-built-in',
    type: 'interview',
    form: 'open',
    tier: 'staff',
    prompt:
      'A library adds a helper to Array.prototype so that every array in the application can use it. What goes wrong, and what would you do instead?',
    answerInFull: `It works, and it works retroactively on every array that already exists, because an array holds a link to Array.prototype rather than a copy of it. That is the appeal, and it is also the whole problem: there is one Array.prototype per realm and every piece of code in the process is looking at it.

What goes wrong, roughly in order of how badly:

- Enumerability. Array.prototype.pluck = fn creates an enumerable property, so it turns up in every for...in over an array anywhere in the application, including in code written before the library existed. Object.defineProperty with enumerable: false avoids that one and none of the others. The real built-ins are all non-enumerable, which is why nobody notices them.
- Collision with the language. Two libraries choosing the same name fight silently, and so does a future version of the specification. Array.prototype.flatten had to be renamed to flat because shipping it broke sites that had already been given a flatten by a library. That is the concrete precedent, and it is the strongest evidence this is a constraint rather than a preference.
- Collision with the reader. A method that exists only if some module was imported cannot be traced from the call site, and it does not exist in a REPL or a test file that imported something else.
- Optimisation. Engines specialise on the shape of the built-in prototypes, and changing one after code has been running invalidates what depended on it.

What I would do instead: export a plain function and call it, pluck(list, 'id'). If the fluent style is genuinely the requirement, a subclass of Array is the honest version, because it adds to an object of your own rather than to everybody's.

The one case worth allowing is a polyfill: implementing a standard method the environment lacks, guarded by a check that it is missing, and matching the specified behaviour exactly. That is not adding to the prototype, it is filling in what should already have been there.`,
    explanation: `The two things an interviewer is listening for are that the prototype is shared for the whole realm rather than per module, and the enumerability point, because that is the one that breaks unrelated code rather than your own.

The flatten story is worth telling if you know it, under the name SmooshGate. It also shows what the alternative costs: the committee took the rename rather than the breakage, which is a decision about somebody else's monkey patch.

The answer that stops at "it is bad practice" is the one this question exists to get past. Every mechanism named above is a consequence of the chain, which is the topic, and being able to derive them beats having read the rule.`,
    hints: [],
    tags: ['objects', 'prototype', 'design'],
  },
  {
    id: 'proto-vs-prototype',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Given const d = new Dog(), which of these is true?',
    options: [
      'd.prototype === Dog.prototype',
      'Object.getPrototypeOf(d) === Dog.prototype',
      'Object.getPrototypeOf(Dog) === Dog.prototype',
      'd.__proto__ === Dog',
    ],
    correctOption: 1,
    answerInFull: `Object.getPrototypeOf(d) === Dog.prototype.

prototype is a property on constructor functions. It is the object that instances created with new will link to. Ordinary objects do not have it, so d.prototype is undefined.

The link itself is on every object, and Object.getPrototypeOf is how you read it. __proto__ is the legacy accessor for the same internal slot, and Object.setPrototypeOf is the writer.

  const d = new Dog()
  Object.getPrototypeOf(d) === Dog.prototype // true
  d.prototype // undefined

The naming is genuinely bad, and stating the relationship as an equation is the clearest way to answer it. Dog.prototype is not Dog's prototype. It is the prototype Dog hands out to its instances.`,
    explanation: `d.prototype is the mistake the name invites, and it is undefined rather than an error, so the code that depends on it fails somewhere else entirely.

Object.getPrototypeOf(Dog) asks what Dog itself inherits from, which is a different question with a real answer: Function.prototype for a base class, and the parent class for one written with extends. Never its own prototype property.

d.__proto__ === Dog swaps the two sides. The instance links to Dog.prototype, not to Dog, and the difference is exactly what the prototype property exists for.`,
    hints: ['Which of the two exists on an instance, and which on the constructor?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'hasownproperty',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      "This is meant to list an object's own keys and includes inherited ones. Which fix is right, and safe on any object?",
    code: `function ownKeys(obj) {
  const keys = []
  for (const key in obj) {
    keys.push(key)
  }
  return keys
}`,
    options: [
      'Guard the loop with obj.hasOwnProperty(key)',
      'Return Object.keys(obj), which is the own enumerable string keys and nothing inherited',
      'Use for...of over the object instead, which visits only own properties',
      'Guard the loop with key in obj, which is true only for an own property',
    ],
    correctOption: 1,
    answerInFull: `for...in walks the whole prototype chain and yields every enumerable string key it finds, not only the own ones.

  return Object.keys(obj)

That is the fix: it is own enumerable string keys by definition, so there is nothing to guard.

If for...in is required for some other reason, guard it with Object.hasOwn:

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) keys.push(key)
  }

Object.hasOwn is safer than obj.hasOwnProperty(key), which breaks on objects created with Object.create(null) and on objects that carry their own hasOwnProperty. Data parsed from JSON can carry exactly that key, and then calling it as a method either throws or lies.`,
    explanation: `hasOwnProperty as a method is the fix everybody writes and the reason Object.hasOwn was added. It works until the object has no prototype, or until it came from JSON that happened to contain a hasOwnProperty key, at which point you are calling whatever the untrusted data put there.

for...of over a plain object throws: an object is not iterable unless it declares Symbol.iterator. That is a real difference between the two loops and the reason for...in survives at all.

in is the guard that looks right and does nothing. It answers the same question the loop already answered, walking the chain exactly the same way, so every inherited key passes it.`,
    hints: ['What does for...in iterate over?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'method-lookup-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `class Animal {
  speak() {
    return 'generic noise'
  }
}

class Dog extends Animal {
  speak() {
    return 'woof'
  }
}

const d = new Dog()
console.log(d.speak())

delete Dog.prototype.speak
console.log(d.speak())

console.log(Object.hasOwn(d, 'speak'))`,
    options: [
      'woof, woof, false',
      'woof, TypeError: d.speak is not a function, false',
      'woof, generic noise, false',
      'woof, generic noise, true',
    ],
    correctOption: 2,
    answerInFull: `woof, generic noise, false

The instance has no speak of its own. The lookup finds Dog.prototype.speak first, and once that has been deleted it carries on up to Animal.prototype.speak. Nothing about the instance changed at any point, which is why hasOwn is false throughout.

The fact this really demonstrates is that method resolution happens at call time rather than when the object is created. The instance holds a link, not a copy, so changing what is at the other end of the link changes what the instance does, including for objects that already existed.

That is also the mechanism behind monkey patching a built-in prototype, and behind the advice not to.`,
    explanation: `woof twice is the answer if methods are copied into instances when they are constructed, which is how classes work in most other languages. Then deleting one from the prototype would be too late to matter.

The TypeError is the sharper version: it accepts that the method was found by lookup, and stops the lookup at the first prototype. The walk does not stop there. It carries on to the next link, which is what extends set up.

true for hasOwn is the same copying belief measured directly. If the instance had its own speak, the delete would have changed nothing at all.`,
    hints: [
      'Where does speak actually live?',
      'What does the lookup do once the first match is gone?',
    ],
    tags: ['objects', 'prototype', 'classes'],
  },
  {
    id: 'inherited-mutation',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const defaults = { tags: [], name: 'unnamed' }
const item = Object.create(defaults)

item.tags.push('new')
item.name = 'first'

const other = Object.create(defaults)
console.log(other.tags, other.name)`,
    options: ['[] unnamed', "[ 'new' ] unnamed", "[ 'new' ] first", '[] first'],
    correctOption: 1,
    answerInFull: `[ 'new' ] unnamed

Two lines that look alike do completely different things.

item.tags.push('new') is a read followed by a mutation. The read walks the chain, finds the one array on defaults, and pushes into it. There is only ever one array, so every object inheriting from defaults sees the new tag, including ones created afterwards.

item.name = 'first' is a write. It does not walk, so it creates an own name on item and leaves defaults alone. other never sees it.

The rule to say out loud: mutating an inherited object is shared, assigning is not. It is the same asymmetry as shadowing, and it is why a default of an empty array or object on a shared prototype is a bug waiting for its second caller.`,
    explanation: `[] unnamed is the answer if both lines are read as writes. It is what you get from a class with fields, where tags = [] in the class body creates a new array per instance, and it is the reason class fields behave differently from prototype properties.

[ 'new' ] first reads both lines as mutations of the shared object, which would make a write to any inheriting object visible everywhere. Nothing assigns through the chain.

[] first is the two rules swapped over, and it is worth checking which of the two lines you thought was which. push reaches the prototype and = never does.`,
    hints: ['Which of the two lines writes, and which one reads and then mutates?'],
    tags: ['objects', 'prototype', 'references'],
  },
  {
    id: 'object-create-null',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'You are building a lookup keyed by strings that come from user input. Which statement about using Object.create(null) for it is right?',
    options: [
      'It cannot take new properties, so it is safe to hand to code you do not trust',
      'It has no prototype, so no key can collide with an inherited member, and the cost is that it has no toString or hasOwnProperty either',
      'It refuses keys that match a member of Object.prototype, which is what makes it safe against prototype pollution',
      'It is a Map in all but name, so it accepts any key type rather than only strings',
    ],
    correctOption: 1,
    answerInFull: `Its chain terminates immediately, so there is nothing to inherit and nothing to collide with. A key called toString or constructor is just a key, and prototype pollution has nothing to pollute.

What it costs is every Object.prototype method. No toString, so string coercion throws. No hasOwnProperty, so you need Object.hasOwn or Object.prototype.hasOwnProperty.call. Console output looks unusual, and some libraries assume a normal prototype.

A Map is usually the better answer for a dictionary, because it accepts any key type, has a proper API, keeps insertion order for every key, and has no prototype question at all.

The prototype pollution angle is what makes this a real question rather than trivia. It is the mechanism behind a whole class of vulnerabilities in code that merges untrusted objects into ones it later reads.`,
    explanation: `Nothing here is frozen. A prototypeless object takes new properties like any other, and freezing is what Object.freeze is for.

Refusing keys is the right consequence attached to the wrong mechanism. No key is refused. There is simply nothing for a key to shadow, which is a much better guarantee than a list of names to reject.

The Map comparison is the one to think about rather than dismiss, because a Map really is usually the better answer. It is not the same thing: a prototypeless object still takes string and symbol keys only, and it is still an object to anything reading it with Object.keys or spreading it.`,
    hints: [],
    tags: ['objects', 'prototype', 'performance'],
  },
  {
    id: 'implement-instanceof',
    type: 'coding',
    form: 'choice',
    tier: 'staff',
    prompt:
      'Your myInstanceOf walks the prototype chain of value looking for Constructor.prototype. What else does it need to be correct?',
    options: [
      'A check that value.constructor === Constructor before walking, to rule out unrelated chains early',
      'A check that Constructor is a class rather than an ordinary function, since only a class can sit on the right of instanceof',
      'A guard returning false for a primitive, which has no chain of its own to walk',
      'A fallback to comparing Constructor.name, for values that came from another realm',
    ],
    correctOption: 2,
    answerInFull: `  function myInstanceOf(value, Constructor) {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
      return false
    }

    const target = Constructor.prototype
    let current = Object.getPrototypeOf(value)

    while (current !== null) {
      if (current === target) return true
      current = Object.getPrototypeOf(current)
    }

    return false
  }

instanceof is exactly a walk up the prototype chain looking for the constructor's prototype object. That is why it can be fooled by reassigning Constructor.prototype, and why it fails across realms such as an iframe, where Array.prototype is a different object entirely.

The guard at the top matters because primitives are the case the walk cannot handle. Object.getPrototypeOf(null) throws, and a number does have Number.prototype conceptually, but 1 instanceof Number is false: instanceof is about objects, and a primitive is not one.`,
    explanation: `Comparing value.constructor is how most people describe instanceof and it is not what it does. constructor is an ordinary inherited property that anything can reassign, and it says nothing about the chain, so the check would pass on an object that merely borrowed one.

Any callable can sit on the right of instanceof, class or not. That is what made the constructor function pattern work before classes existed.

Comparing names is the workaround people reach for after being bitten by the realm problem, and it trades a wrong answer for an unfalsifiable one. The real answers are a branded check such as Array.isArray, or Symbol.hasInstance when you own the constructor.`,
    hints: ['What is instanceof actually comparing?', 'What should it do for a primitive?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'class-methods-live-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Where does a method declared in a class body actually live?',
    options: [
      'On each instance, copied in by the constructor',
      'On the constructor function itself',
      'On the constructor prototype, shared by every instance',
      'In a private table the engine keeps separately',
    ],
    correctOption: 2,
    answerInFull: `On Constructor.prototype, shared by every instance.

class is syntax over prototypes. Methods go on the prototype object and are found by lookup through the chain, which is why a thousand instances cost one copy of each method rather than a thousand.

Two exceptions are worth naming. Fields declared in the class body, including a method written as an arrow function assigned to a field, are per instance: they are created in the constructor and cost memory per object. And static methods go on the constructor function itself.

The practical consequence of the arrow field version is that it is the only way to get a method that keeps its receiver when it is pulled off the instance, and it costs one function object per instance to do it.`,
    explanation: `Copied into each instance is how classes work in several other languages, and it is the belief that makes the delete question in this topic surprising.

On the constructor function is where static members live, so it is half right about a different half of the class.

The private table option is the answer for private methods and fields declared with #, which really are kept outside the ordinary property machinery. Ordinary methods are plain properties on an ordinary object, and you can list them with Object.getOwnPropertyNames(Constructor.prototype).`,
    hints: [],
    tags: ['prototypes', 'classes'],
  },
  {
    id: 'instanceof-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does `a instanceof B` actually test?',
    options: [
      'Whether a was created by calling B',
      'Whether a and B have the same constructor property',
      'Whether a has every property that B.prototype has',
      'Whether B.prototype appears anywhere in the prototype chain of a',
    ],
    correctOption: 3,
    answerInFull: `Whether the object B.prototype points at appears anywhere in a's prototype chain.

Nothing records which constructor made a value. That has three consequences worth naming.

Reassigning B.prototype changes the answer retroactively, for objects that already exist, because the check reads the property at the moment it runs.

It fails across realms. An array from an iframe has that document's Array.prototype in its chain, so it is not instanceof the parent document's Array. Array.isArray exists because it asks a different question, and typed checks such as Buffer.isBuffer exist for the same reason.

And it can be answered deliberately: a constructor that defines Symbol.hasInstance decides for itself what instanceof means, which is how a library can make a plain object claim to be one of its types.`,
    explanation: `"Created by calling B" is what the name suggests and what it means most of the time. The gap between those two shows up exactly when someone has been rewiring prototypes, which is when you most need the answer to be precise.

The constructor property is the version people describe when asked to implement it. It is an ordinary inherited property, reassignable by anyone, and instanceof never reads it.

Checking for the properties B.prototype declares is structural typing, which is what TypeScript does at compile time and what nothing does at runtime. instanceof compares one object identity and nothing else.`,
    hints: [],
    tags: ['prototypes'],
  },
  {
    id: 'what-new-does-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does new Point(3) do?',
    options: [
      'Copies every property and method from Point.prototype onto a fresh object, then runs Point with this bound to it',
      'Creates a fresh object linked to Point.prototype, runs Point with this bound to it, and returns that object unless the body returns an object of its own',
      'Runs Point and returns whatever it returns, with new only marking the function as a constructor for instanceof',
      'Creates a fresh object linked to Point itself, so the instance inherits everything declared on the constructor function',
    ],
    correctOption: 1,
    answerInFull: `Four steps, and the third is the one that matters here.

1. Create a new empty object.
2. Link it to Point.prototype, so the instance inherits whatever is on that object.
3. Run Point with this bound to the new object, so the body's assignments become own properties of it.
4. Return the new object, unless the body explicitly returns an object of its own, in which case that one wins.

The split those steps produce is the shape of every instance: the data the constructor assigned is own, and the methods are inherited by lookup. That is why one function object serves a thousand instances, and why a method added to the prototype afterwards is available to instances that already exist.

Step four is the detail people forget. Returning a primitive from a constructor is ignored; returning an object replaces the instance, which is how a constructor can hand back a cached object or a proxy.`,
    explanation: `The copying answer is how classes work in several other languages, and it predicts that a method added to a prototype later would not reach existing objects. It does reach them, because the instance holds a link rather than a copy.

"new only marks it for instanceof" removes the mechanism entirely. Nothing about the function is marked; new changes what happens at the call, and instanceof reads the chain that step two built.

Linking to Point rather than Point.prototype is the mistake the naming invites. Point.prototype is not Point's own prototype, it is the object Point hands out to its instances, and the instance links to that.`,
    hints: [],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'array-methods-are-inherited-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'const list = [1, 2]. Where does the map that list.map(...) calls actually live?',
    options: [
      'On list, put there when the array literal was evaluated',
      'On Array.prototype, which is the next link in the chain from list',
      'On the Array constructor, which every array is given a reference to',
      'Nowhere reachable. Array methods are built into the engine rather than being properties of any object',
    ],
    correctOption: 1,
    answerInFull: `On Array.prototype. list has no map of its own: Object.hasOwn(list, 'map') is false, and the lookup follows the link to Array.prototype and finds it there.

The chain for a plain array is short and worth being able to recite: the array, then Array.prototype, then Object.prototype, then null. That is where toString and hasOwnProperty come from too.

The consequence is that arrays are ordinary objects following the ordinary rules, and Array.prototype is one shared object that every array in the realm is looking at. Adding to it or changing it is visible to every array everywhere, including ones created before the change, which is the mechanism behind monkey patching and the reason not to.

length is the exception on the other side: it is an own property of each array, which is why hasOwn reports it true.`,
    explanation: `A method on the array itself would mean a copy of every array method per array, which is the cost the prototype exists to avoid.

The Array constructor holds the static members, Array.from and Array.isArray, which is why you call those on Array and never on an array. The instance methods are on Array.prototype, the object the constructor hands out.

"Built into the engine" is true of the implementation and not of the visibility. Array.prototype.map is a property you can read, pass around, call with call, and unfortunately also replace.`,
    hints: ['What does Object.hasOwn(list, "map") return?'],
    tags: ['objects', 'prototype', 'arrays'],
  },
  {
    id: 'in-versus-hasown-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const defaults = { theme: 'dark' }
const settings = Object.create(defaults)
settings.fontSize = 14

console.log('theme' in settings, Object.hasOwn(settings, 'theme'), Object.keys(settings))`,
    options: [
      "true false [ 'fontSize' ]",
      "true true [ 'theme', 'fontSize' ]",
      "false false [ 'fontSize' ]",
      "true false [ 'theme', 'fontSize' ]",
    ],
    correctOption: 0,
    answerInFull: `true false [ 'fontSize' ]

Three ways of asking about a property, and they are asking three different questions.

in asks whether a read would find it anywhere, so it walks the chain and answers true for theme.

Object.hasOwn asks only about the object itself, so it answers false for theme and would answer true for fontSize.

Object.keys lists own enumerable string keys, so it reports fontSize and nothing inherited.

Choosing between them is the practical part. A defaults object reached through the prototype is exactly the case where the three disagree, and picking the wrong one gives a config merge that treats every default as something the user set.

Object.hasOwn is the modern spelling of settings.hasOwnProperty('theme'), and it is safer, because it works on an object with no prototype and on an object that arrived from JSON carrying its own hasOwnProperty key.`,
    explanation: `true true is hasOwn read as "does this object have it", which is what its name almost says. The own in the name is the whole meaning: it refuses to walk.

false false is in read as own-only. Then in and hasOwn would be the same function, and the reason for...in surprises people would not exist.

Object.keys listing theme is the mirror mistake, treating keys as a walk of the chain. for...in is the one that walks; Object.keys never does.`,
    hints: ['Which of the three follow the prototype link?'],
    tags: ['objects', 'prototype'],
  },
  {
    id: 'method-versus-arrow-field-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `class Button {
  handle() {}
  onClick = () => {}
}

const a = new Button()
const b = new Button()

console.log(a.handle === b.handle, a.onClick === b.onClick)`,
    options: ['true true', 'false false', 'false true', 'true false'],
    correctOption: 3,
    answerInFull: `true false

handle is a method, so it lives on Button.prototype. There is one function object and both instances find it by lookup, so comparing them gives true.

onClick is a class field. Fields are created per instance, in the constructor, so each Button gets its own arrow function and the two are different objects.

Both halves have a practical consequence. The method is shared, which is why a thousand buttons cost one handle, and it loses its receiver when it is pulled off the instance. The field is per instance, which costs a function object each, and it captures this where it was created, so it survives being passed to addEventListener.

The identity difference is the one that causes bugs. removeEventListener matches by identity, and a React dependency array compares by identity, so a per instance function that is recreated is a value that never settles.`,
    explanation: `true twice is the belief that fields go on the prototype like methods. If they did, every instance would share one arrow and the pattern would not fix the receiver, since there would be nothing per instance to capture.

false twice treats methods as copied into instances. The prototype exists precisely so they are not, which is also why deleting a method from a prototype changes what existing instances do.

false true has the two the wrong way round, and it is the reading to check yourself against: the one written like a method is shared, and the one written like an assignment happens once per object, at construction.`,
    hints: ['Which of the two is on the prototype, and which is created per instance?'],
    tags: ['prototypes', 'classes'],
  },
]
