import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Prefer composition over inheritance is quoted in every interview and
      explained in almost none. The quote is not never use extends. It is a
      claim about coupling. A subclass is coupled to every detail of its
      base, including details the base did not mean to expose, and that
      coupling is paid on every change for the life of both classes.
      Composition couples a class to an interface instead, which is smaller
      and yours to define.

      What an interviewer wants is that you can say what inheritance
      couples, what composition costs in return, and which question you ask
      to pick one. The three previous topics gave the mechanics. This one is
      the judgement.`,
  },
  {
    title: 'What extends couples',
    heading: 'What `extends` couples',
    script: `A subclass depends on its base in four ways that a caller of the base
      does not.

      Every method, including the ones meant to be internal. A subclass can
      override anything, so every method becomes part of the contract, and
      a base that changes which methods call which others changes the
      subclass's behaviour without touching its code. This is the fragile
      base class problem, and the constructor calling an override from the
      previous topic is its most common form.

      The constructor's shape. The super call has to match, so the base
      cannot add or reorder a parameter without visiting every subclass.

      One parent. A class has one prototype chain, so a bird that should be
      both flying and swimming has to pick one and bolt the other on.

      And every field name. A subclass field that happens to share a name
      with a base field or accessor silently shadows it.

      The payoff is real too. A single extends gives a subclass every method
      for free, instanceof works, and super lets an override extend rather
      than replace. For a genuine is a relationship that will not change
      shape, that is the right trade, and a custom error class is the
      everyday example.`,
  },
  {
    title: 'Composition: has a, not is a',
    heading: 'Composition: has a, not is a',
    script: `Composition is holding an object and delegating to it. The class
      decides what to expose, the held object can be swapped, and nothing
      about its internals is part of the class's contract.

      Follow the walkthrough. The inheriting logger is a console writer, so
      anyone holding it can call write directly and bypass the prefix, and
      logging somewhere else needs a new subclass per destination. The
      composing logger holds a writer and exposes only log. The writer is
      anything with a write method. In the test it is a plain object that
      pushes onto an array. No subclass, no mocking library, no console.
      That swap is what composition buys.

      The cost is visible in the code. A constructor parameter and a field
      that inheritance would have hidden, and a method that forwards where
      inheritance would have inherited. Composition is more typing in the
      small, and the typing is the point. Each line is a decision about
      what the class exposes.

      Dependency injection is this pattern with a name. The writer arrives
      from outside rather than being constructed inside, which is what
      makes it replaceable in a test.`,
  },
  {
    title: 'Mixins: sharing behaviour without a parent',
    heading: 'Mixins: sharing behaviour without a parent',
    script: `When several unrelated classes need the same methods and none of them
      is a anything in common, the JavaScript answer is a mixin: a function
      that takes a class and returns a subclass of it with the extra
      methods. Because extends accepts any expression, mixins compose by
      nesting. A model extends serializable of observable of base.

      Each mixin adds one prototype to the chain, in the order applied, so
      super inside a mixin reaches the one applied before it. That order is
      also the weakness. Two mixins defining the same method silently
      shadow each other, and instanceof checks a class expression that was
      created fresh on every application, so asking whether a model is an
      instance of a mixin is not a thing.

      The other mixin style copies methods onto an existing prototype with
      Object assign. It is simpler and it has no super, because the copied
      functions have no home object.`,
  },
  {
    title: 'Choosing',
    heading: 'Choosing',
    script: `The question to ask is not is a or has a, which usually has both
      answers. It is, will this class need to change independently of that
      one?

      If the subclass would only ever override to extend, never to replace,
      and the base is stable, extends is cheap and clear. Errors, a thin
      layer over a framework base class, a type that genuinely specialises
      another.

      If behaviour needs to be swapped, tested in isolation, or combined
      from more than one source, compose. Anything with I O, anything a
      test will want to fake, anything that two different classes both
      want.

      If several unrelated classes want the same small capability, a mixin,
      with the order written down once.

      And the signal that you picked wrong: a subclass that overrides a
      method just to call super and throw away the result, or a base with a
      method that exists only so a subclass can override it. Both mean the
      coupling is in the wrong place.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked why you would prefer composition over inheritance, say what
      inheritance couples: every method is contract, one parent, the
      constructor's shape. Then say what composition gives: a small
      interface you define, swappable parts, testable in isolation. Then
      say when you would still extend, because never is the wrong answer.

      Asked how you do multiple inheritance in JavaScript, say you do not.
      There is one chain. Mixins as class returning functions give you
      layered behaviour, with the order applied being the order of the
      chain.

      Asked what the fragile base class problem is, say a base changing
      which of its methods call which others changes every subclass that
      overrode one of them. The constructor calling an overridable method
      is the version everyone has hit.`,
  },
]
