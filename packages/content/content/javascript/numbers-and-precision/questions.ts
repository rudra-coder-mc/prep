import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'why-floats-are-inexact',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Why is 0.1 + 0.2 not exactly 0.3?',
    options: [
      'Because floating point addition is performed at a lower precision than storage, so the sum loses digits the two operands still have',
      'Because a number is a binary double, and a tenth is not representable in binary. Both operands are stored as the nearest double, and the sum rounds to a double that is not the one 0.3 rounds to',
      'Because JavaScript has no decimal type, so it converts both operands to strings, concatenates the fractional parts and converts back',
      'Because 0.1 and 0.2 are stored exactly, and it is only the display that is wrong: the comparison is really true and console.log rounds it badly',
    ],
    correctOption: 1,
    answerInFull: `A number is a 64-bit IEEE 754 double, which stores a value in binary. A fraction is exact in binary only when its denominator is a power of two, so 0.5, 0.25 and 0.125 are exact and 0.1, 0.2 and 0.3 are not, exactly the way a third is not exact in decimal.

So 0.1 is stored as the nearest double to a tenth and 0.2 as the nearest double to a fifth. Those two are added exactly, and the result is rounded to the nearest double again. That lands one representable step above the double that the literal 0.3 rounds to, so === compares two genuinely different values and says false.

The fix is not to make the arithmetic exact, it is to stop asking for exact equality. Compare with a tolerance, or hold the values as integers when they are counts of something exact, such as money.`,
    explanation: `"Addition at lower precision" is the wrong mechanism. The addition is exact and the rounding happens on the way in and on the way out, not during it.

"Converts to strings" is not how any arithmetic works here. If it were, the result would be right, because decimal strings represent a tenth perfectly.

"Only the display is wrong" is the reassuring version, and it is testable: 0.1 + 0.2 === 0.3 is false, so the two values really do differ. console.log prints the shortest string that round-trips to the stored double, so it is being honest.`,
    hints: ['Which fractions can a binary representation hold exactly?'],
    tags: ['numbers', 'precision'],
  },
  {
    id: 'float-comparison-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const sum = 0.1 + 0.2
console.log(sum)
console.log(sum.toFixed(2))
console.log(sum === 0.3)
console.log(Math.abs(sum - 0.3) < Number.EPSILON)`,
    items: ['0.3', '0.30000000000000004', 'true', '0.30', 'false', '0.30000000000000004441', 'NaN'],
    correctOrder: [1, 3, 4, 2],
    answerInFull: `0.30000000000000004
0.30
false
true

The first line prints the stored value, shown as the shortest decimal string that round-trips back to it. The second formats that same value to two places and hands back a string, which is why the trailing zero survives.

The third is false, because the sum is a different double from the one the literal 0.3 produces. The fourth is the fix: the difference is smaller than Number.EPSILON, so a tolerance comparison agrees the two are the same number.

Number.EPSILON is the gap between 1 and the next double above it, which makes it the right tolerance for values near 1 and the wrong one for large ones, where consecutive doubles are much further apart.`,
    explanation: `0.3 is the first line as everybody expects it. console.log does not round: it prints the shortest string that reads back as the exact double stored, and for this value that string has the extra digits in it.

0.30000000000000004441 is the value taken further than JavaScript ever shows it. That is what toPrecision(20) gives, and it is not what printing the number produces.

NaN belongs to nothing here. It is the answer if you read Math.abs as needing a number it was not given, and every value in the expression is a number.`,
    hints: [
      'Does toFixed change the value or produce a string?',
      'Which of the last two comparisons converts, and which compares exactly?',
    ],
    tags: ['numbers', 'precision'],
  },
  {
    id: 'comparing-with-epsilon',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You need approximatelyEqual(a, b) for values that may be anywhere from 0.001 to 1e12. Which implementation is right?',
    options: [
      'const approximatelyEqual = (a, b) => Math.abs(a - b) < Number.EPSILON',
      'const approximatelyEqual = (a, b) => a.toFixed(10) === b.toFixed(10)',
      'const approximatelyEqual = (a, b) =>\n  Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))',
      'const approximatelyEqual = (a, b) => Math.round(a) === Math.round(b)',
    ],
    correctOption: 2,
    answerInFull: `const approximatelyEqual = (a, b) =>
  Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))

The gap between consecutive doubles grows with the magnitude of the number. Near 1 it is Number.EPSILON, about 2.2e-16. Near 1e10 it is about 1.9e-6. A fixed tolerance is therefore only correct at one scale, and the range in the question spans fifteen orders of magnitude.

Scaling the tolerance by the larger operand makes it a relative comparison: "are these within a rounding error or two of each other, for numbers this size". In production you would also scale by a small integer rather than by 1, since a chain of operations accumulates more than one rounding step, and you would handle the case where both operands are 0, which makes the right-hand side 0 and turns the comparison back into exact equality.

The honest framing for an interview: a tolerance is a decision about your data. If the values are money, half a penny is a better tolerance than anything derived from EPSILON.`,
    explanation: `The fixed Number.EPSILON version is right at the bottom of the range and useless at the top. At 1e12 two doubles one representable step apart differ by far more than 2.2e-16, so it reports every pair as different, including a value compared against itself computed two ways.

toFixed comparison fails at both ends. It returns exponential notation above 1e21, it throws a RangeError over 100 digits, and at 1e12 ten decimal places is far finer than the type can represent, so it is exact equality wearing a disguise.

Math.round comparison answers a different question. It says 1.4 and 0.6 are different and 1.4 and 1.6 are the same, which has nothing to do with rounding error.`,
    hints: ['Is the gap between two adjacent doubles the same everywhere on the number line?'],
    tags: ['numbers', 'precision'],
  },
  {
    id: 'tofixed-rounds-the-stored-value',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `console.log((1.005).toFixed(2))
console.log((2.675).toFixed(2))
console.log((1.5).toFixed(2) + 1)`,
    options: [
      "'1.01', '2.68', 2.5",
      "'1.00', '2.67', '1.501'",
      "'1.01', '2.68', '1.501'",
      "'1.00', '2.67', 2.5",
    ],
    correctOption: 1,
    answerInFull: `1.00
2.67
1.501

toFixed rounds the double that is actually stored, not the decimal you typed. 1.005 is stored as 1.00499999999999989…, which is below a thousandth-and-a-half, so rounding to two places rounds down. 2.675 has the same problem for the same reason.

The third line is the other half of the trap: toFixed returns a string. '1.50' + 1 is string concatenation, giving '1.501'. If you need a number back, wrap it in Number, and better still format only at the moment of display rather than carrying formatted values around.

Neither behaviour is a bug in toFixed. Both are the stored value being visible through it.`,
    explanation: `'1.01', '2.68' is what a decimal type would give, and what everybody expects toFixed to do. It is doing round-half-up correctly; the value it is applied to is already fractionally below the half.

2.5 as the third line is toFixed read as returning a number. Then '1.50' would be 1.5 and adding 1 would give 2.5. It returns a string, which is the more expensive half of this question to get wrong, because it produces a value that still looks numeric.`,
    hints: ['Is 1.005 the value that is stored?', 'What type does toFixed return?'],
    tags: ['numbers', 'precision', 'rounding'],
  },
  {
    id: 'cart-total-cent-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A checkout occasionally rejects a valid payment: the total the client computed and the total the server computed differ by a hundredth of a penny, and the equality check fails. What is wrong, and what is the fix?',
    code: `const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

if (total !== expectedTotal) {
  throw new Error('Total mismatch')
}`,
    options: [
      'The prices are added as floats, so the total carries rounding error that depends on the order the items were summed in. Hold money as integer pennies and compare those, or compare the floats against a tolerance',
      'reduce starts from 0, which is an integer, so the first addition coerces the whole accumulator to an integer and loses the pence. Start from 0.0 so the accumulator stays a float',
      'The multiplication is the problem and the addition is exact. Sum the prices first and multiply by the total quantity at the end, which keeps every intermediate value whole',
      'The client and the server are running different JavaScript engines, and floating point results differ between engines. Compute the total in one place only, on the server',
    ],
    correctOption: 0,
    answerInFull: `Money is being added as binary floating point, so each addition rounds and the errors accumulate. The result depends on the order of the items, which is why it fails only sometimes: 0.1 + 0.2 + 0.3 is 0.6000000000000001 and 0.3 + 0.2 + 0.1 is 0.6.

The fix is to stop holding money as a float:

  const pennies = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0,
  )

  if (pennies !== expectedPennies) {
    throw new Error('Total mismatch')
  }

Every value is now an integer, every addition is exact, and the division by 100 happens once, at the edge, for display. If the prices have to stay as floats for some reason, the other option is comparing against a tolerance you can defend, such as half a penny, rather than !==.

The rule worth carrying: a value that has to compare equal after being computed by two different routes cannot be a float.`,
    explanation: `The 0 against 0.0 option is a distinction JavaScript does not have. There is one number type, 0 and 0.0 are the same value, and nothing about reduce's initial value changes the precision of what follows.

"The multiplication is the problem" has it backwards. price * quantity is one operation with one rounding step; it is the chain of additions that accumulates. Restructuring it that way would also give the wrong total for a cart with different prices.

Engines are not the difference. IEEE 754 double arithmetic is deterministic and every JavaScript engine produces the same bits for the same operations. Computing it in one place is good advice for other reasons and would not fix this, since the same code sums the same list in the same order and still drifts.`,
    hints: ['Would summing the same items in a different order give the same total?'],
    tags: ['numbers', 'precision', 'money'],
  },
  {
    id: 'max-safe-integer',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does Number.MAX_SAFE_INTEGER mean, and what happens above it?',
    options: [
      'It is the largest number a number can hold. Anything larger becomes Infinity, so an overflow is at least visible',
      'It is the largest integer that can be stored exactly. Above it, doubles are spaced more than one apart, so some integers cannot be represented and arithmetic silently gives a nearby value instead',
      'It is the largest integer a for loop counter can safely reach. Above it the loop still works, but the increment slows down as each step needs more bits',
      'It is the largest integer that survives JSON serialisation. The value itself is exact past it, and only JSON.stringify truncates',
    ],
    correctOption: 1,
    answerInFull: `Number.MAX_SAFE_INTEGER is 2**53 - 1, or 9007199254740991: the largest integer for which every integer below it is also exactly representable. A double has 53 bits of significand, so past that boundary the representable values are spaced two apart, then four, and so on.

The consequence is that arithmetic stops being reliable with no signal at all:

  Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2  // true
  9007199254740993                                             // 9007199254740992

The second line is a literal changing value on its way into the program. Nothing threw and nothing warned.

Numbers keep working far past this, up to Number.MAX_VALUE around 1.8e308, and they are still exact for many values. What stops at MAX_SAFE_INTEGER is the guarantee that every integer is distinct from every other one.

Where it bites in practice: 64-bit database ids, snowflake ids and nanosecond timestamps all exceed it, and JSON.parse rounds them without complaint. Ask the API to send them as strings, or use bigint.`,
    explanation: `Infinity is Number.MAX_VALUE's boundary, not this one, and it is around 1.8e308. Between the two boundaries numbers work fine, they just cannot represent every integer.

The for loop option imagines arbitrary precision that gets slower. Doubles are fixed width: the precision does not grow, it is spent on a larger exponent instead.

The JSON option gets the symptom that people meet most often and blames the wrong layer. JSON.parse produces a rounded value because number is a double; the text it parsed had the right digits in it.`,
    hints: ['How many bits does a double have for the significand?'],
    tags: ['numbers', 'precision', 'bigint'],
  },
  {
    id: 'bigint-mixing-throws',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `console.log(5n / 2n)
console.log(1n == 1)
console.log(1n === 1)
console.log(1n + 1)`,
    options: [
      '2.5n, true, false, then a TypeError',
      '2n, true, false, then a TypeError',
      '2n, true, true, 2n',
      '2n, false, false, then a TypeError',
    ],
    correctOption: 1,
    answerInFull: `2n
true
false
TypeError: Cannot mix BigInt and other types, use explicit conversions

bigint division truncates towards zero, because bigint is integers and nothing else. There is no 2.5n.

== converts, and it will convert across the bigint boundary for a comparison, so 1n == 1 is true. === compares type as well as value and bigint is a different type from number, so it is false.

Arithmetic is the one place the language refuses. Mixing bigint and number in + throws rather than converting, because either conversion loses something: turning the bigint into a number can lose precision, and turning the number into a bigint loses a fraction. Everywhere else JavaScript guesses; here it would rather stop.

To mix on purpose, convert explicitly: BigInt(1) + 1n, or Number(1n) + 1. The second one is the lossy direction, so it belongs at the edge where the value leaves.`,
    explanation: `2.5n is bigint read as "number, but bigger". It holds integers only, and division truncates rather than promoting to a fraction.

"true, true" for both comparisons is === read as being about value alone. It compares type first, and bigint and number are different types, which is exactly the distinction that makes the fourth line throw.

"false" for 1n == 1 is the rule from the fourth line applied to the second. == does convert across the boundary; it is only arithmetic that refuses.`,
    hints: ['Does bigint have a fractional part?', 'Which conversion would + have to choose?'],
    tags: ['bigint', 'numbers'],
  },
  {
    id: 'float-accumulation-in-a-loop',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `let total = 0
for (let i = 0; i < 10; i += 1) {
  total += 0.1
}
console.log(total === 1)
console.log(Math.floor((0.1 + 0.7) * 10))`,
    options: ['true, 8', 'false, 8', 'true, 7', 'false, 7'],
    correctOption: 3,
    answerInFull: `false
7

Adding a tenth ten times gives 0.9999999999999999, not 1. Each addition rounds to the nearest double and the errors accumulate in one direction, so the further a loop runs the further it drifts.

The second line is the more dangerous shape, because everything about it looks right. 0.1 + 0.7 is 0.7999999999999999, multiplying by 10 gives 7.999999999999999, and Math.floor truncates it to 7. The value is correct to fifteen significant digits and the floor is off by one.

That is the general lesson: a small error is harmless right up until an operation with a cliff in it. floor, ceil, truncation, a comparison, an array index. Round before you truncate, or hold the value as an integer from the start.`,
    explanation: `true for the loop is the answer if you assume the errors cancel. They do not: rounding to the nearest double biases the same way every time for this value, so ten additions drift ten times.

8 for the second line is the arithmetic done in decimal, where (0.1 + 0.7) * 10 is exactly 8 and flooring it changes nothing. The stored value is a hair below 8, and floor is the operation that turns a hair into a whole unit.`,
    hints: [
      'What does 0.1 + 0.7 actually store?',
      'What does Math.floor do to a value just below 8?',
    ],
    tags: ['numbers', 'precision'],
  },
  {
    id: 'math-round-negative-halves',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `console.log(Math.round(1.5))
console.log(Math.round(-1.5))
console.log(Math.round(2.5))`,
    options: ['2, -2, 3', '2, -1, 3', '2, -2, 2', '1, -1, 2'],
    correctOption: 1,
    answerInFull: `2
-1
3

Math.round rounds a half towards positive infinity, not away from zero. So 1.5 goes to 2, 2.5 goes to 3, and -1.5 goes to -1 rather than -2.

If you want half away from zero, which is what most people mean by rounding and what most accounting rules require, you have to write it:

  const roundHalfAwayFromZero = (n) => Math.sign(n) * Math.round(Math.abs(n))

One more edge worth knowing: Math.round(-0.5) is -0. It prints as -0, it is falsy, and it is === to 0, so it usually causes no trouble and occasionally causes a very confusing one.`,
    explanation: `2, -2, 3 is half-away-from-zero, which is the rule people assume and the rule most other languages' round uses by default. JavaScript picked towards positive infinity, so the negative case is the one that differs.

2, -2, 2 is banker's rounding, round-half-to-even, which is what many currency systems specify and what Python's round does. Math.round does not implement it, and if you need it you write it.

1, -1, 2 rounds every half down, which would be Math.floor with extra steps.`,
    hints: ['Which direction is "up" for a negative number?'],
    tags: ['numbers', 'rounding'],
  },
  {
    id: 'representing-money',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'You are adding invoicing to a system that currently stores every amount as a JavaScript number of pounds. How would you represent money from here, and what would you have to change?',
    answerInFull: `The representation I would choose is integer minor units: every amount is a whole number of pennies, stored as an integer column and carried through the code as a number, never as a decimal fraction of a pound.

Why that and not the alternatives:
- Floats are wrong for money because two totals computed by different routes do not compare equal, and the error depends on the order of the additions. Invoicing reconciles totals, so that failure is guaranteed rather than possible.
- A decimal library is the right answer instead of pennies when there is real division: tax splits, per-unit rates with more than two places, currency conversion. It costs a dependency and a wrapper type on every amount, so I would reach for it when the arithmetic needs it rather than by default.
- bigint is integer minor units with a larger ceiling. Pennies fit in a safe integer up to about ninety trillion pounds, so it buys nothing here and costs JSON serialisation and every Math function.

What has to change:
- The database column, from a float type to an integer, with a migration that multiplies by 100 and rounds. That migration is the risky part, since the existing values already carry error.
- The boundaries. Convert to pennies once on the way in, and divide by 100 once on the way out, formatted with Intl.NumberFormat so the symbol and grouping are right for the locale.
- The type. A bare number of pennies is indistinguishable from a number of pounds at a call site, so I would name it, either a branded type or a small Money object, so that passing pounds where pennies are expected is a compile error rather than a hundred-fold bug.
- Rounding has to become a decision rather than a default. Where a calculation cannot land on a whole penny, such as splitting a total three ways, the rule for where the remaining penny goes has to be written down and tested, because it is the kind of thing an auditor asks about.

What I would worry about: the existing data. Every stored float is already the nearest double to the amount somebody meant, so the migration is choosing a rounding rule for historical records, and totals that were reconciled under the old code may not reconcile under the new. I would run the conversion against a copy first and report every row where the pennies do not round-trip.`,
    explanation: `The general principle is that precision is a property of the representation, not of the arithmetic. You cannot make float addition exact, so the answer is always to change what is stored rather than to be more careful at the call sites.

Two things separate a good answer here from a recited one. The first is naming what integer pennies do not solve, which is division, and saying when a decimal library earns its place. The second is treating the migration of existing data as the hard part, because it is: the code change is mechanical and the historical values are not.`,
    hints: ['What breaks first when two systems each compute a total and compare them?'],
    tags: ['numbers', 'money', 'precision'],
  },
  {
    id: 'when-is-a-float-fine',
    type: 'interview',
    form: 'choice',
    tier: 'senior',
    prompt: 'When is a floating point number the right representation, and when is it not?',
    options: [
      'Floats are fine for anything that is not money. Money is the one case with a legal requirement behind it, and everything else tolerates a rounding error at the sixteenth digit',
      'Floats are fine for measurements, which are approximate before they reach you. They are wrong for counts of exact things, for identifiers, and anywhere two values computed by different routes have to compare equal',
      'Floats are fine wherever you round the result before showing it. The error only becomes visible through display, so formatting at the edge removes the problem in every case',
      'Floats are never the right representation for anything with a fractional part. Any decimal value should be a decimal library or an integer of minor units, and floats are for whole numbers only',
    ],
    correctOption: 1,
    answerInFull: `Floats are the right representation for measurements: positions, durations, weights, temperatures, physics, statistics, anything that was already approximate before it reached the program. A rounding error at the sixteenth significant digit is far below the error already in the measurement, and the range and speed a double buys are worth having.

They are the wrong representation in three cases:
- Counts of exact things, money above all. The values look small and well behaved and the errors are invisible until a total is reconciled.
- Identifiers, where the failure is not a rounding error but a collision. Past Number.MAX_SAFE_INTEGER two different ids can land on the same double.
- Anywhere two values computed by different routes have to compare equal, whatever the domain. The order of operations changes the result, so equality is not stable.

The framing an interviewer is listening for is that this is about the data rather than about the arithmetic. Ask whether the value is a measurement or a count, and whether anything downstream compares it for equality. That decides it in almost every case.`,
    explanation: `"Anything that is not money" gets the most famous case and misses the sharper one. An id past a safe integer fails differently and worse: two records become the same record, and no amount of rounding recovers them.

"Round before showing it" treats a representation problem as a display problem. Formatting hides drift in the last digit and does nothing for a floor that comes out one too low, or for a comparison against a total from another system.

"Never for anything fractional" throws away the case floats are actually good at. A weight or a duration in a float is correct, cheap and universally understood, and an integer of minor units would be a worse representation for it.`,
    hints: [],
    tags: ['numbers', 'precision', 'money'],
  },
]
