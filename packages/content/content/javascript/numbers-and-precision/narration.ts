import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'One decision behind everything',
    heading: 'Why this matters',
    script: `Zero point one plus zero point two is not zero point three, and every
      developer has seen that. Far fewer can say what to do about it, and that is
      the half an interview asks about.

      The whole topic comes out of one decision. JavaScript has a single number
      type, and it is a binary floating point number. Everything surprising below
      follows from that, including the parts that look unrelated, like an
      identifier arriving from the database as a different identifier.`,
  },
  {
    title: 'What a number actually is',
    heading: 'One number type, and it is a float',
    script: `A number is a sixty four bit double. There is no integer type. Five
      and five point zero are the same value, and the check for whether something
      is an integer is asking about the value, not about how it was written.

      Those sixty four bits are one sign bit, eleven for the exponent, and fifty
      two for the significand. That buys you about fifteen to seventeen
      significant decimal digits, and it buys them in binary. A fraction is exact
      only when its denominator is a power of two. A half, a quarter and an
      eighth are exact. A tenth is not, in the same way that a third is not exact
      in decimal.

      So a tenth is not stored as a tenth. It is stored as the nearest double to
      a tenth, and every result of arithmetic is rounded to the nearest double
      again.`,
  },
  {
    title: 'Following the famous sum',
    heading: 'What `0.1 + 0.2` actually is',
    script: `Walk the famous one through. Neither literal is representable, so
      each is stored as the nearest double, and both are already slightly wrong
      before anything is added. The two approximations are added exactly, then
      the result is rounded to the nearest double, and that lands one step above
      the double you get by writing zero point three as a literal. So strict
      equality compares two genuinely different values and says false.

      The error is tiny and it accumulates. Adding a tenth ten times gives you
      nought point nine nine nine and so on rather than one. And zero point one
      plus zero point seven, times ten, is a hair below eight, so flooring it
      gives seven.

      That last one is how a rounding bug reaches production. The value is
      correct to fifteen digits and the floor is off by one. A small error is
      harmless right up until an operation with a cliff in it.`,
  },
  {
    title: 'Comparing without lying to yourself',
    heading: 'Comparing floats',
    script: `Never compare computed floats with strict equality. Compare the size
      of the difference against a tolerance instead.

      The tempting constant is Number dot epsilon, which is the gap between one
      and the next double above it. That makes it the correct tolerance near one
      and the wrong one everywhere else, because the gap between doubles grows
      with the magnitude of the number. Around ten billion, consecutive doubles
      are about a millionth apart, so two results that differ only by rounding
      error are much further apart than epsilon, and a fixed tolerance calls them
      different.

      The fix is to scale the tolerance by the larger of the two operands, which
      makes it a relative comparison. But the honest framing is that a tolerance
      is a decision about your data, not a constant you import. If the values are
      money, half a penny is a better tolerance than anything derived from
      epsilon.`,
  },
  {
    title: 'What rounding really does',
    heading: 'Rounding, and what `toFixed` does',
    script: `Two things about toFixed. It returns a string, and it rounds the
      double that is actually stored rather than the decimal you wrote.

      One point nought nought five, rounded to two places, gives one point nought
      nought. Not a bug. The literal was already stored as a value fractionally
      below a thousandth and a half, so rounding half up rounds down. Two point
      six seven five does the same thing for the same reason.

      And because the result is a string, adding one to it concatenates. If you
      need a number back you have to convert, and better still, format only at
      the moment of display rather than carrying formatted values around.

      Math dot round has its own edge. It rounds a half towards positive
      infinity, not away from zero. Minus one point five rounds to minus one, not
      minus two. If you want half away from zero, which is what most people mean
      and what most accounting rules require, you write it yourself.`,
  },
  {
    title: 'Where integers stop being integers',
    heading: 'Where the integers run out',
    script: `Integers are exact up to two to the fifty three, minus one. That is
      about nine thousand million million. Past it, doubles are spaced more than
      one apart, so some integers simply cannot be represented, and arithmetic
      gives you a nearby value instead.

      The dangerous part is how quiet it is. The largest safe integer plus one
      compares equal to the largest safe integer plus two. A literal larger than
      the boundary changes value on its way into the program. Nothing threw and
      nothing warned. A sixty four bit database identifier, a snowflake
      identifier or a nanosecond timestamp all live past that line, and parsing
      JSON rounds every one of them.

      Big integer is the fix for whole numbers of any size. It is a separate
      type, with its own literal suffix, and it refuses to mix with numbers in
      arithmetic. Adding a big integer to a number throws, because either
      conversion loses something. That refusal is deliberate. Everywhere else the
      language converts and guesses. This is the one place it would rather stop.`,
  },
  {
    title: 'Money, and the interview answer',
    heading: 'Money',
    script: `Money is not a floating point problem so much as a floating point
      trap. The values look small and well behaved, and the errors stay invisible
      until two systems compare a total.

      Two good answers. Integer minor units: store pennies rather than pounds, so
      every amount is a whole number, every addition is exact, and you divide by
      a hundred exactly once, at the edge, to display. That is what most systems
      do and it is the cheaper answer. Or a decimal library, when you need real
      division, tax splits, or more than two places of genuine precision. Format
      with the internationalisation number formatter rather than by hand, so the
      symbol and the grouping are right for the locale.

      In an interview, say the fix in the same breath as the cause. Why is zero
      point one plus zero point two wrong: because a number is a binary double
      and a tenth is not representable in binary. What do you do: compare with a
      tolerance, and hold money as integer minor units. And know when a float is
      the right answer, which is measurements. Positions, durations, weights,
      anything already approximate before it reached you.`,
  },
]
