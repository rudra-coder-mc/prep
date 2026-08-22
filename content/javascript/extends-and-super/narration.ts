import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Extends is one keyword and it does two things, and super is one
      keyword that means two different things depending on where it is
      written. Most inheritance bugs are one of those four being confused.
      A static that is not found. A this used before super that throws. A
      field on the subclass that the base constructor cannot see. A super
      method call that reaches the wrong object.

      The other reason this is asked is that the order of construction is
      fixed and counter intuitive. A derived class's fields do not exist
      while the base constructor runs, so a base method called from the
      base constructor and overridden in the subclass sees undefined where
      it expected a field. That bug ships in every language with this
      construction order, and the interview question is whether you can say
      why.`,
  },
  {
    title: 'Two chains, not one',
    heading: 'Two chains, not one',
    script: `Class B extends A sets up two prototype links. B's prototype object
      inherits from A's prototype object. That is the chain instances walk
      for methods. And the class B itself inherits from the class A. That is
      the chain the class walks for statics. A static defined on A is found
      through B because of that second link, and it is the one people
      forget exists.

      Look at the picture. An instance of B walks its own properties, then
      B's prototype, then A's prototype, then Object's prototype. The class
      B walks B, then A, then Function's prototype, which is how a static
      create method on A is reachable as B dot create.

      Instanceof walks the first chain. It asks whether A's prototype is
      anywhere on the object's chain. It is a prototype check, not a
      constructor check, which is why an object created with Object create
      from A's prototype passes it having never run A at all.`,
  },
  {
    title: 'super in the constructor',
    heading: '`super()` in the constructor',
    script: `In a base class, new creates the object and then runs the constructor
      with this bound. In a derived class it does not. This is uninitialised
      when the derived constructor starts, and it is the call to super that
      creates the object, by running the base constructor, and binds this
      to the result.

      Three rules follow. A derived constructor must call super before
      touching this, and must call it before returning. Either omission is
      a reference error. If a derived class has no constructor, it gets one
      for free that passes every argument to super. And the derived class's
      fields are initialised immediately after super returns, not before.

      That third rule is the trap. Follow the walkthrough. The base
      constructor calls an init method. The lookup finds the derived
      class's override, because the object is a derived instance. The
      override reads a derived field, and the field is undefined, because
      derived fields are set after super returns and super has not
      returned. Had it not thrown, the field initialiser would then have
      run and wiped whatever init had put there.

      The fix is a design rule. A constructor does not call methods a
      subclass may override. Do the work in a method the caller invokes
      after construction, or pass what is needed as arguments.`,
  },
  {
    title: 'super.method and where it looks',
    heading: '`super.method()` and where it looks',
    script: `Outside the constructor, super means the prototype of the object this
      method was defined on. It is resolved from where the method is
      written, not from this, which is why it still works when the method
      is called on a deeper subclass or borrowed with call. Super dot
      describe in a B method looks at A's prototype and calls what it finds
      with this left as the current object.

      That defined on is also why super works in object literal methods,
      which have a home object too. Set one literal's prototype to another
      and a method in the first can call super dot method to reach the
      second. It does not work in an arrow field or a function expression
      assigned to a property, because those have no home object.

      An overriding method that wants the base behaviour calls super dot
      method explicitly. There is no automatic chaining, and forgetting the
      call is a normal way to silently drop base behaviour.`,
  },
  {
    title: 'Extending built-ins',
    heading: 'Extending built-ins',
    script: `Extending Array works, and the instance is a real array with a length
      and indexes, because super asks Array to create the object. Two things
      to know. Array methods that return a new array, like map and filter,
      create an instance of the subclass, through a mechanism called
      species, so filtering a stack gives a stack. And that is overridable
      with a static species getter if a plain array is wanted.

      Extending Error is the common case and has its own checklist. Call
      super with the message, which sets message and captures the stack.
      Set name by hand, because the inherited one is just Error and it is
      what appears in the stack trace. And know that instanceof works
      natively in modern engines. It did not when classes were transpiled
      down to old JavaScript, which is where the old advice to reset the
      prototype in the constructor came from.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked why you cannot use this before super, say because there is no
      object yet. In a derived class the base constructor creates it, and
      super is the call that runs the base constructor. Then give the
      follow on: derived fields are set after super returns, so the base
      constructor cannot see them.

      Asked what extends actually does, say two links. The prototype to the
      base prototype for instances, and the class to the base class for
      statics. Then that super in a method resolves from the home object,
      not from this.

      Asked what you need to do when extending Error, say call super with
      the message, set name, and know that instanceof works natively but
      needed a prototype fix under old transpilers.`,
  },
]
