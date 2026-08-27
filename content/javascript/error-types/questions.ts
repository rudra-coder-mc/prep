import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'error-shape-concept',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt: 'Where do name, message and stack live on a newly constructed Error?',
    options: [
      'All three are own enumerable properties, which is why an error can be copied with spread',
      'message is an own non-enumerable property, name comes from the prototype, and stack is added by the engine when the Error is constructed',
      'All three come from Error.prototype, and the constructor only stores the message internally',
      'name and message are own properties and stack is a getter that walks the current call stack when you read it',
    ],
    correctOption: 1,
    answerInFull: `Three properties in three different places, and each placement explains something.

message is an own property, set by the constructor from the argument, and non-enumerable. name is not an own property at all: it lives on the prototype, which is how a TypeError knows it is called TypeError without anything assigning the string. stack is put there by the engine, and it is not in the specification, so its format differs between engines.

The moment stack is captured is worth being exact about: it is when the Error is constructed, not when it is thrown. An error object built once and thrown later points at where it was built.

    const error = new Error('boom')
    setTimeout(() => { throw error }, 1000)

The stack in that error names the line that made it, which is usually what you wanted and occasionally very confusing.

The non-enumerable part has a consequence people meet before they meet the rule. JSON.stringify of an error is an empty object, and spreading one into a new object gives an empty object too, because both only see enumerable own properties.`,
    explanation: `Own and enumerable would make spreading work, and it is the assumption behind every logger that sends an empty object to its monitoring service.

Putting message on the prototype would mean every error shared one message. The prototype does carry a message, an empty string, as the default when the constructor is called with no argument.

A stack computed on read would be more useful and is not what happens. By the time you read it in a catch block, the frames it describes are gone.`,
    hints: [],
    tags: ['error'],
  },
  {
    id: 'which-type-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const attempts = [
  () => applyDefaults(),
  () => null.length,
  () => new Array(-1),
  () => decodeURIComponent('%'),
]

for (const attempt of attempts) {
  try {
    attempt()
  } catch (error) {
    console.log(error.name)
  }
}`,
    items: ['TypeError', 'SyntaxError', 'ReferenceError', 'RangeError', 'EvalError', 'URIError'],
    correctOrder: [2, 0, 3, 5],
    answerInFull: `ReferenceError, TypeError, RangeError, URIError.

Each one has a rule behind it rather than a list to memorise.

Nothing in scope is called applyDefaults, so resolving the name fails: ReferenceError. The same type covers reading a let or const before its declaration has run.

null.length asks a value for something the value cannot do. Wrong kind of value is always a TypeError, and it is the error you will see more than all the others together.

new Array(-1) passes a number where a number belongs, and the number is not a valid length. Right kind, wrong value, is a RangeError. So is toFixed with 20000 digits, and so is a blown call stack.

decodeURIComponent('%') is the narrow one. URIError comes from the URI encoding functions and from nothing else.

The two that do not appear are worth knowing for the same reason. SyntaxError is thrown by JSON.parse, new Function and eval at run time, and by the engine at parse time for your own file, which is before any of that file's code can catch it. EvalError is thrown by nothing at all any more, and survives so that old code keeps running.`,
    explanation: `SyntaxError is the tempting fourth for decodeURIComponent, because a stray percent sign does look like malformed syntax. The URI functions have their own type, and it is the only place it comes from.

EvalError is in the pool because people expect the seven built-ins to all be reachable. Nothing throws it; it is kept for compatibility alone.

Swapping the first two is the common mistake. A name that does not resolve is a ReferenceError; a value that cannot do what was asked is a TypeError. Reading a property of null is the second, not the first, because null resolved perfectly well.`,
    hints: [
      'Which of these failures is about a name, and which is about a value?',
      'Two of the six are never produced by these four lines.',
    ],
    tags: ['error'],
  },
  {
    id: 'tdz-referenceerror-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This throws "ReferenceError: Cannot access \'limit\' before initialization", but limit is declared right there. What is the engine telling you?',
    code: `function paginate(items) {
  const page = items.slice(0, limit)
  const limit = 20
  return page
}

paginate([1, 2, 3])`,
    options: [
      'The const declaration is hoisted with the value undefined, and slice rejects undefined as a length',
      'const declarations are not hoisted at all, so the name genuinely does not exist on the line above',
      'The binding is hoisted to the top of the block but stays uninitialised until its declaration runs, and reading it in that window is a ReferenceError rather than undefined',
      'Function bodies are evaluated bottom to top for const, so the declaration runs after the read',
    ],
    correctOption: 2,
    answerInFull: `The temporal dead zone, reported as a ReferenceError.

The binding for limit is created when the block is entered, so the name exists from the first line. What it does not have is a value, and the language chose to make reading it in that window throw rather than give you undefined.

    console.log(typeof limit) // also throws, for the same binding
    const limit = 20

That is the difference from var, which is hoisted and initialised to undefined, so the same code would have given a silent NaN or an empty slice instead of an error. Throwing is the better behaviour: a use before the declaration is nearly always a mistake, and this way it fails at the mistake.

The reason it is a ReferenceError rather than a TypeError is consistent with the rest of the type: ReferenceError is about resolving a name, and this name cannot yet be resolved to a value. The message is the tell. "is not defined" means nothing declares it anywhere; "Cannot access before initialization" means it is declared below.`,
    explanation: `Hoisting to undefined is exactly what var does, and expecting it here is the most common version of this misunderstanding. The binding is hoisted; the initialisation is not.

Saying const is not hoisted sounds right and produces the wrong error message. If nothing declared it, the message would be "limit is not defined", which is a different sentence the engine is careful to distinguish.

Nothing is evaluated bottom to top. The lines run in order, and the read simply happens before the declaration does.`,
    hints: [
      'What is the difference between the two ReferenceError messages the engine can produce?',
    ],
    tags: ['error', 'scope'],
  },
  {
    id: 'error-cause-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does the second argument to the Error constructor do?',
    options: [
      'It sets properties on the error, so anything in that object becomes a field you can read back',
      'It replaces the error stack with the stack of the value passed in',
      'It attaches one property, cause, holding the error being wrapped, so a rethrow can add context without losing the original',
      'It is a Node extension, and browsers ignore it',
    ],
    correctOption: 2,
    answerInFull: `It carries one property, cause, and that is the whole feature.

    try {
      await driver.save(row)
    } catch (error) {
      throw new Error('could not save the order', { cause: error })
    }

The caller gets a message in the vocabulary of your domain, and the driver's type, message and stack stay reachable underneath as error.cause. Consoles and error reporters print the chain, so the failure reads as the domain problem first and the real cause below it.

Before this existed, wrapping meant choosing: keep the original and hand the caller a message about connection pools, or replace it and lose the stack that says where. Most codebases chose badly in one direction or the other.

Two details worth having. cause is an own non-enumerable property, like message, so it disappears from JSON.stringify along with everything else. And it accepts any value, not only an Error, which is how a rejected value that was never an error still gets carried.

The rule for using it is to wrap when you can say something the original could not, and to rethrow unchanged when you cannot. A wrapper that restates the same thing in worse words is just an extra frame.`,
    explanation: `An arbitrary property bag would be convenient and is not what the specification defines. Only cause is read from that object; anything else in it is ignored.

Replacing the stack would defeat the purpose. Both stacks survive, which is what makes the chain readable.

It is a language feature from ES2022, not a Node one, and it is in every current engine.`,
    hints: [],
    tags: ['error'],
  },
  {
    id: 'message-matching-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This worked for two years and started returning nothing after a Node upgrade, on missing files and on permission failures alike. What is wrong with the guard?',
    code: `try {
  return await readFile(path, 'utf8')
} catch (error) {
  if (error.message === 'ENOENT: no such file or directory') return null
  throw error
}`,
    options: [
      'The comparison should be on error.message.includes so it survives the path being appended to the message',
      'The message is prose the runtime is free to reword, and the check should use error.code, which is the documented contract',
      'readFile rejects rather than throwing, so error is a rejection object with no message',
      'The error needs to be awaited before its message is populated',
    ],
    correctOption: 1,
    answerInFull: `The guard matches on a message, and a message is not an interface.

Node's system errors carry the useful part as a separate field. The code is a stable, documented string; the message is a sentence assembled for a human, and it has included the path, the syscall and the flags in different versions.

    if (error.code === 'ENOENT') return null
    throw error

That is the check, and it keeps working across versions, locales and platforms.

The reason the symptom looks worse than a missing file is the second half of the code. Because the comparison never matches, the rethrow runs for every failure, so a permission error and a missing file now behave the same way. The bug is not that the recovery stopped; it is that the discrimination stopped, and the two cases collapsed into one.

The general rule is to check something the author of the error promised you: a code, a name, or a type. Prose is written to be read, and it changes.`,
    explanation: `Switching to includes makes the same mistake more loosely. It survives one kind of rewording and fails on the next, and it starts matching messages that happen to contain the substring.

readFile from fs/promises rejects, and awaiting it inside a try turns the rejection into a throw the catch sees, with an ordinary Error in it. That part is working.

There is nothing to await on the error. It is a fully built object by the time the catch runs.`,
    hints: ['What did the runtime actually promise would not change?'],
    tags: ['error', 'debugging'],
  },
  {
    id: 'stack-overflow-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function depth(n) {
  return depth(n + 1) + 1
}

try {
  depth(0)
} catch (error) {
  console.log(error.name, error instanceof RangeError)
}`,
    options: [
      'Error false, because the engine throws a bare Error for a stack overflow',
      'RangeError true, because exceeding the call stack is a value out of range, and it is an ordinary catchable exception',
      'Nothing: a stack overflow terminates the process and no catch block runs',
      'InternalError true, since running out of stack is engine state rather than a language condition',
    ],
    correctOption: 1,
    answerInFull: `RangeError true. Running out of call stack is reported as a RangeError, with the message "Maximum call stack size exceeded", and it is caught like anything else.

The classification is consistent rather than arbitrary. RangeError means the value is the right kind and outside what the operation allows, and the depth of the stack is exactly that: a number with a limit. A negative array length and toFixed with 20000 digits are the same category.

    try {
      depth(0)
    } catch (error) {
      if (error instanceof RangeError) console.log('too deep')
    }

Being able to catch it is not the same as it being worth catching. A blown stack almost always means a missing base case, and recovering from it leaves you running in a program whose recursion is broken. The exception is code that recurses over data of unknown depth, where converting to an explicit stack is the real fix rather than a catch.

Worth knowing that the limit is not specified. It depends on the engine, the platform and how much each frame holds, so the depth this reaches varies between runs of the same program.`,
    explanation: `A bare Error is what several other languages report for this, which makes it a reasonable guess and the wrong one here.

InternalError is a real name and belongs to Firefox, which uses it for some engine limits. Naming it is a good sign of having read a Firefox stack trace, and it is not what any engine throws for this.

Believing it is uncatchable is the most interesting wrong answer, because it is true of a stack overflow in most native languages. In JavaScript the engine unwinds normally and your catch runs.`,
    hints: ['Which category does a limit on a number belong to?'],
    tags: ['error', 'call-stack'],
  },
  {
    id: 'aggregate-error-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A download races three mirrors with Promise.any. All three fail, and you want the log to say why each one did. Which catch block gets you that?',
    options: [
      'Read error.errors, an array with one rejection per input in input order, and report each of them',
      'Read error.message, which lists the reasons Promise.any collected',
      'Read error.cause, which Promise.any sets to the first rejection',
      'Switch to Promise.allSettled, because Promise.any discards the reasons it was given',
    ],
    correctOption: 0,
    answerInFull: `Promise.any rejects with an AggregateError, and the reasons are in its errors array.

    try {
      return await Promise.any(mirrors.map(fetchFrom))
    } catch (error) {
      for (const [index, reason] of error.errors.entries()) {
        logger.warn({ mirror: mirrors[index], reason }, 'mirror failed')
      }
      throw error
    }

The array is in input order, not completion order, which is what makes indexing back into mirrors safe. That is the detail that makes the log useful: without it you know three things failed and not which.

AggregateError is the only built-in type that carries a list, and this is the only place in the language that produces one. You can construct it yourself, and it is the right shape for reporting a batch of validation failures.

The other thing to say is what the message gives you: "All promises were rejected", and nothing else. Every specific reason is in errors, so a handler that logs the message alone has thrown away the whole point of the type.`,
    explanation: `The message is a fixed sentence. It says everything failed and nothing about why, which is exactly the information the errors array exists to keep.

cause is not set by Promise.any. It is there for wrapping one error in another, and an aggregate is a different relationship: many peers rather than one underneath.

allSettled is a real alternative if you want every outcome regardless, but reaching for it here means giving up the first-success behaviour that made any the right combinator. The reasons were never discarded.`,
    hints: ['What does Promise.any reject with, and what is on it?'],
    tags: ['error', 'promise', 'coding'],
  },
  {
    id: 'instanceof-across-realms-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A validation library runs user rules inside a Node vm context. A rule fails with what is clearly a TypeError, and error instanceof TypeError is false in the host code. What is going on, and what do you check instead?',
    options: [
      'The subclass in the library forgot to restore its prototype, which breaks instanceof for every error it produces',
      'The error crossed a serialisation boundary and arrived as a plain object, so it is no longer an error at all',
      'instanceof is unreliable for built-ins in general and should be replaced everywhere with typeof checks',
      'Each realm has its own Error constructors, so the object is a real TypeError built from a different one, and its chain does not include this realm; check the name, or a code you set yourself',
    ],
    correctOption: 3,
    answerInFull: `A vm context is a separate realm, with its own copy of every intrinsic. The error is a genuine TypeError made by that realm's constructor, and instanceof asks whether this realm's TypeError.prototype is on its chain. It is not.

    if (error.name === 'TypeError') { ... }
    Object.prototype.toString.call(error) // '[object Error]' from any realm

The same thing happens with an iframe, a web worker, and two copies of a package in one bundle. It is not a bug in any of them; instanceof is an identity check, and identity does not survive a realm boundary.

What to use instead, in order of sturdiness. A field you control, such as a code string on your own error types, which depends on nothing but your own code. Then the name, which is a plain string comparison. Then the toString brand, which recognises an error object from anywhere without saying which type. Recent engines also have Error.isError for that last job.

The design lesson is the useful part. Any error that crosses a boundary should carry its identity as data rather than as a prototype, because data survives the crossing and prototypes do not. That applies to workers, to processes, and to anything that will eventually be serialised.`,
    explanation: `A missing prototype restoration is a real cause of broken instanceof, and it is the custom subclass problem rather than this one. It would break inside the vm as well, and here the check works fine on that side of the boundary.

Serialisation would explain a plain object, and a vm context shares objects directly rather than copying them. The value really is an error; it is only the constructor that differs.

Abandoning instanceof over-corrects. It is the right check within one realm, which is most code, and typeof cannot distinguish error types at all.`,
    hints: ['What does instanceof actually compare?'],
    tags: ['error', 'scenario'],
  },
  {
    id: 'syntax-error-timing-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Which SyntaxErrors can a try/catch written in the same file catch?',
    options: [
      'None: a SyntaxError is thrown by the parser and is never catchable',
      'The ones from JSON.parse, new Function and eval, but not one in the file itself, which is thrown before any of that file runs',
      'All of them, including a missing brace in that file, since the try wraps everything below it',
      'Only the one from eval, which is the only API that reports a SyntaxError at run time',
    ],
    correctOption: 1,
    answerInFull: `The ones thrown at run time, by an API that parses text while the program is running.

    try {
      JSON.parse('{')
    } catch (error) {
      error instanceof SyntaxError // true
    }

JSON.parse, new Function and eval all parse a string given to them, so their failure is an ordinary exception at an ordinary point in the program.

A syntax error in your own file is different in kind. The file is parsed before any of it is evaluated, so there is no moment at which your try block exists to catch anything. The error is reported against the file, and nothing in that file has run.

The consequence worth knowing is for modules that fail to load. A malformed dependency cannot be caught by a try around the import, because the import is hoisted and the whole graph is parsed first. The dynamic import form does reject, which is how a load failure becomes catchable.

This is also why a linter and a build step catch a different class of problem from a test suite: one of them runs the parser, the other only runs code that already parsed.`,
    explanation: `Saying none over-corrects on a true observation. Your own file's syntax error is genuinely uncatchable, and the three parsing APIs are not.

Catching a missing brace in the same file would require the file to be running, and it is not: the parser rejected it before evaluation began.

eval is not special here. new Function and JSON.parse parse at run time in exactly the same way, and JSON.parse is the one you will actually handle.`,
    hints: ['When is your own file parsed, relative to when it runs?'],
    tags: ['error'],
  },
  {
    id: 'wrapping-with-cause-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A repository catches a database driver error and wants callers to see a failure in its own vocabulary, without the driver detail becoming unreachable. Which line does that?',
    options: [
      'error.message = "could not save the order"; throw error — keep the object and improve the wording',
      'throw Object.assign(error, { layer: "repository" }) — tag the original rather than replacing it',
      'throw new Error("could not save the order", { cause: error }) — a new error in your vocabulary, with the driver error reachable underneath',
      'throw new Error("could not save the order") — the driver error was already logged where it happened',
    ],
    correctOption: 2,
    answerInFull: `Wrap it, and pass the original as the cause.

    catch (error) {
      throw new Error('could not save the order', { cause: error })
    }

The caller reads a message about orders, which is what they can act on, and the driver's message, type and stack are still there under error.cause when someone needs them. Node's console and every serious reporter print the chain, so the log shows both without any extra work.

Two rules go with it. Wrap only when you can say something the original could not: turning "connection terminated" into "could not save the order" adds the fact that an order was being saved, and turning it into "database error" adds nothing. And wrap once, at the layer that has the context, rather than at every level on the way out, or the chain becomes four sentences saying the same thing.

The version without a cause is the one to argue against hardest, because it looks tidy. It deletes the stack that says which query and which connection, and it does that at exactly the moment somebody needs it.`,
    explanation: `Editing the message keeps the stack and destroys the original wording, which is the detail the driver author wrote for you. It also mutates an object you do not own, and something upstream may have kept a reference to it.

Tagging with Object.assign keeps everything and says nothing new. The caller still gets a driver error with driver vocabulary, now with a property on it.

Throwing a fresh error with no cause is the common shape and the lossy one. Trusting that it was logged somewhere else assumes the layer below logs, that the log is correlated with this request, and that anyone will find it.`,
    hints: ['What is the caller able to read afterwards in each of these?'],
    tags: ['error', 'coding'],
  },
  {
    id: 'reading-an-error-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'An error arrives in a catch block. Walk me through what you look at, and how you decide what to do with it.',
    answerInFull: `- First, whether it is an error at all. Anything can be thrown, so a boundary handler has to cope with a string or an undefined arriving, usually by wrapping it in a real Error rather than by teaching everything downstream to be defensive.
- Then the type, and how I check it depends on where it came from. Within my own process, instanceof. Across a worker, a vm context, an iframe or two copies of a package, instanceof fails because it is an identity check, so I use a code field I control or the name.
- Then the fields the platform adds. Node system errors carry code, errno, syscall and often path, and the code is the documented contract while the message is prose that changes between versions. In a browser it is often a DOMException, identified by its name, AbortError being the one worth special casing.
- Then cause, following the chain down. That is where a wrapped driver error still has its real message and its stack.
- What I do with it comes from one question: can this frame do something specific about it. If yes, handle exactly that case by type or code, and rethrow everything else. If no, let it past. Logging and continuing is not handling.
- What I never do is match on the message. It is written for a human, and it is the one part of an error nobody promised to keep stable.
- When I report it, I pass the error object itself rather than stringifying it. message and stack are non-enumerable, so JSON.stringify gives an empty object and spreading gives an empty object, which is a bug that only shows up when things are already going wrong.

The types themselves are worth being fluent in: TypeError for the wrong kind of value, RangeError for the right kind out of range including a blown stack, ReferenceError for a name that will not resolve including the temporal dead zone, SyntaxError from JSON.parse and friends at run time, URIError from the URI functions, AggregateError from Promise.any, and EvalError which nothing throws any more.`,
    explanation: `The tell of a good answer is the order: what it is, then which type, then the platform fields, then the cause. Someone who has debugged production goes through those without being prompted.

The senior-shaped parts are two. Knowing that instanceof is an identity check and therefore fails at a boundary, and knowing that message is not an interface. Both turn into real incidents, and both are invisible until they happen.`,
    hints: [],
    tags: ['error', 'design'],
  },
]
