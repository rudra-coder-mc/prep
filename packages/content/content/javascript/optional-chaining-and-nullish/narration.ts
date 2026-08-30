import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Half of the defensive code in any JavaScript codebase is about one
      question: is this thing here? Before 2020 the answer was a chain of
      ands, or a get helper from a utility library, or a crash in production
      on the one path nobody tested. Optional chaining and nullish coalescing
      replace all of that with two characters each.

      They also get misused, in two opposite directions. Optional chaining
      sprinkled over every access hides real bugs behind an undefined that
      surfaces three functions later. The or operator used where nullish
      coalescing was meant turns a zero into a default, and ships a bug that
      only shows up for the one user whose count is zero. Knowing precisely
      what each one tests is what lets you use them where they belong and
      nowhere else.`,
  },
  {
    title: 'Two kinds of missing',
    heading: 'Two kinds of missing',
    script: `There are two values that mean nothing here. Undefined is what the
      language produces, for a property that does not exist or a variable that
      was never assigned. Null is what code produces on purpose to say the same
      thing. Together they are the nullish values, and they are the only two.

      Everything else is a value, including the ones that happen to be falsy.
      Zero is a count of zero. An empty string is a name that is empty. False
      is an answer. The old habit of testing with the or operator treats all
      three as missing, and that is the bug this whole topic exists to stop.

      One aside. Loose equality against null is true for both null and
      undefined and nothing else, which makes it the one genuinely useful
      double equals in the language.`,
  },
  {
    title: 'Optional chaining short-circuits the whole chain',
    heading: '`?.` short-circuits the whole chain',
    script: `Optional chaining reads a property unless the thing on its left is
      nullish, in which case the expression is undefined and nothing to its
      right is evaluated. Not just the next step. The rest of the chain.

      It has three forms, because property access has three forms. A dot, a
      bracket, and a call. The dot after the question mark is part of the
      token in all three, which is why the bracket and call forms look odd.

      The short-circuit is the part people get wrong, in both directions. If
      the first thing in the chain is nullish, the whole chain is undefined,
      and nothing after it throws. But only that first thing was guarded. If it
      exists and the next property is null, the step after that throws, because
      nothing said the second property was optional.

      That is the rule for placing it. Put optional chaining exactly where
      absence is legitimate, and let everything else throw, because a throw
      there is a real bug that wants finding.`,
  },
  {
    title: 'Nullish coalescing against or',
    heading: '`??` against `||`',
    script: `Nullish coalescing gives you the left side unless it is nullish, then
      the right. The or operator gives you the left side unless it is falsy,
      then the right. The difference is exactly the falsy values that are not
      nullish: zero, the empty string, false, not a number, and their
      relatives.

      A retries setting of zero, defaulted with or, becomes three. Defaulted
      with nullish coalescing, it stays zero, and only null and undefined
      become three.

      Neither operator is the right one. Nullish coalescing answers was a
      value supplied. Or answers is there something usable here. A form field
      that is empty usually wants or, because an empty name should become
      anonymous. A setting that can legitimately be zero or off always wants
      nullish coalescing.`,
  },
  {
    title: 'Assigning a default in place',
    heading: 'Assigning a default in place',
    script: `The three logical operators each have an assignment form, and they
      only assign when the test says so. Nullish assignment sets the property
      if it is null or undefined. Or assignment sets it if it is falsy, so a
      zero gets overwritten. And assignment sets it only if it is already
      truthy.

      Nullish assignment is the one that earns its place. Set this if nobody
      set it is a line in nearly every initialiser, and the operator says it
      without evaluating the right side when the value already exists. That
      matters when the right side is a function call you would rather not
      make.`,
  },
  {
    title: 'Where optional chaining cannot go',
    heading: 'Where `?.` cannot go',
    script: `A few places the syntax refuses. Not on the left of an assignment,
      because there is no sensible meaning for assign unless there is nothing
      to assign to. Not mixed with or or and without parentheses, and that one
      is deliberate: the two operators have different ideas of missing, and
      whichever precedence was chosen would be a trap. So the language makes
      you write the parentheses.

      And one place it is allowed but should not be used: as a substitute for
      a check. Optional chaining turns an error into undefined. If the next
      line uses that value as if it existed, the throw has moved, not gone.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked for the difference between or and nullish coalescing, say that
      or falls through on any falsy value and nullish coalescing only on null
      and undefined. Then give the case that separates them: a setting of zero
      or an empty string that or silently replaces. Mentioning that nullish
      coalescing was added in 2020 precisely because or kept causing that bug
      shows you know why it exists, not just what it does.

      Asked what an optional chain does when its first link is null, say the
      whole expression is undefined. The chain short-circuits at the question
      mark, nothing after it is evaluated, and nothing throws. Then add the
      other half: when the first link exists and the second is null, the third
      throws, because only the first was marked optional.`,
  },
]
