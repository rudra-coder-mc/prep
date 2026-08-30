import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-extends-couples-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Which of these is NOT one of the ways a subclass is coupled to its base more tightly than an ordinary caller is?',
    options: [
      'Every method becomes part of the contract, because any of them can be overridden',
      'The constructor signature, because super() has to match it',
      "The base class's private fields, which the subclass reads directly and so depends on",
      'The single prototype chain, which leaves room for only one parent',
    ],
    correctOption: 2,
    answerInFull: `Private fields are the one thing a subclass is not coupled to, because it cannot reach them. A #field declared in the base is lexically scoped to the base's class body; the subclass cannot name it, so the base can rename or remove it freely. That is the strongest argument for using private fields in a base class: they shrink the contract a subclass depends on.

The other three are real. Every public method is overridable, so a base cannot change which of its methods call which others without changing subclass behaviour, which is the fragile base class problem. super() has to match the base constructor. And there is one chain, so a class has one parent.`,
    explanation: `The method coupling is the one that bites most, and it is invisible until a base is refactored.

The constructor coupling is why adding a parameter to a base class is a change to every subclass.

The single chain is why multiple inheritance needs mixins.`,
    hints: ['Which of the four can a subclass not even name?'],
    tags: ['classes', 'inheritance', 'design'],
  },
  {
    id: 'mixin-chain-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const A = (Base) =>
  class extends Base {
    who() {
      return 'A>' + super.who()
    }
  }
const B = (Base) =>
  class extends Base {
    who() {
      return 'B>' + super.who()
    }
  }
class Root {
  who() {
    return 'root'
  }
}

class M extends A(B(Root)) {}
console.log(new M().who())`,
    options: ['A>B>root', 'B>A>root', 'A>root', 'root'],
    correctOption: 0,
    answerInFull: `A>B>root

B(Root) is a class whose prototype inherits from Root.prototype. A(that) is a class whose prototype inherits from that. M extends the result. So the chain from an M instance is M.prototype, then A's class, then B's class, then Root.prototype. The lookup for who finds A's version first. A's super.who resolves from A's home object to the next prototype, which is B's, and B's super.who reaches Root.

The mixin applied last is nearest the instance, and that is the order the prefixes come out in.`,
    explanation: `B>A>root reads the nesting inside out, as if the innermost application were nearest the instance. The innermost is applied first and is furthest away.

A>root would need A's super to skip B, which it cannot: super resolves to the immediate next prototype.

root alone is what you would get if mixin methods did not override. They sit on prototypes nearer the instance than Root.prototype, so they win.`,
    hints: ["Which class is M.prototype's immediate prototype?"],
    tags: ['classes', 'mixins'],
  },
  {
    id: 'fragile-base-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'staff',
    prompt:
      'Version 2 of the base class changed addAll to call add for each item. Put the lines this prints, with version 2, in the order they print.',
    code: `class Collection {
  items = []
  add(x) {
    this.items.push(x)
  }
  addAll(xs) {
    // version 1 was: this.items.push(...xs)
    for (const x of xs) this.add(x)
  }
}

class Counted extends Collection {
  count = 0
  add(x) {
    this.count += 1
    console.log('add', x, this.count)
    super.add(x)
  }
  addAll(xs) {
    this.count += xs.length
    console.log('addAll', this.count)
    super.addAll(xs)
  }
}

const c = new Counted()
c.addAll(['a', 'b'])
console.log('items', c.items.length, 'count', c.count)`,
    items: [
      'addAll 2',
      'add a 3',
      'add b 4',
      'items 2 count 4',
      'items 2 count 2',
      'add a 1',
      'add b 2',
      'addAll 0',
    ],
    correctOrder: [0, 1, 2, 3],
    answerInFull: `addAll 2
add a 3
add b 4
items 2 count 4

Counted.addAll adds 2 to count and prints it, then calls super.addAll. Under version 1 that pushed directly and the count stayed correct. Under version 2, the base addAll calls this.add for each item, and this is a Counted, so the override runs and counts each item again: 3, then 4. Two items, counted four times.

Counted did nothing wrong and did not change. The base changed which of its methods call which others, and every subclass that overrode one of them changed behaviour. That is the fragile base class problem, and it is the reason every public method of a base is part of its contract.`,
    explanation: `items 2 count 2 is the version 1 output, where the base pushed directly and the override was never reached through addAll.

add a 1 and add b 2 would mean addAll's own increment did not happen before the adds. It happens first, so the adds start from 2.

addAll 0 has the print before the increment. The increment is on the line above it.`,
    hints: [
      'When the base addAll calls this.add, which add does it find?',
      'Has Counted.addAll already added to count by then?',
    ],
    tags: ['classes', 'inheritance', 'fragile-base'],
  },
  {
    id: 'is-a-misuse-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'senior',
    prompt:
      'To reuse its methods, someone wrote class Stack extends Array with push, pop and peek. Now a function that accepts any array sorts a Stack it was given, and a serialiser that checks Array.isArray sends a Stack as a plain list. What is the root cause?',
    options: [
      'Array subclasses lose their prototype when passed to other functions. Use Object.setPrototypeOf on the way in',
      'A Stack is not a kind of array: it is a type with a narrower interface that happens to want an array inside it. Inheriting made every array operation available and every array check true. Hold an array in a private field and expose only push, pop and peek',
      'The subclass forgot to set Symbol.species to Stack, so array methods return plain arrays',
      'sort and Array.isArray should have been overridden in Stack to refuse. Add overrides that throw',
    ],
    correctOption: 1,
    answerInFull: `extends was used for code reuse when the relationship is not "is a". A stack deliberately offers fewer operations than an array; that is what makes it a stack. By inheriting, it gained splice, sort, index access and a true Array.isArray, so any code that accepts an array accepts a Stack and is entitled to treat it as one. Nothing is lost in passing; the object genuinely is an array.

The fix is composition: class Stack { #items = []; push(x) { this.#items.push(x) } pop() { return this.#items.pop() } peek() { return this.#items.at(-1) } }. Three methods, nothing else reachable, no array checks pass, and the array inside can be swapped for a linked list without anyone noticing.

The test for whether to extend is whether callers of the base should be able to receive the subclass and be right. Here they cannot be.`,
    explanation: `The prototype is not lost. The Stack is passed as itself, and itself is an array with extras, which is exactly the problem.

Symbol.species controls what map and filter return. It does nothing about sort, which is in place, or about isArray.

Overriding every unwanted array method to throw is a list that grows with every engine release, and Array.isArray is not a method on the instance and cannot be overridden. The shape is wrong, not the method list.`,
    hints: ['Should a function that accepts arrays be right to accept a Stack?'],
    tags: ['classes', 'inheritance', 'design'],
  },
  {
    id: 'injected-dependency-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write a Notifier with a send(user, message) method that delivers through a channel, such that a unit test can verify what was sent without any network and without a mocking library. Which version does that?',
    options: [
      'class Notifier {\n  #channel\n  constructor(channel) {\n    this.#channel = channel\n  }\n  send(user, message) {\n    return this.#channel.deliver(user.email, message)\n  }\n}',
      'class Notifier extends EmailChannel {\n  send(user, message) {\n    return this.deliver(user.email, message)\n  }\n}',
      'class Notifier {\n  #channel = new EmailChannel()\n  send(user, message) {\n    return this.#channel.deliver(user.email, message)\n  }\n}',
      'class Notifier {\n  send(user, message) {\n    return EmailChannel.deliver(user.email, message)\n  }\n}',
    ],
    correctOption: 0,
    answerInFull: `class Notifier {
  #channel
  constructor(channel) {
    this.#channel = channel
  }
  send(user, message) {
    return this.#channel.deliver(user.email, message)
  }
}

The channel arrives through the constructor, so the test passes { deliver: (to, msg) => sent.push([to, msg]) } and asserts on the array. Notifier depends on an interface with one method, not on EmailChannel, and the same class sends through SMS or a queue by passing something else. That is composition with the dependency injected.`,
    explanation: `Extending EmailChannel welds the notifier to one delivery mechanism, and testing it means either sending real email or subclassing again to override deliver, which is the coupling the question is about.

Constructing the channel inside the field initialiser is composition without injection. The held object is still swappable in principle and not in practice, because nothing outside can choose it.

A static call is a hard-coded global. There is no seam at all.`,
    hints: ['Where does the test get to choose what deliver does?'],
    tags: ['classes', 'composition', 'testing'],
  },
  {
    id: 'mixin-instanceof-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const Tagged = (Base) =>
  class extends Base {
    tag() {
      return 'tagged'
    }
  }

class Base {}
class X extends Tagged(Base) {}
class Y extends Tagged(Base) {}

const x = new X()
console.log(
  x instanceof Tagged,
  x instanceof Base,
  Object.getPrototypeOf(X) === Object.getPrototypeOf(Y),
  typeof x.tag,
)`,
    options: [
      'false true false function',
      'true true true function',
      'TypeError',
      'false true true function',
    ],
    correctOption: 0,
    answerInFull: `false true false function

Tagged is an arrow function, not a class, and instanceof needs a constructor with a prototype property on its right-hand side. An arrow function has no prototype, so the check is simply false rather than an error. x is an instance of Base because the mixin's class extends it. The two calls Tagged(Base) each created a fresh anonymous class, so X and Y have different immediate parents even though they were made the same way. And tag is an ordinary method inherited from the mixin's prototype.

That is the mixin limitation: there is no single class to check against. A brand check with a symbol or private field inside the mixin is the replacement.`,
    explanation: `true for instanceof Tagged would need Tagged to be the class on the chain. It is a factory for classes, and each call makes a new one.

A TypeError from instanceof happens when the right side is not callable. An arrow function is callable; it just has no prototype, which makes the result false, not an error.

Shared parent would need Tagged to cache its result. It does not, so every application is distinct.`,
    hints: ['What does Tagged(Base) return, and is it the same thing twice?'],
    tags: ['classes', 'mixins', 'instanceof'],
  },
  {
    id: 'extend-or-compose-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A team has class ReportService that extends HttpClient to reuse its get and post, and the report logic lives in methods that call this.get. Tests hit a real server, and a second service has copied the same pattern. What should change, and why?',
    options: [
      'Nothing. Reusing HttpClient through extends is what inheritance is for, and the tests should use a local server',
      'Make ReportService hold an HttpClient passed into its constructor and call this.#http.get. Tests pass a fake with a get method, the service stops exposing post and every other client method, and the second service composes the same client instead of copying',
      'Move the report logic into HttpClient as static methods so both services can call them without inheritance',
      'Keep extends but override get in the tests with a subclass that returns canned data',
    ],
    correctOption: 1,
    answerInFull: `A report service is not a kind of HTTP client; it uses one. Inheriting makes every HttpClient method part of the service's public surface, couples the service to the client's constructor, and means a test cannot replace the network without subclassing. Those are the three costs of extends, all paid at once, in exchange for saving one constructor parameter.

Composition fixes each. The client is injected, so a test passes { get: async () => fixture } and asserts on the report. The service exposes only its own methods. And the second service takes the same client as a parameter rather than copying a pattern, so there is one client and two consumers of it.

The general question was "will this class need to change independently of that one?", and a report service changes every time the report changes while the HTTP client does not. Different rates of change means compose.`,
    explanation: `A local server makes the tests slower and still tests the client rather than the report logic. The shape is the problem, not the test infrastructure.

Static methods on the client put report logic inside the HTTP layer, which is the coupling in the other direction.

A test subclass that overrides get works once and then means every test needs a subclass per scenario. It is the fragile base class problem used as a test strategy.`,
    hints: ['Is a report service a kind of HTTP client, or does it use one?'],
    tags: ['classes', 'composition', 'design'],
  },
  {
    id: 'composition-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Explain "prefer composition over inheritance" precisely, including when you would still use extends.',
    answerInFull: `Start with what the advice is about: coupling, not syntax. A subclass depends on its base in ways an ordinary caller does not. Every public method is overridable, so all of them become the contract, and a base that changes which methods call which others silently changes every subclass that overrode one. That is the fragile base class problem. The constructor's signature is coupled through super(). There is one prototype chain, so one parent. And a subclass field can shadow a base member by accident.

Then what composition gives. The class holds an object and delegates to it, so it depends on an interface it chose, usually one or two methods. The held object can be swapped, which is what makes the class testable with a plain object and configurable without subclassing. Dependency injection is composition with the dependency arriving from outside. The price is a constructor parameter and a forwarding method where inheritance would have given both for free.

Then when extends is still right, because "never" is the wrong answer. When the relationship is genuinely is-a, the base is stable, and overrides extend rather than replace: custom errors, a thin layer on a framework base, a type that specialises another. Those are cheap and clear, and composing them would be ceremony.

Then the decision rule: will this class need to change independently of that one? Different rates of change, compose. Same shape forever, extend. A small capability wanted by unrelated classes, a mixin, with its application order written down.

And the smell that says you got it wrong: a subclass overriding a method only to call super and discard the result, or a base method that exists purely to be overridden.`,
    explanation: `What marks the answer is the fragile base class problem stated concretely, and the "when you would still extend" section given without being prompted. A candidate who says composition is always better has a slogan; one who names the Error subclass as the counterexample has made the trade-off.`,
    hints: [],
    tags: ['classes', 'composition', 'inheritance'],
  },
  {
    id: 'forwarding-everything-choice',
    type: 'concept',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A class holds a Map in a private field and exposes get, set, has, delete, clear, size, keys, values, entries and forEach, each forwarding directly. What does this design tell you?',
    options: [
      'It is well encapsulated: the Map is private and nothing outside can reach it',
      'It is inheritance with more typing. Exposing the whole interface of the held object means callers depend on all of it, which is the coupling composition was meant to avoid. Either expose only what callers need, or extend Map honestly',
      'It should use Object.assign to copy the Map methods onto the prototype, which avoids writing the forwarders',
      'It needs a Proxy to forward the remaining Map methods automatically',
    ],
    correctOption: 1,
    answerInFull: `Composition earns its keep when the class chooses a smaller interface than the thing it holds. Forwarding every method reproduces the full Map interface by hand, so callers depend on all of it, the held object can no longer be swapped for anything that is not Map-shaped, and the private field is private in name only. That is the coupling of inheritance paid in forwarding methods.

Two honest shapes. If callers really need all of Map, class Registry extends Map says so in one line and gives iteration and instanceof for free. If they need three operations, expose three and stop. The ten-method wrapper is the sign that the question "what do callers need?" was never asked.`,
    explanation: `Encapsulation is about the interface, not the keyword. Ten forwarders expose exactly what the field was hiding.

Copying Map methods onto a prototype does not work: they read internal slots and throw when this is not a real Map.

A Proxy to forward the rest automates the mistake. It also breaks private fields, since this inside the methods would be the proxy.`,
    hints: ['What interface do callers of this class depend on, and is it smaller than Map?'],
    tags: ['classes', 'composition', 'design'],
  },
  {
    id: 'override-and-discard-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `class Parser {
  parse(text) {
    return text.trim().split(',')
  }
}

class StrictParser extends Parser {
  parse(text) {
    const parts = super.parse(text)
    if (parts.some((p) => p === '')) throw new Error('empty field')
    return parts
  }
}

class LoggingParser extends Parser {
  parse(text) {
    console.log('parsing')
    super.parse(text)
  }
}

console.log(new StrictParser().parse(' a,b ').length)
console.log(new LoggingParser().parse('a,b'))`,
    options: [
      '2\nparsing\nundefined',
      "2\nparsing\n[ 'a', 'b' ]",
      'parsing\n2\nundefined',
      'Error: empty field',
    ],
    correctOption: 0,
    answerInFull: `2
parsing
undefined

StrictParser extends the base behaviour: it calls super.parse, checks the result and returns it, so the caller gets the two parts. LoggingParser calls super.parse and discards the result, because there is no return, so the caller gets undefined. The log line prints, and then the method returns nothing.

An override replaces the method. Whatever the base returned reaches the caller only if the override passes it on, and forgetting to is the most common way an extends chain silently breaks.`,
    explanation: `Returning the array from LoggingParser would need the missing return statement. super.parse(text) as a statement computes the value and drops it.

parsing before 2 has the calls in the wrong order. The StrictParser line runs first.

Nothing is empty in ' a,b '. trim removes the outer spaces and the split gives two non-empty parts.`,
    hints: ['Does LoggingParser.parse have a return statement?'],
    tags: ['classes', 'inheritance', 'super'],
  },
]
