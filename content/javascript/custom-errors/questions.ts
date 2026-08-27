import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'inherited-name-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-2',
    prompt:
      'Production logs show "Error: email is required" for every validation failure, never "ValidationError". The class is right and the throw is right. What is missing?',
    code: `class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.field = 'email'
  }
}

throw new ValidationError('email is required')`,
    options: [
      'The constructor has to call super with the class name as a second argument',
      'name is looked up on the prototype chain, your prototype does not define one, so the search finds Error.prototype.name; assign this.name in the constructor',
      'The logger is reading error.constructor.name, which is minified in a production build',
      'A subclass of Error only reports its own name once the class has a static name property',
    ],
    correctOption: 1,
    answerInFull: `name is not generated from the class. It is an ordinary property looked up the ordinary way, and nothing on the path defines one until Error.prototype, whose name is the string Error.

    constructor(message, options) {
      super(message, options)
      this.name = new.target.name
    }

new.target.name rather than a literal, because it keeps working when somebody extends your subclass: the name follows the class actually being constructed.

The reason it shows up in the message line is that Error.prototype.toString reads this.name and this.message when it is called, so fixing the name fixes every place the error is formatted, including the first line of the stack.

One nuance comes with the fix. Assigning this.name makes it an own enumerable property, where message and stack are non-enumerable. So JSON.stringify of the error now produces an object with a name in it and nothing else, which reads like it worked. If the error is ever serialised, give the class a toJSON.`,
    explanation: `super takes the message and an options object, and nothing else. There is no argument that sets the name.

constructor.name would be the right value and is a different property, and minification is a real problem with it, which is exactly why the name is worth setting explicitly rather than derived at read time.

There is no static name property that feeds this. A class does have a name, which is what new.target.name reads, and nothing copies it onto instances for you.`,
    hints: ['Where does the engine look for name, and what does it find first?'],
    tags: ['error', 'class', 'debugging'],
  },
  {
    id: 'custom-error-lifecycle-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    tier: 'staff',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `class AppError extends Error {
  constructor(message) {
    console.log('entering')
    super(message)
    console.log(this.name)
    this.name = 'AppError'
  }
}

const error = new AppError('boom')
console.log(String(error))
console.log(error instanceof Error)`,
    items: ['AppError', 'entering', 'true', 'AppError: boom', 'Error', 'false', 'Error: boom'],
    correctOrder: [1, 4, 3, 2],
    answerInFull: `entering, Error, AppError: boom, true.

Four separate rules, one per line.

entering prints first, and the interesting part is that it is allowed to. A derived constructor may run statements before super, as long as none of them touch this. Reading or writing this before super is a ReferenceError, because the binding does not exist yet.

Error prints next. super has run, so the object exists and has its message and stack, but name is still being found on Error.prototype. The assignment on the following line has not happened yet.

AppError: boom comes from Error.prototype.toString, which reads this.name and this.message at the moment it is called. By then the assignment has happened, so the formatted string is right even though the property was set late.

true is the last line. Native class extends puts Error.prototype on the chain, so instanceof Error holds without anything extra. That is only false under a build that down-levels classes to ES5, where the fix is Object.setPrototypeOf(this, new.target.prototype).`,
    explanation: `"AppError" on its own is what the second line would print if setting the name happened before the log, which is the shape most people picture.

"Error: boom" is what String(error) gives when the name is never assigned at all, which is the default subclass and the bug worth recognising.

"false" is the ES5 answer. It is what instanceof reports when the class was compiled down and the constructor did not restore the prototype, and it catches people who have seen that bug and assume it is the general case.`,
    hints: [
      'Which statements are allowed above super, and which are not?',
      'When does toString read the name: at construction, or when it is called?',
    ],
    tags: ['error', 'class'],
  },
  {
    id: 'dropped-cause-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `class LoadError extends Error {
  constructor(message, options) {
    super(message)
    this.name = 'LoadError'
  }
}

const cause = new Error('socket closed')
console.log(new LoadError('could not load', { cause }).cause)`,
    options: [
      'The socket closed error, since cause is read from whichever constructor receives the options object',
      'undefined, because the options object was never forwarded to super, and the base Error constructor is what installs cause',
      'null, since the Error constructor defaults cause to null when it is not given one',
      'It throws: a subclass constructor may not declare a parameter it does not pass on',
    ],
    correctOption: 1,
    answerInFull: `undefined. The options object arrives in the subclass constructor, is never used, and is quietly discarded.

cause is installed by the Error constructor. It reads the options argument, and if there is a cause property it defines one on the object being built. A subclass that calls super with only the message hands it no options, so nothing is installed.

    constructor(message, options) {
      super(message, options)
      this.name = new.target.name
    }

Forwarding both arguments is the whole fix, and it is the line most custom error classes are missing, because super(message) looks complete.

What makes it worth recognising by sight is how it fails. Nothing throws, the wrapper works, the log looks right, and the chain that would have named the real failure is simply absent. You find out while debugging something else, months later.

If your class takes its own options as well, pull the cause out and pass it on deliberately rather than forwarding an object with extra keys in it, which is harmless today and is exactly the sort of thing a future field name collides with.`,
    explanation: `Reading cause from the subclass constructor would require the language to inspect an argument the subclass never uses. Nothing does that; the base constructor is the only thing that installs it.

There is no default. When no cause is given, the property is not created at all, so reading it gives undefined rather than null. The difference matters to any code testing whether a chain continues.

Declaring an unused parameter is legal and ordinary. The bug here is a silent omission, not a syntax error.`,
    hints: ['Which constructor actually creates the cause property?'],
    tags: ['error', 'class'],
  },
  {
    id: 'name-enumerability-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A custom error assigns this.name in its constructor. What does JSON.stringify of that error produce, and why does it matter?',
    options: [
      'The name, the message and the stack, since assigning any property makes the whole error enumerable',
      'An empty object, exactly as for a built-in error, because the name is still non-enumerable',
      'An object holding only the name, because assignment creates an enumerable property while message and stack stay non-enumerable',
      'A string of the form "ValidationError: message", because Error overrides toJSON',
    ],
    correctOption: 2,
    answerInFull: `An object with a name in it and nothing else.

JSON.stringify walks enumerable own properties. On a built-in error there are none of the useful ones: message and stack are own but non-enumerable, so the result is an empty object. An ordinary assignment, which is what this.name is, creates an enumerable property, so the name alone survives.

    JSON.stringify(new Error('boom'))            // {}
    JSON.stringify(new ValidationError('boom'))  // {"name":"ValidationError","field":"email"}

That is worse than the empty object rather than better, and it is the reason this bug is so often described as intermittent. Built-in errors log as nothing, which is obviously broken and gets fixed. Custom ones log as something, so the pipeline looks like it is working and the message is silently missing.

The fix is to serialise deliberately rather than to fight enumerability. A toJSON on the class is the version that needs no cooperation from call sites, because JSON.stringify calls it when it exists:

    toJSON() {
      return { name: this.name, message: this.message, code: this.code }
    }

Whether the stack goes in depends on where the JSON lands. Into your own logs, yes. Into a response a user reads, no.`,
    explanation: `Assignment affects only the property being assigned. It cannot change how message and stack were defined by the Error constructor.

An empty object is the answer for a plain Error and for a subclass that sets nothing. The moment a field is assigned, the result stops being empty and starts being misleading.

Error has no toJSON. That is the whole problem, and adding one is the fix.`,
    hints: [
      'What does JSON.stringify actually walk, and how was each of these properties created?',
    ],
    tags: ['error', 'class'],
  },
  {
    id: 'carrying-data-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A validator rejects a field, and an HTTP layer three frames up has to answer 422 with the field name in the body. Which error design gets it there?',
    options: [
      'Throw a ValidationError carrying field, rule and a code, and let the HTTP layer read them',
      'Throw an Error whose message is "email failed required", and parse the field out of it at the boundary',
      'Give every field its own subclass, so the boundary can switch on the type it caught',
      'Throw a plain Error and have the validator write the field into a module level variable the boundary reads',
    ],
    correctOption: 0,
    answerInFull: `Put the data on the error.

    class ValidationError extends Error {
      constructor(field, rule, options) {
        super(field + ' failed ' + rule, options)
        this.name = new.target.name
        this.code = 'VALIDATION_FAILED'
        this.field = field
        this.rule = rule
      }
    }

The boundary then does one instanceof check and reads two fields. No parsing, no coupling to the wording, and the same error serves a JSON API, a form that highlights an input, and a log line, because each of them takes what it needs.

The message stays, and it is for a human reading a log. The rule is that anything code branches on is a field, and anything a person reads is the message. Mixing the two is what produces guards built on substring matches.

Worth adding that the code is the field to reach for first. It survives JSON, it survives a worker or a process boundary, and it is the check that still works when instanceof does not. The class tells the boundary this is one of ours; the code tells it which one.`,
    explanation: `Parsing the message couples the boundary to a sentence, and the sentence changes the first time somebody improves the wording or translates it.

A subclass per field is a class explosion with no payoff: every one of them is caught by the same handler and answered the same way. Classes are for different handling, codes and fields for different causes.

A module level variable is the version that works in a demo and fails under concurrency, since two requests in flight share it. The error is the only thing that reliably travels with the failure.`,
    hints: [
      'What does the boundary need to read, and what is the fewest things it should have to know?',
    ],
    tags: ['error', 'class', 'coding'],
  },
  {
    id: 'class-per-failure-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'A pull request adds fourteen error subclasses, one per failure the service can produce. Every one of them is caught by the same boundary handler and turned into a 400. What do you say in review?',
    options: [
      'Approve it: a type per failure is the clearest possible design, and the handler can be specialised later',
      'Ask for the subclasses to be replaced by a single error type with no distinguishing field, since the handler treats them identically anyway',
      'Ask for a small number of classes where the handling genuinely differs, with a code field distinguishing the rest',
      'Ask for the classes to be kept but for the boundary to switch on constructor.name rather than on instanceof',
    ],
    correctOption: 2,
    answerInFull: `Classes for different handling, codes for different causes.

If all fourteen end up as a 400 from the same handler, the type is carrying no information the handler uses, and fourteen files exist to be caught by one line. Collapse them:

    class AppError extends Error {}
    class ValidationError extends AppError {}
    class ConflictError extends AppError {}

Three classes because those are the three responses: 400, 422, 409. Fourteen codes on top of them, because callers, logs and metrics all want to know which failure it was, and a string does that without a type.

What the classes are actually for is the boundary's first question: is this one of ours, or is it a bug. instanceof AppError answers it, and everything else falls through to a 500 and an alert. That distinction is worth a class. Distinguishing a missing email from a missing name is not.

The other reason to prefer the code is that it survives. Serialise the error to a queue, send it from a worker, load two copies of the package, and instanceof stops working while the string is still there.`,
    explanation: `Approving on the promise of future specialisation is how a taxonomy nobody uses gets built. If the handling is not different today, add the class on the day it is.

Removing the distinction entirely goes too far the other way. The failures really are different, and callers and dashboards need to tell them apart. That is what the code is for.

Switching on constructor.name replaces a working check with a fragile one: minifiers rename classes, and the string has none of the stability of a code you chose deliberately.`,
    hints: ['What does the boundary actually do differently for each of the fourteen?'],
    tags: ['error', 'class', 'scenario'],
  },
  {
    id: 'transpiled-instanceof-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt:
      'Custom errors work in tests and fail in the browser bundle: instanceof ValidationError is false there, and every validation failure becomes a 500. The build targets ES5. What is happening?',
    options: [
      'The bundler includes two copies of the module, so the class the boundary checks is not the class the validator threw',
      'ES5 has no class syntax, so the compiled constructor is a plain function and instanceof does not apply to it',
      'Down-levelled classes call Error as a function, which returns a fresh object instead of initialising this, so the instance does not have your prototype; restore it with Object.setPrototypeOf in the constructor',
      'Minification renamed the class, and instanceof compares the constructor name',
    ],
    correctOption: 2,
    answerInFull: `Error is not an ordinary base class, and down-levelling exposes it.

Compiled to ES5, class ValidationError extends Error becomes a function that calls Error.call(this, message). Called that way, Error ignores the this it was given and returns a brand new error object. The compiled constructor returns that object, and its prototype is Error.prototype rather than ValidationError.prototype. So instanceof Error is true and instanceof ValidationError is false.

    constructor(message, options) {
      super(message, options)
      Object.setPrototypeOf(this, new.target.prototype)
      this.name = new.target.name
    }

That line puts the right prototype back, and it is harmless on a native class where it changes nothing. TypeScript has a compiler note about exactly this case, and Babel needs a helper plugin.

The real fix is to stop targeting ES5. Every browser that needs it has been out of support for years, and the target is usually inherited from a config nobody has revisited. Until then, the workaround belongs in one base class that everything else extends, rather than repeated in fourteen constructors.

The other thing it changes is the failure mode: a false instanceof at a boundary sends a user error to the 500 path, which is why this shows up as an alert storm rather than as a wrong message.`,
    explanation: `Two copies of a module is a real cause of a false instanceof, and it would fail in tests too if it were happening. The tell here is that the difference is the build target.

ES5 has no class keyword and instanceof has never needed one: it works on any function with a prototype, which is how constructor functions worked before classes existed.

instanceof does not look at names at all. It walks the prototype chain, so minification cannot affect it, though it does break any check written against constructor.name.`,
    hints: ['What does calling Error as a function return?'],
    tags: ['error', 'class', 'debugging'],
  },
  {
    id: 'capture-stack-trace-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'staff',
    prompt: 'What does Error.captureStackTrace(this, ValidationError) do in a constructor?',
    options: [
      'It captures the stack for engines that do not populate one, and is required for a subclass to have a stack at all',
      'It records the stack a second time so the error carries both where it was constructed and where it was thrown',
      'It rewrites the stack to start at the caller, hiding the constructor frames; it is a V8 extension, so it has to be guarded before it is called',
      'It freezes the stack so later code cannot overwrite it',
    ],
    correctOption: 2,
    answerInFull: `It replaces the stack with one that starts above the function you name, so the frames belonging to your own error class do not appear.

    if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError)

Without it, the top of the stack is the ValidationError constructor and any factory that built it, which is noise: the reader wants the line that failed validation, not the plumbing that reported it. Node's own errors use this, which is why their stacks start in your code.

The guard matters. captureStackTrace is a V8 extension, not part of the language, so it exists in Node and Chrome and does not exist in Safari, where calling it unguarded throws from inside your error constructor. That is a bad place for a crash.

It is a convenience rather than a requirement. Extending Error already gives you a stack, captured when super runs. This only trims the top of it.`,
    explanation: `A subclass gets its stack from the Error constructor when super runs, so nothing is required to have one.

There is no second capture. The stack is taken once, at construction, and this replaces it rather than adding to it.

Nothing about it is related to freezing. The stack property stays writable, which is what lets libraries rewrite stacks for async traces.`,
    hints: [
      'Which frames are at the top of the stack when an error class constructs its own error?',
    ],
    tags: ['error', 'class'],
  },
  {
    id: 'error-tojson-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'Custom errors are pushed onto a queue as JSON and read back by a worker, which has to know which failure it was. What do you add?',
    options: [
      'A toJSON on the error class returning name, message, code and the fields, plus a rebuild function on the reading side',
      'A replacer function passed to JSON.stringify at each call site, listing the properties to keep',
      'Make every property enumerable by assigning message and stack again in the constructor',
      'Nothing: send the error object and let the queue client serialise it',
    ],
    correctOption: 0,
    answerInFull: `Give the class a toJSON, and give the reader a way back.

    toJSON() {
      return { name: this.name, message: this.message, code: this.code, field: this.field }
    }

JSON.stringify calls toJSON when the value has one, so every call site is fixed at once without knowing anything about errors. That is the whole reason to put it on the class rather than at the boundary.

The reading side needs the other half, because JSON.parse gives back a plain object and the worker wants something it can branch on. A small factory that reads the code and rebuilds the matching class is enough, with a fallback that wraps anything unrecognised in the base type rather than throwing.

Two decisions to state. The stack goes in for an internal queue and stays out of anything a user receives, since it names files and versions. And cause needs handling deliberately if you use it: serialise one level, or you have a recursive structure and no bound on it.

The reason this belongs on the class is that the code is what the worker switches on, and a code is only useful if it survives the trip.`,
    explanation: `A replacer works and has to be remembered at every call site, which is the same as not working. It also cannot help a call site inside a library you do not control.

Reassigning message and stack to make them enumerable fixes stringify and breaks other things: the properties stop matching how every other error in the process is defined, and anything iterating an error now sees them.

Trusting the queue client assumes it special cases errors. Most do not, and the ones that do usually keep only the message, which is the field the worker cannot branch on.`,
    hints: ['What does JSON.stringify check for before walking an object?'],
    tags: ['error', 'class', 'coding'],
  },
  {
    id: 'when-to-subclass-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    tier: 'senior',
    prompt: 'Which failures are worth their own error type?',
    options: [
      'Every distinct failure, so each one has a name that can be searched for in the codebase',
      'Only failures that cross a network boundary, since anything internal can stay a plain Error',
      'None: a plain Error with a code field covers every case and avoids a class hierarchy',
      'The ones a caller is expected to make a different decision about; a bug in your own code needs a stack, not a type',
    ],
    correctOption: 3,
    answerInFull: `The test is whether anything handles it differently. If two failures end up in the same catch doing the same thing, they are one type with two codes.

That splits the failures in a system into two groups, and the split is the useful part. Expected failures are the ones the design has an answer for: invalid input, a conflict, a rejected payment, a timeout. Those are worth types, because a caller recovers from each of them differently.

Bugs are the other group. A TypeError from your own code is not something a caller should recover from, and giving it a friendly domain type invites somebody to catch it and carry on. What a bug needs is to reach the boundary, be reported with its stack, and fail loudly.

    catch (error) {
      if (error instanceof AppError) return respond(error.status, error.code)
      throw error
    }

That is the shape the split buys: one check separates your failures from everything else, and everything else is a bug you have not fixed yet.

Searchability is a real argument for naming things, and the code field gives you that without a class per case.`,
    explanation: `A type per failure produces a hierarchy nobody navigates, and every one of them still ends up in the same handler.

Restricting types to network boundaries gets it backwards. The boundary is where identity is hardest to preserve, which is why the code field exists; the classes are for the handling inside the process.

Refusing to subclass at all loses the one distinction worth having, which is between the failures you designed for and the bugs you did not.`,
    hints: [],
    tags: ['error', 'class'],
  },
  {
    id: 'error-surface-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'You are designing the error surface of a library other teams will depend on. What do you expose, and what do you promise?',
    answerInFull: `- One base class everything I throw extends, so a consumer can separate my failures from bugs with a single check. That is the most valuable thing the surface gives them.
- Subclasses only where a consumer handles the failure differently. Two or three, usually. Everything else is distinguished by a code, because a type they never branch on is API surface I have to keep and they have to read.
- A code field on every error, from a documented and stable set. The codes are the interface: renaming one is a breaking change, exactly like renaming a method, and I would treat it that way in the changelog.
- Structured fields for anything a consumer would otherwise parse out of the message. The field that failed, the limit that was exceeded, the retry-after. The message is prose for a human and I reserve the right to reword it, which I say out loud in the documentation.
- cause set on anything I wrap, forwarded through super properly, so a consumer debugging a network failure through my abstraction still reaches the original.
- A toJSON on the base class, so an error of mine that ends up in a log pipeline or on a queue arrives with its name, message and code rather than as an empty object.
- No internal detail in the message and no stack in anything I hand back over a wire. Internal identifiers, file paths and query text stay in the log.

Two things I would deliberately not do. I would not throw for expected, frequent outcomes that are really return values, such as a cache miss, because exceptions are expensive to write around. And I would not swallow anything internally: a library that logs and continues takes a decision away from a consumer who knows more about the application than I do.

The judgement worth showing is that the error surface is API, versioned like the rest of it. Most libraries treat errors as an afterthought and then break consumers by changing a message.`,
    explanation: `The tell of a good answer is treating codes as versioned interface. Anyone can describe extending Error; committing to the stability of what a caller branches on is the part that comes from having broken somebody.

The second senior-shaped part is knowing what not to throw. Exceptions for ordinary outcomes push every consumer into try and catch around a hot path, and that decision is invisible until their profiler finds it.`,
    hints: [],
    tags: ['error', 'design'],
  },
]
