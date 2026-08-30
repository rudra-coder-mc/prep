import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Every interview has a moment where you reach for an array method, and
      the interviewer is watching for two things: whether you pick the one
      that says what you mean, and whether you know what it does to the array
      you called it on. Sorting in place an array you do not own. Using map
      where forEach was meant. Searching for not a number with indexOf. None
      of these are obscure. They are the things that go wrong with the dozen
      methods everyone uses every day.

      The previous topic showed that these methods are ordinary higher order
      functions. This one is the catalogue: what each returns, which ones
      change the array under you, and the four edges that keep coming up.`,
  },
  {
    title: 'Mutate or copy',
    heading: 'Mutate or copy',
    script: `Every array method falls on one side of a line, and the line is the
      first thing to know about any of them.

      Nine methods change the array they are called on: push, pop, shift,
      unshift, splice, sort, reverse, fill and copyWithin. Most of them return
      something other than the array. Push returns the new length, pop and
      shift return the removed element, splice returns what it removed. But
      sort and reverse return the very array they just changed, which is what
      makes assigning the result of sort to a new name look like a copy when
      it is an alias.

      Everything else returns a new value and leaves the original alone. Map,
      filter, slice, concat, flat, the find family, includes, join. And the
      newer toSorted, toReversed, toSpliced and with, which exist precisely
      to give the mutating ones a copying twin.

      Look at the memory picture. Sort reorders the elements of the one array
      and hands back a reference to it. Whoever passed that array in now has
      a sorted one without being told. The rule for shared code is simple:
      never call a mutating method on an array you did not create in the
      same function.`,
  },
  {
    title: 'What each one returns',
    heading: 'What each one returns',
    script: `The second thing to know is the return value, because it decides what
      the next method in a chain sees.

      Map returns a new array of the same length. Filter returns the elements
      the callback said yes to. Reduce returns whatever the accumulator ends
      up as. ForEach returns undefined, always. Find returns the element or
      undefined, findIndex returns the index or minus one. Some and every
      return a boolean and stop as soon as they know.

      Two of those rows are where the errors cluster. ForEach returns
      undefined, so it cannot be chained and cannot be awaited. And map
      always returns the same length as its input, so a callback that forgets
      to return produces an array full of undefined, which is the surest sign
      that forEach was the method meant.

      Includes and indexOf differ in exactly one value. IndexOf uses strict
      equality, and strict equality says not a number is not itself, so
      indexOf never finds it. Includes uses same value zero, which treats it
      as equal. Use includes when the question is, is it in there.

      And on an empty array, some is false and every is true. No element
      fails, so every passes.`,
  },
  {
    title: 'How sort compares',
    heading: 'How `sort` compares',
    script: `Sort with no argument converts every element to a string and compares
      the strings. That is why ten, nine, one sorts to one, ten, nine: the
      string ten starts with a one, and one comes before nine.

      Numbers need a comparator, and the comparator contract is worth
      stating precisely. It is called with pairs. A negative result puts the
      first before the second, positive puts the second first, and zero says
      they are equal. Since 2019 the sort is stable, so equal elements keep
      the order they already had.

      Two ways to get it wrong. Subtracting strings gives not a number, and
      the engine treats every pair as equal, so nothing moves. Use
      localeCompare for strings. And returning a boolean, like x greater than
      y, only ever gives zero or one. It never says first before second, so
      the result depends on the engine's algorithm rather than your code.

      Stability is what lets you sort by one key and then by another and have
      ties keep the first order. The tidy way is one comparator that returns
      the first comparison, or if that is zero, the second.`,
  },
  {
    title: 'Holes, length and the edges',
    heading: 'Holes, length and the edges',
    script: `An array has a length and it has elements, and the two can disagree.
      Calling Array with a single number gives that length and no elements at
      all. The callback methods skip holes: map, forEach, filter and reduce
      never call you for one. So mapping over an empty-but-long array does
      nothing. Array dot from with a length object and a mapping function is
      the way to build a filled array.

      Three more edges that each earn one sentence in an interview. Reduce
      with no initial value uses the first element as the accumulator, and
      throws on an empty array. Pass the initial value, always. An async
      callback inside forEach fires every call at once and nothing waits,
      because forEach never looks at the returned promise. Use a for of loop
      with await inside for sequence, or Promise all over a map for parallel.
      And mapping with parseInt directly gives one, not a number, not a
      number, because map passes the index as the second argument and
      parseInt reads it as the radix.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked which methods mutate, name all nine without pausing, then say
      that sort and reverse return the same array, which is why they look
      like copies, and name the four non mutating twins.

      Asked what is wrong with sorting ten, nine, one with no comparator, say
      it sorts as strings. Then give the contract, negative, zero, positive,
      and the two ways people break it.

      Asked forEach or map, say map when you want the result and forEach
      when you want the side effect. A map whose result is thrown away
      allocates an array for nothing and tells the next reader a value was
      wanted when it was not.`,
  },
]
