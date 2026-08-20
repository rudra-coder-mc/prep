import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this one comes first',
    heading: 'Why this matters',
    script: `Almost every example of JavaScript being weird is one of two rules,
      applied honestly. Values get converted before they are compared or
      combined. And which conversion happens depends on the operator, not on the
      values. Learn those two rules and the weirdness turns into something you
      can predict.

      This is not a party trick topic either. An id that arrives from an
      interface as the text four two compares equal to the number four two with
      loose equality, and not equal with strict equality. A default written as
      value or the string none quietly rewrites zero and the empty string. Both
      of those ship in real code, regularly.`,
  },
  {
    title: 'What there is',
    heading: 'What there is',
    script: `There are seven primitive types. Undefined, null, boolean, number,
      string, symbol and bigint. Everything else is an object, and that includes
      arrays and functions. Primitives are immutable, so uppercasing a string
      hands you back a new string rather than changing the one you had.

      The typeof operator reports that set, with two dents in it. Typeof null
      says object, which is a bug from nineteen ninety five that was kept for
      compatibility. Typeof a function says function, even though a function is
      an object. And typeof not a number says number, because not a number is,
      technically, a number.

      One useful detail. Typeof a name that was never declared gives you the
      string undefined instead of throwing, which makes it the one safe way to
      probe for a global. That protection does not extend into the temporal dead
      zone, which is the next topic.`,
  },
  {
    title: 'Truthiness, and the list worth memorising',
    heading: 'Truthiness',
    script: `There are exactly eight falsy values. False, zero, minus zero, big
      integer zero, the empty string, null, undefined, and not a number.
      Everything else is truthy, including the empty array, the empty object,
      and the string containing a single zero character.

      That list is short enough to memorise, and it is worth memorising, because
      every if statement you write that tests a value directly is testing
      against exactly that list. It is also why the or operator is a bad default
      for numbers and strings. If zero or the empty string is a legitimate
      value, the or operator throws it away. The nullish coalescing operator
      exists precisely for that: it only steps in for null and undefined.`,
  },
  {
    title: 'Plus is two operators wearing one symbol',
    heading: '`+` is two operators',
    script: `Plus is the only arithmetic operator that also joins text together.
      It converts both sides to primitives first. If either result is a string,
      it joins them. Otherwise it adds. Every other arithmetic operator converts
      to number, which is why minus and times never surprise anybody.

      So the number one plus the string two gives you the text one two, because
      one side was a string. But the string three minus the number one gives you
      the number two, because minus has no meaning for text at all.

      Objects go through one more step. An object becomes a primitive by trying
      three things in order: a special conversion method, then valueOf, then
      toString. An array inherits a valueOf that returns the array itself, which
      is not a primitive, so arrays always fall through to toString, which joins
      the elements with commas. That single fact explains why an empty array
      plus an empty object gives you the text object Object.`,
  },
  {
    title: 'What loose equality actually does',
    heading: 'What `==` actually does',
    script: `Loose equality is not random. It is a short list of conversions,
      applied until both sides are the same type.

      Null and undefined are loosely equal to each other and to nothing else.
      That is a special case, not a conversion. When a number meets a string,
      the string is converted to a number. When a boolean is involved, the
      boolean is converted to a number first, so the string one compared with
      true is really the string one compared with the number one. When an object
      meets a primitive, the object is converted to a primitive. And not a
      number is not equal to anything, including itself.

      Run the empty array compared with false through that. False becomes zero.
      The empty array becomes the empty string. The empty string becomes zero.
      Zero equals zero, so it is true. Nothing arbitrary happened. But nobody
      wants to do that in their head during code review, and that is the real
      argument for strict equality.`,
  },
  {
    title: 'Three ways to compare, and when each is right',
    heading: 'Three ways to compare',
    script: `Strict equality compares type and value with no conversion at all,
      and it is your default. It has two gaps. Not a number is not strictly
      equal to itself, and zero is strictly equal to minus zero.

      Object dot is closes both gaps. It says not a number is the same as not a
      number, and that zero is not the same as minus zero. Otherwise it behaves
      exactly like strict equality. The includes method on arrays uses those
      same rules, which is why an array containing not a number will tell you it
      includes not a number, while indexOf on the same array says it is not
      there.

      One more trap that catches people out. The relational operators do not
      share the null special case. Null compared with zero using loose equality
      is false, but null greater than or equal to zero is true, because greater
      than or equal converts null to zero. That is the sharpest example there is
      of the rules depending on the operator rather than the values.`,
  },
  {
    title: 'Saying it in an interview',
    heading: 'The interview angle',
    script: `If you are asked why some coercion result is what it is, do not
      recite the answer. Walk the conversion out loud. Say which operator it is,
      say what that operator converts to, and then apply it one step at a time.
      An interviewer is listening for whether you have a model or a memorised
      list, and walking it is the only thing that proves the model.

      Expect follow ups on why typeof null is object, on the difference between
      the or operator and nullish coalescing, on how to check that a value is
      really an array, and on when you would ever choose loose equality. There
      is a good answer to that last one, by the way. Comparing a value loosely
      against null catches both null and undefined in one check, and that is the
      one place where the special case is useful rather than dangerous.`,
  },
]
