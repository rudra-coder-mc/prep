import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Class is the syntax most people write objects with, and the prototypes
      topic already said what it is underneath: a constructor function,
      methods on its prototype, and a chain. What an interviewer probes is
      the part that is not sugar. Where does a field live, and where does a
      method? In what order does a constructor run its pieces? Why does a
      class hoist differently from a function? Why is a method written as
      an arrow field a different thing from a method?

      Each of those has a one sentence answer, and each one also explains a
      bug. Methods on the prototype is why JSON stringify drops them. Fields
      per instance is why an arrow field costs memory per object.
      Initialisation order is why a field that reads another field sees
      undefined. This topic is those sentences.`,
  },
  {
    title: 'What a declaration makes',
    heading: 'What a declaration makes',
    script: `A class declaration creates exactly one thing you can hold: a
      function. Calling new on it creates an object, and everything else in
      the body is placed on one of those two.

      Follow the walkthrough. The class itself is a function with a
      prototype property. Methods and accessors go on that prototype, once,
      shared by every instance, and they are non enumerable, so for in and
      Object keys skip them. A static member goes on the function itself
      and belongs to the class, not to any instance. Then new allocates an
      empty object whose prototype is the class's prototype, runs the field
      initialisers on it, so each instance gets its own copy of each field,
      and only then runs the constructor body with this bound to the new
      object.

      That gives the rule for where something lives. Methods and accessors
      on the prototype, fields on the instance, statics on the class.
      Everything about memory, serialisation and overriding follows from it.
      A method exists once no matter how many instances there are. A field
      exists once per instance. And stringify writes only the fields,
      because it reads own enumerable properties and the methods are
      neither.`,
  },
  {
    title: 'Fields and the constructor',
    heading: 'Fields and the constructor',
    script: `A field declaration runs as if you had assigned it on this at the top
      of the constructor, before any of the constructor's own code. A field
      with no initialiser still exists, holding undefined, which is
      different from not existing at all.

      Field initialisers are expressions and run per instance with this
      bound, so they can read other fields declared above them and call
      methods. The order is textual. A field that reads one declared below
      it reads undefined.

      The field that causes the most discussion is the arrow function. An
      arrow assigned as a field is an own property on every instance,
      created fresh each time, and it closes over this the way any arrow
      does. That is why it survives being passed to an event listener
      without bind. The price is the previous topic's point. It is not on
      the prototype, so there is one function per instance rather than one
      shared, and a subclass cannot reach it with super, because super looks
      at the prototype and the field is not there.

      A plain method is the default. An arrow field is a deliberate choice
      for a method that will be passed around as a value.`,
  },
  {
    title: 'Not just sugar',
    heading: 'Not just sugar',
    script: `Five ways a class behaves differently from the constructor function it
      replaces, and any of them can be the question.

      A class body is strict mode whether or not the file is, so this in a
      detached method is undefined, not the global object. Calling a class
      without new throws a type error, where a function constructor would
      have run with whatever this the call form gave it. A class declaration
      sits in the temporal dead zone until its line runs, so using it above
      the declaration throws, where a function declaration would have been
      hoisted and worked. Methods are non enumerable, so they do not show up
      in for in, Object keys, or a spread. And methods are not constructors,
      so calling new on one throws.

      The class expression form exists too and behaves the same way,
      including a named form whose name is visible only inside the body.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked whether class is just syntactic sugar, say mostly, and then list
      what is not: strict mode, new required, the temporal dead zone, non
      enumerable methods, methods that cannot be constructed, and private
      fields. Saying mostly and then the list is the answer.

      Asked where a method lives and where a field lives, say prototype and
      instance, then give the consequence you have been bitten by.
      Stringify drops the methods, and an arrow field costs one function
      per object.

      Asked why this dot x reads undefined inside a field initialiser, say
      that fields run in textual order before the constructor body. Either
      x is declared below, or it is set in the constructor, and neither has
      happened yet.`,
  },
]
