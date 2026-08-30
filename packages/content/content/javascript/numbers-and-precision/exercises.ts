import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'cart-total-in-pennies',
    title: 'Total a cart without losing a penny',
    difficulty: 'medium',
    prompt:
      'Write total(items) that sums a cart and returns the amount as a formatted string, holding money as integer minor units throughout.',
    requirements: [
      'An item is { price: number, quantity: number }, where price is in pounds as it arrives from the API.',
      'Convert each price to pennies once, on the way in, and round rather than truncating.',
      'Sum in pennies. No floating point addition anywhere after the conversion.',
      "Return the total formatted with Intl.NumberFormat, so 1234.5 reads as '£1,234.50'.",
      'Prove it: three items priced 0.1, 0.2 and 0.3 must total exactly £0.60, where summing the floats directly gives 0.6000000000000001.',
    ],
  },
  {
    id: 'approximately-equal',
    title: 'Compare two floats honestly',
    difficulty: 'hard',
    prompt:
      'Write approximatelyEqual(a, b, tolerance) that decides whether two computed floats are the same number, and defaults to a relative tolerance rather than a fixed one.',
    requirements: [
      'approximatelyEqual(0.1 + 0.2, 0.3) is true, and approximatelyEqual(0.3, 0.4) is false.',
      'It stays true for the same comparison scaled up: 1e10 + 0.1 + 0.2 against 1e10 + 0.3.',
      'The default tolerance scales with the size of the operands rather than being Number.EPSILON alone.',
      'Handle the cases a relative tolerance gets wrong on its own: both operands zero, one operand zero, and NaN on either side.',
      'Say in a comment why a caller passing an absolute tolerance is sometimes the better answer.',
    ],
  },
]
