import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Your vocabulary, not the engine',
    heading: 'Why this matters',
    script: `The built-in types describe how code broke, not what went wrong in
      your domain. TypeError is the engine's vocabulary. This payment was
      declined, this upload is too large, this token expired, is yours. And a
      caller can only respond to a failure it can recognise.

      Writing a custom error is four lines, and three of them are easy to get
      subtly wrong. The name says Error. Instanceof stops working under a build
      step. And the fields you attached vanish the moment the error is
      serialised.

      All three are things interviewers ask about, because all three have
      shipped.`,
  },
  {
    title: 'The four lines and what each does',
    heading: 'The smallest custom error that works',
    script: `A class extending Error, with a constructor that does four things.

      Extends Error puts Error's prototype on the chain, so the message, the
      stack and the string formatting all work, and instanceof Error is true.

      Call super with the message and the options object, both of them.
      Forwarding only the message is the common version, and it silently drops
      the cause, because the base constructor is what installs it.

      Set the name. It has to be set, because the name comes from the prototype
      and the prototype you inherited says Error. Use new dot target dot name
      rather than a literal, so it keeps working when somebody subclasses your
      subclass.

      And add a code: a stable string for callers to switch on. It survives
      serialisation and realm boundaries, which instanceof does not.`,
  },
  {
    title: 'Why the name says Error',
    heading: 'Where the name comes from',
    script: `Nothing about a subclass changes where the name is looked up, and
      that is the whole reason the default is wrong.

      The message and the stack are own properties, put on the object by the
      Error constructor when super ran. So is anything you assigned after it.

      The name is not. Without an assignment, it is not on the instance and it
      is not on your prototype either, so the search walks past both and finds
      the one on Error's prototype, which is the string Error. That is why the
      log says Error and not ValidationError even though the class is right.

      Assigning it in the constructor puts it on the instance, so the search
      stops there. The formatting still comes from Error's prototype, and it
      reads whatever name it finds at the moment it is called, so setting the
      name late still fixes every place the error is printed.

      One nuance comes with the fix. Assigning the name creates an own
      enumerable property, where the message and the stack are not enumerable.
      So a stringified custom error is no longer empty. It is worse: it holds
      the name and nothing else. Half a serialisation reads like a working one.`,
  },
  {
    title: 'Fields a caller can branch on',
    heading: 'Carrying data, not just words',
    script: `A message is for a human. Anything a caller has to branch on belongs
      in a field.

      Put the field that failed and the rule it broke on the error, alongside a
      code. Now an HTTP layer can answer 422 with the field name, a form can
      highlight the input, and a retry policy can tell a rejected card from a
      network timeout. None of that requires parsing English.

      The field to add first is the code. It is what every mature library
      exposes, it is what survives being stringified once you have a serialiser,
      and it is the only identity check that works across a worker, a process or
      a network hop.

      Treat the codes as a public interface. Renaming one is a breaking change
      for every caller that switched on it, exactly like renaming a method.`,
  },
  {
    title: 'How many types to have',
    heading: 'Classes or codes',
    script: `The instinct after learning this is a class per failure. Resist it.

      A class earns its place when callers handle that failure differently:
      different recovery, different status code, different retry decision.
      Fourteen subclasses that all end up in the same catch are fourteen files
      and one behaviour.

      The shape that scales is a small number of classes and a larger number of
      codes. One base class for everything your domain throws, a subclass
      wherever the handling genuinely differs, and a code distinguishing the
      cases inside each one. A check against the base class at the boundary
      separates your failures from bugs, and the code says which failure it was.

      The other half of the same judgement: a bug does not need a class. A
      TypeError from your own code is not something a caller should recover
      from, and giving it a friendly type invites somebody to try.`,
  },
  {
    title: 'What breaks when the error leaves',
    heading: 'Crossing a boundary',
    script: `Two things break when an error leaves the process it was made in.

      Instanceof stops working. It is an identity check against this realm's
      constructor, so an error from a worker, a vm context or a second copy of
      your package fails it while being entirely genuine. The code field does
      not care.

      And serialising drops everything. Stringify sees only enumerable own
      properties, so the message and the stack never survive. Give the class a
      toJSON and the problem goes away wherever JSON is used, because stringify
      calls toJSON when there is one. Whether the stack goes in depends on where
      the JSON lands: into your own log pipeline yes, into a response a user
      reads no, since it names your files and your dependency versions.

      One more trap if the build targets ES5. Down-levelled classes call Error
      as a function, which returns a fresh object rather than initialising this,
      and every instanceof on your subclass becomes false. The fix is one line
      in the constructor, resetting the prototype from new dot target. The real
      fix is to stop targeting ES5.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked how you write a custom error, give the four lines and say what
      each is for. Extend Error. Call super with the message and the options, so
      the cause survives. Set the name, because it comes from the prototype and
      would otherwise say Error. Add a code for callers to switch on. Then say
      why the code exists: it survives serialisation and realm boundaries, and
      instanceof does not.

      Asked when you would make one at all, the answer is when a caller has to
      do something different. Not for every failure, and not for bugs. The test
      is whether two failures end up in the same catch doing the same thing. If
      they do, they are one type with two codes.

      Expect follow ups on why the name is wrong by default, on what happens to
      a custom error in a log, and on how you would design the error surface of
      a library. On that last one, the thing worth saying is that the codes are
      versioned interface: renaming one breaks every caller that switched on it.`,
  },
]
