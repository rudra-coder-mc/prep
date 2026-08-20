import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'One sentence, then everything else',
    script: `This is the feature people work around rather than learn, usually
      by scattering arrow functions until the errors stop. That works right up
      until it does not, and it never survives an interview follow up.

      The whole topic collapses into one sentence. For a regular function, this
      is decided by how the function is called, not by where it was written.

      Everything else in this topic follows from that sentence. So if you take
      one thing away, take that.`,
  },
  {
    title: 'The four call forms',
    script: `There is a precedence order, and knowing it answers almost every
      question you will be asked.

      First, calling with new sets this to the newly created object. Second,
      call, apply and bind set it explicitly. Third, calling a function as a
      method, with an object to the left of the dot, sets this to that object.
      And fourth, a plain function call leaves this as undefined in modules and
      in strict mode, or the global object otherwise.

      Check them in that order, top to bottom, and the first one that applies
      wins.

      Arrow functions sit outside that list entirely. An arrow has no this of
      its own, so the name resolves lexically, walking outward through the scope
      chain like any other variable. Nothing at the call site can change it. Not
      even call.`,
  },
  {
    title: 'Losing the binding',
    script: `The commonest bug in this topic is not exotic at all. It is taking
      a method out of its object.

      Picture a counter object with a count and an increment method that adds
      one to this dot count. Called as a method, with the object to the left of
      the dot, it works. Now assign that method to a plain variable and call it.
      The function is the same function object. But there is nothing to the left
      of the dot any more, so this is undefined, and reading a property of
      undefined throws a type error.

      That is not a contrived example. The same thing happens every time a
      method is passed somewhere: to a timeout, to an array's map, to an event
      listener. The host calls your function plainly, and the binding you
      assumed is simply gone.`,
  },
  {
    title: 'Arrows close over this',
    script: `Because an arrow has no this of its own, the lookup continues
      outward, exactly like a closure over any other variable.

      That gives you the rule that actually predicts behaviour. An arrow inside
      a method works, because it finds the method's this. An arrow as a method
      does not work, because it walks straight past the object and finds
      whatever this was in the surrounding scope, usually undefined at module
      level.

      So arrows are not a fix for this. They are a way of deliberately not
      having one. Used inside a method, where you want the enclosing this, that
      is precisely the right tool. Used as the method itself, it is the bug.`,
  },
  {
    title: 'Call, apply and bind',
    script: `Call invokes the function immediately, with the arguments listed
      one by one. Apply invokes immediately too, with the arguments as an array.
      Bind does not invoke anything. It returns a new function with this fixed,
      and with any arguments you gave it already prepended.

      Bind is the odd one out for two reasons. It is lazy, and it is permanent.
      Once a function is bound, calling it with call and a different object does
      nothing. Binding it again does nothing. The only thing that overrides a
      bound this is new.

      One practical note. Spread has largely retired apply. Calling with call
      and spreading the arguments does the same job and reads better.`,
  },
  {
    title: 'The interview angle',
    script: `Asked what this is, answer with the precedence order rather than a
      definition. For a regular function, whatever the call site says: new, then
      explicit binding with call, apply or bind, then the object to the left of
      the dot, then nothing. Arrow functions have no this and close over the
      surrounding one.

      Expect follow ups on why a method breaks when passed to a timeout, on how
      you would fix it, and on what bind returns. Have more than one fix ready.
      Bind at the point you pass it, wrap it in an arrow, or define the method
      as a class field. Knowing three and being able to say which you would use
      and why is a much better answer than knowing one.`,
  },
]
