import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'unwinding-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A throw happens four frames deep, and the only try/catch is in the outermost of them. What happens to the two frames in between?',
    options: [
      'Each one returns undefined to its caller, so the code after the failing call runs with a missing value',
      'They are discarded without the rest of their bodies running, though a finally block in either of them does run on the way out',
      'They are left on the stack until the catch block finishes, then popped normally',
      'The engine unwinds to the top of the stack first, then searches back down for a handler',
    ],
    correctOption: 1,
    answerInFull: `They are discarded. A frame the exception passes through does not return anything, and the lines after the failing call never run.

That is the whole difference between a throw and an error code. A returned failure has to be checked at every level, and any level that forgets it carries on with bad data. A thrown one skips every level that has nothing to say about it and arrives at the first one that does.

The exception to nothing running is finally. Unwinding through a frame runs its finally blocks, which is what makes finally usable for releasing a lock or closing a connection: the cleanup happens whether the function returned or was abandoned.

If no frame has a catch, the exception reaches the top of the stack. In a browser that fires window.onerror; in Node it fires the uncaughtException event and, with nothing listening, prints the stack and exits non-zero.`,
    explanation: `Returning undefined is what a language without exceptions makes you write by hand, and it is the mental model most people bring. Nothing is returned here at all.

Leaving the frames on the stack would make the semantics wrong: the catch block runs in its own frame, and the ones above it are gone before it starts.

Unwinding to the top first would mean every finally in the program ran before any handler did. The search goes outward one frame at a time, and it stops at the first catch.`,
    hints: [],
    tags: ['error', 'call-stack'],
  },
  {
    id: 'finally-reassign-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function read() {
  let value = 'from try'
  try {
    return value
  } finally {
    value = 'from finally'
  }
}

console.log(read())`,
    options: [
      'from finally, because the finally block runs before the function actually returns',
      'undefined, since a finally block that does not return discards the pending return value',
      'from try, because the return expression was evaluated before finally ran, and reassigning the variable afterwards cannot reach it',
      'It throws: value is read after the return, which is unreachable code',
    ],
    correctOption: 2,
    answerInFull: `from try. The return happens in two steps and the finally block runs between them.

First the return expression is evaluated and the resulting value is held as the pending completion. Then finally runs. Then the function leaves with the value it was already holding. Reassigning value after the copy was taken changes the variable and nothing else.

    function write() {
      try {
        return 'from try'
      } finally {
        return 'from finally'
      }
    }

That one prints from finally, and the difference is the point. A finally block cannot edit a pending completion, only replace it with one of its own, and a return is a completion. So is a throw, a break and a continue.

The practical rule is that a return inside finally is a bug on sight, because it also discards an exception that was on its way out. Cleanup should not be able to change what the function is reporting.`,
    explanation: `from finally is the answer if you think finally runs before the return expression is evaluated. It runs before the function leaves, which is a different moment.

undefined would require the pending value to be dropped. Nothing drops it; only another completion replaces it.

Nothing here is unreachable. The finally block is reached on every path out of the try, which is the entire reason it exists.`,
    hints: ['When exactly is the value in a return statement computed?'],
    tags: ['error', 'finally'],
  },
  {
    id: 'try-catch-finally-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function run() {
  try {
    console.log('try')
    throw new Error('boom')
  } catch (error) {
    console.log('catch')
    return 'from catch'
  } finally {
    console.log('finally')
  }
}

console.log(run())`,
    items: ['catch', 'from finally', 'try', 'undefined', 'finally', 'Error: boom', 'from catch'],
    correctOrder: [2, 0, 4, 6],
    answerInFull: `try, catch, finally, from catch.

Three rules, in the order they apply.

The try body runs until it throws, so try prints and the line after the throw never does. The catch runs because something was thrown inside the try, so catch prints. The return in the catch does not leave yet: it evaluates its value and holds it, and finally runs before the function goes anywhere.

Then the function completes with the pending value, which is why from catch prints last rather than before finally.

    } finally {
      console.log('finally')
      return 'from finally'
    }

Adding that return would print from finally instead, because the finally block replaced the completion the catch had queued. Without a return, finally logs and lets the queued one through.`,
    explanation: `"from finally" is what the last line prints once finally returns something of its own, which is the difference between logging in a finally and completing in one.

"undefined" is the answer if you expect finally to discard the return the catch prepared. It only discards it when it supplies a replacement.

"Error: boom" is what reaches the console if the catch is not there at all. It is caught here, so nothing escapes and the error is never printed.`,
    hints: [
      'Does the catch block leave the function immediately when it returns?',
      'Which of these four lines is printed by the caller rather than by run?',
    ],
    tags: ['error', 'finally'],
  },
  {
    id: 'thrown-string-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'The catch block logs "undefined undefined". Why?',
    code: `function parseAge(input) {
  const age = Number(input)
  if (Number.isNaN(age)) throw 'age must be a number'
  return age
}

try {
  parseAge('old')
} catch (error) {
  console.error(error.message, error.stack)
}`,
    options: [
      'catch only binds Error instances, so error is undefined for anything else',
      'error.stack is populated by the engine only when the throw is inside a try block in the same function',
      'The value thrown is a string, and a string has no message or stack; only constructing an Error records where the throw happened',
      'console.error cannot read properties off a primitive, so it prints undefined for both',
    ],
    correctOption: 2,
    answerInFull: `A string was thrown, and a string is a string. It has no message property and no stack property, so reading either gives undefined.

throw accepts any value, which is a genuine part of the language rather than an accident. What it does not do is add anything to the value on the way past. The stack is captured by the Error constructor, at the moment the Error object is created, so a value that was never an Error never had one.

    if (Number.isNaN(age)) throw new TypeError('age must be a number, got ' + input)

The second thing this costs is discrimination. Every catch in the codebase has to cope with the possibility that what it caught is not an Error, so instanceof checks stop being reliable and defensive code spreads outward from the one place that threw a string.

The rule is to throw an Error or a subclass of one, always. If you are handed code that throws other things, wrap the value at the boundary rather than teaching every handler about it.`,
    explanation: `catch binds whatever was thrown, with no filtering at all. There is no form of catch in JavaScript that selects by type, which is why the instanceof check has to be written by hand.

Reading a property off a primitive works fine: strings are wrapped on access, which is how the length of a string literal works. It returns undefined here because the property is genuinely not there.

The stack has nothing to do with where the try is. It is captured when the Error is constructed, and this code never constructs one.`,
    hints: ['What exactly is the value that arrives in the catch block?'],
    tags: ['error', 'debugging'],
  },
  {
    id: 'finally-return-swallows-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A disk failure inside work() is reported nowhere: withCleanup returns "done" and the caller carries on. What is swallowing the error?',
    code: `function withCleanup(work) {
  try {
    return work()
  } finally {
    releaseLock()
    return 'done'
  }
}

withCleanup(() => {
  throw new Error('disk full')
})`,
    options: [
      'The return in the finally block completes the function normally, and that replaces the exception that was in flight',
      'finally catches errors as well as running cleanup, so an explicit catch is needed to see it',
      'work() is called inside a try, so its throw is converted into a rejected promise nobody awaited',
      'releaseLock() runs first and clears the pending error before the return is reached',
    ],
    correctOption: 0,
    answerInFull: `The return on the last line of the finally block. A finally cannot modify a completion that is already pending, but it can replace it with one of its own, and a return is a completion. The exception on its way out is discarded, and the function reports success.

    } finally {
      releaseLock()
    }

That is the fix, and it is a deletion. The cleanup still always runs, and the error carries on outward to whoever can do something about it.

The same replacement happens with a throw in a finally block, which is the subtler version: a cleanup step that fails reports its own failure and takes the real cause with it. Guarding cleanup with its own try and catch, and logging rather than throwing from it, is how that stays fixed.

The reason this is worth recognising by sight is that it produces no evidence. There is no caught error, no log line, no rejected promise. A function that failed returns a value that looks like success, and the damage shows up somewhere with no connection to the cause.`,
    explanation: `finally does not catch anything. It runs on the way past, and the exception continues afterwards unless something replaces it, which is exactly what happens here.

Nothing here is asynchronous. work is an ordinary function and its throw is an ordinary throw; promises are not involved.

releaseLock does not clear anything. Ordinary statements in a finally block leave the pending completion alone. Only an abrupt one replaces it.`,
    hints: ['Which statements in a finally block can change what the function reports?'],
    tags: ['error', 'finally', 'debugging'],
  },
  {
    id: 'finally-guarantee-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When does a finally block not run?',
    options: [
      'When the try block returns, since a return leaves the function immediately',
      'When there is no catch clause, because finally is only reached after a handler',
      'When the catch block throws a new error, which leaves before the finally is reached',
      'Only when the program does not get there at all: the process exits, or a loop inside the try never ends',
    ],
    correctOption: 3,
    answerInFull: `Effectively never, short of the program stopping. finally runs on every way out of the block it is attached to.

That includes the abrupt ways as well as the ordinary one: a normal completion, a return, a break, a continue, and a throw that nothing here catches. It runs after the catch when there is one, and instead of any handler when there is not.

    for (const item of items) {
      try {
        if (item === 'stop') break
        use(item)
      } finally {
        release(item)
      }
    }

The break there runs the finally before it leaves the loop, which is what makes the pattern safe.

What does skip it is process.exit, a crash, a power cut, and an infinite loop that never reaches the end of the try. None of those are cases you can code around, which is why finally is the right tool for a lock or a handle: the guarantee is as strong as the process staying alive.

That guarantee is also what makes a return inside finally so destructive. The block runs on the exceptional path too, so a return there discards exceptions rather than return values.`,
    explanation: `A return does not leave immediately, and that is the whole subtlety. The value is evaluated and held, the finally runs, and only then does the function go.

Not needing a catch is the case for a try and finally with no handler at all, which is a common and correct shape: clean up, let the error through.

An error thrown from the catch block still goes out through the finally, the same as one from the try. The finally is attached to the whole statement, not to the successful path.`,
    hints: [],
    tags: ['error', 'finally'],
  },
  {
    id: 'finally-with-break-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does scan return?',
    code: `function scan(items) {
  const log = []
  for (const item of items) {
    try {
      if (item === 'stop') break
      log.push(item)
    } finally {
      log.push('cleanup ' + item)
    }
  }
  return log
}

scan(['a', 'stop', 'b'])`,
    options: [
      "['a', 'cleanup a']",
      "['a', 'cleanup a', 'cleanup stop']",
      "['a', 'cleanup a', 'cleanup stop', 'b', 'cleanup b']",
      "['a', 'cleanup a', 'stop', 'cleanup stop']",
    ],
    correctOption: 1,
    answerInFull: `The array holds a, cleanup a, cleanup stop.

The first iteration is ordinary: the try pushes a, then the finally pushes cleanup a.

The second is the interesting one. The break is an abrupt completion, so it leaves the try block, but a break out of a try with a finally runs the finally first. cleanup stop is pushed, and only then does the loop end. What never runs is the push below the break, so stop itself is not in the log.

There is no third iteration, because the break took effect. A finally that completes normally does not cancel the completion that was pending; it would only do that by supplying its own return, throw, break or continue.

    } finally {
      log.push('cleanup ' + item)
      continue
    }

That version never ends the loop at all: the continue replaces the pending break, and scan walks the whole array. It is the same replacement rule that makes a return in a finally swallow exceptions.`,
    explanation: `Stopping after cleanup a assumes break skips the finally. It is the case people most often get wrong, and it is the case the cleanup guarantee exists for.

Walking the whole array assumes the finally cancelled the break, which only happens if the finally completes abruptly itself.

Getting stop into the log needs the push below the break to run. The break leaves the block at that line; nothing after it in the try body executes.`,
    hints: ['Is break one of the ways out of a block that finally covers?'],
    tags: ['error', 'finally'],
  },
  {
    id: 'narrow-catch-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A config loader parses JSON that users edit by hand, and should fall back to defaults when the file is malformed. Which catch is right?',
    code: `function loadConfig(raw) {
  try {
    return normalise(JSON.parse(raw))
  } catch (error) {
    // ???
  }
}`,
    options: [
      'return DEFAULTS — malformed input is the only thing that can go wrong in two lines of code',
      'console.error(error) and then return DEFAULTS — logging keeps the information while still recovering',
      'if the error is a SyntaxError return DEFAULTS, otherwise rethrow it — recover from the failure you expected and let the rest through',
      'throw a new Error saying the config could not be loaded — one clean message is easier to act on than a parser error',
    ],
    correctOption: 2,
    answerInFull: `The narrow one. Recover from a SyntaxError, which is what JSON.parse throws on bad input, and rethrow anything else.

    } catch (error) {
      if (error instanceof SyntaxError) return DEFAULTS
      throw error
    }

The reason is that the try block contains a call to normalise, and normalise is your code. A TypeError in it is a bug, and the wide catch turns that bug into a config file that silently loads defaults. The next person debugs why their settings are ignored, not why normalise crashed.

Two refinements worth saying. Narrow the try as well as the catch, so only the parse is inside it and normalise runs after; the narrower the block, the less the catch can accidentally cover. And when the fallback matters, say so out loud: a warning with the file path, so a broken config is visible rather than merely survivable.

Recovering at all is a decision. It is right here because a hand-edited file is expected to be wrong sometimes and defaults are a sane answer. For a config read from a deploy pipeline, failing to start is the better behaviour.`,
    explanation: `The bare fallback is the version that ships most often, and it is wrong for a reason that has nothing to do with JSON: normalise is inside the try, so its bugs are caught too.

Logging and recovering is the same swallow with a receipt. The caller still cannot tell defaults-because-broken from defaults-because-absent, and the log line is only useful to someone already looking.

Replacing the error with a tidy message throws away the parser's line and column, which is the single most useful thing about a SyntaxError from JSON.parse. If you do wrap it, keep the original as the cause.`,
    hints: ['What else is inside that try block besides JSON.parse?'],
    tags: ['error', 'coding'],
  },
  {
    id: 'cleanup-masks-cause-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'Every failed database call in production is reported as "connection already released". The real errors are nowhere in the logs. The handler releases its connection in a finally. What do you change?',
    options: [
      'Move the release into the catch block, so cleanup only runs when something failed',
      'Wrap the release in its own try and catch inside the finally, record its failure as a warning, and let the original error continue outward',
      'Return from the finally block so neither error escapes and the caller gets a clean result',
      'Release the connection before the query instead, so the finally has nothing left to fail at',
    ],
    correctOption: 1,
    answerInFull: `Guard the cleanup so it cannot replace the error already in flight.

    } finally {
      try {
        await connection.release()
      } catch (releaseError) {
        logger.warn({ releaseError }, 'failed to release connection')
      }
    }

A throw from a finally block replaces the pending completion, exactly like a return does. So when a query fails and the release then fails as well, the release error is the one that leaves, and the real cause is gone. That is why every report looks identical: you are seeing the second failure of every pair.

The reason the release fails at all is usually the first error. The query threw because the connection died, and releasing a dead connection throws too. So the masking is systematic rather than a rare race, which matches every failure looking the same.

Cleanup should be quiet. It does its work, records its own problems where someone can find them, and never changes what the function is reporting. If the release failure genuinely matters, attach it to the original as a cause rather than throwing it.`,
    explanation: `Releasing only in the catch leaks a connection on every successful request, which is a worse bug and a slower one to find.

Returning from the finally swallows both errors and reports success. It would empty the logs entirely, which is not the same as fixing them.

Releasing before the query is not cleanup, and the query needs the connection. Ordering the operations differently does not address a cleanup step that can fail.`,
    hints: ['What does a throw inside a finally block do to the error already on its way out?'],
    tags: ['error', 'finally', 'scenario'],
  },
  {
    id: 'catch-binding-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is true of the value bound by a catch clause?',
    options: [
      'It is block scoped to the catch clause, and the binding can be left out entirely when the value is not needed',
      'It is function scoped like var, so it is still readable after the catch block ends',
      'It is always an Error instance, because the engine wraps anything else that is thrown',
      'It is required, and a catch with no parentheses is a syntax error',
    ],
    correctOption: 0,
    answerInFull: `Two things, and they are both easy to state.

It is block scoped. The name exists inside the catch clause and nowhere else, so reading it after the closing brace is a ReferenceError. If you need the error outside, declare a variable above the try and assign to it.

And it is optional. Since ES2019 a catch clause can omit the binding when it does not care what was thrown:

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }

That form says something the unused variable did not: this code recovers regardless of the reason. Linters that complain about unused variables stop complaining, and nobody is tempted to log a value nobody looked at.

What the binding is not is typed or guaranteed. Whatever was thrown arrives exactly as it was thrown, including a string, undefined, or an object that is not an Error. Every catch that discriminates has to check, which is why instanceof appears in the narrow form.`,
    explanation: `Function scoping is the pre-ES6 mental model and it was never true of catch, which had its own scope long before let existed.

Wrapping non-Errors would make life easier and is not what happens. Throwing a string delivers the string, with no message and no stack.

The binding has been optional since ES2019 and is widely supported. Omitting it is the clearest way to say the reason does not matter here.`,
    hints: [],
    tags: ['error', 'scope'],
  },
  {
    id: 'where-to-catch-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'How do you decide where in a call chain to catch an error, and what do you do with one you cannot handle?',
    answerInFull: `- The rule is that a catch belongs where a decision can be made. If this function knows what to do instead, it catches; if it does not, it lets the error past. Catching in order to log and continue is not a decision, it is hiding one.
- That usually means two kinds of place. Deep down, a narrow catch that recovers from one expected failure, checked by type and rethrowing everything else. Up at the edge, one boundary per entry point: the request handler, the job runner, the top of a UI tree. The boundary turns any failure into the response the outside expects and reports it once.
- Everything between the two catches nothing. Frames in the middle are where a catch does the most damage, because they have context but no authority: they turn a specific failure into a vague one, or into a null that fails later.
- I separate expected failures from bugs. A malformed upload, a rejected payment, a timeout are all things the design has an answer for. A TypeError in my own code is not, and the correct handling is to let it reach the boundary and be reported loudly.
- For one I cannot handle: rethrow it unchanged, or wrap it and keep the original as the cause so the stack is not lost. Never swallow, never replace it with a tidier message that deletes the detail.
- The boundary also owns the parts nothing else can do: attaching the request id and the user, deciding what the caller is allowed to see, and choosing whether to retry. A failure surfaced once with context beats the same failure logged at four levels.
- Above the boundary I still want the last resort wired up, the uncaught exception and unhandled rejection handlers, reporting and then exiting rather than continuing in an unknown state.

The judgement worth showing is that error handling is a design question about who is responsible for a failure, not a syntax question about where to put a try. Most codebases have too many catches, not too few.`,
    explanation: `The tell of a weak answer is wrapping everything in try and catch to be safe. It reads as caution and produces a system where nothing fails and nothing works.

The senior-shaped part is the distinction between an expected failure and a bug, and the willingness to let bugs crash. Anyone can list places to put a catch; deciding that most of them should not have one is the harder call.`,
    hints: [],
    tags: ['error', 'design'],
  },
]
