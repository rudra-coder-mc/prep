import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Knowing what you caught',
    heading: 'Why this matters',
    script: `Catching an error is easy. Deciding what to do with it means knowing
      what it is, and that is where most error handling falls apart. A catch
      that treats every failure identically is a catch that cannot recover from
      any of them specifically.

      The language gives you a small, fixed vocabulary for this. Seven built-in
      error constructors, a shape they all share, and a set of rules about which
      one the engine throws for which mistake.

      Interviews ask because it separates people who read the error from people
      who read the first line of the error.`,
  },
  {
    title: 'Three properties, three different places',
    heading: 'What is actually in an Error',
    script: `An Error is an ordinary object with a well known shape, and three
      properties do all the work.

      Message is the string you passed to the constructor. It is an own property,
      and it is not enumerable.

      Name is not an own property at all. It comes from the prototype, which is
      how a TypeError knows it is called TypeError without anything assigning
      the string.

      Stack is added by the engine at the moment the Error is constructed, not
      at the moment it is thrown. So an error object built early and thrown later
      points at where it was built. It is not in the specification, every engine
      formats it differently, and it is the most useful thing in the object.

      Two consequences follow from message and stack not being enumerable, and
      both bite in real code. Stringifying an error as JSON gives you an empty
      object. Spreading one into a new object gives you an empty object too. An
      error copied by spreading is not an error any more, and a logger that
      stringifies one sends nothing at exactly the moment it matters.

      What works is reading the object directly. Passing the error itself to the
      console formats it with its stack. Converting it to a string gives you the
      name and the message and nothing else.`,
  },
  {
    title: 'Five types, five rules',
    heading: 'The types the engine throws',
    script: `Five of the seven come up constantly, and each has a rule you can
      state.

      TypeError. A value is asked for something it cannot do. Reading a property
      of undefined is the classic, and this is the commonest error in JavaScript
      by a wide margin.

      RangeError. The value is the right kind and outside what the operation
      allows. A negative array length, too many digits for toFixed, and a blown
      call stack are all the same category.

      ReferenceError. A name will not resolve. Nothing declares it, or it is a
      let or const being read before its declaration has run, which is the
      temporal dead zone.

      SyntaxError. Text that will not parse. At run time that means JSON dot
      parse, new Function and eval. A syntax error in your own file is thrown
      before any of that file runs, so a try block in it can never catch one.

      URIError. The narrow one. It comes from the URI encoding functions and
      from nothing else.

      The remaining two are special cases. EvalError is thrown by nothing any
      more and exists so old code still runs. AggregateError is thrown when
      several failures have to be reported at once, which today means a
      Promise dot any rejecting because everything rejected. Its errors array
      holds one entry per input, in input order.

      The distinction worth having ready is TypeError against RangeError. Wrong
      kind of value is a TypeError. Right kind, wrong value, is a RangeError.`,
  },
  {
    title: 'Wrapping without losing the original',
    heading: 'Naming a cause',
    script: `Since ES2022 the Error constructor takes a second argument, an
      options object, with one property in it: cause.

      Catch a driver error, throw a new error saying the order could not be
      saved, and pass the driver error as the cause. The caller gets a message in
      the vocabulary of your domain, and the driver's type, message and stack
      stay reachable underneath. Consoles and error reporters print the chain, so
      the failure reads as the domain problem first and the real cause below it.

      Before this existed, wrapping meant choosing between a useful message and a
      useful stack, so people either rethrew the raw driver error or lost it.

      The rule for using it is to wrap when you can say something the original
      could not, and to rethrow unchanged when you cannot. Turning connection
      terminated into could not save the order adds a fact. Turning it into
      database error adds nothing, and a wrapper that restates the same thing in
      worse words is just an extra frame.`,
  },
  {
    title: 'instanceof, and where it stops working',
    heading: 'Checking which one you have',
    script: `Instanceof is the usual check and it is right most of the time. What
      it actually asks is whether this realm's prototype is on the value's
      prototype chain, and that is an identity question.

      Across a realm boundary, an iframe, a worker, Node's vm module, or two
      copies of the same package in one bundle, the object is a genuine
      SyntaxError built from a different constructor, and the check is false. It
      is not a bug in either side. Identity does not survive the crossing.

      Three fallbacks, in the order worth reaching for them.

      A field you control. Node's system errors carry a code, a stable string
      like E N O E N T, and your own errors can do the same. This is the
      sturdiest, because it depends on neither identity nor wording.

      The name. A plain string comparison that crosses realms fine, and weaker
      than it looks, because anything can set a name.

      And the object's brand, which reports object Error for a real error from
      any realm. Recent engines also have a direct check for this; look up
      whether yours has it before relying on it.

      What is never a check is matching on the message. The message is prose, it
      is written for a human, and it changes between versions of whatever wrote
      it. A guard built on one fails silently on an upgrade.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what error types JavaScript has, name the seven and then say
      what each one means rather than reciting a list. TypeError for the wrong
      kind of value. RangeError for the right kind out of range. ReferenceError
      for a name that does not resolve, including the temporal dead zone.
      SyntaxError for text that will not parse. URIError for the URI functions.
      AggregateError for several at once. And EvalError, which nothing throws any
      more.

      Asked how you know which error you caught, say instanceof, and then give
      the caveat unprompted: it is an identity check, so it fails across an
      iframe, a worker or two copies of a package. For anything crossing a
      boundary, use a code field or the name.

      Expect follow ups on why stringifying an error gives an empty object, on
      what cause is for, and on where the stack comes from. On that last one, the
      detail that lands is that the stack is captured when the error is
      constructed, not when it is thrown.`,
  },
]
