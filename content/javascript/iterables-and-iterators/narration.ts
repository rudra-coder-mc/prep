import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `The for of loop, spread, Array dot from, array destructuring, Promise
      all, building a Map from pairs. None of these know what an array is.
      They all speak one protocol, and anything that implements it works with
      all of them. That is why you can spread a Map, destructure a string,
      and loop over a NodeList, and it is why you cannot spread a plain
      object into an array.

      Interviewers ask about it because it separates people who have used
      the features from people who know why they work, and because make this
      object iterable is a ten line task that shows whether you can read a
      contract and implement it.`,
  },
  {
    title: 'Two objects, two methods',
    heading: 'Two objects, two methods',
    script: `The protocol has two halves, and most confusion comes from mixing
      them up.

      An iterable is any object with a method stored under the well known
      symbol, Symbol dot iterator. Calling that method returns an iterator.

      An iterator is any object with a next method that returns an object
      with two fields, value and done. Each call moves one step. When done is
      true, the consumer stops.

      The walkthrough does by hand what for of does for you. Ask the
      iterable for an iterator. Call next. While done is false, run the body
      with the value and call next again. An array hands out a fresh iterator
      every time it is asked, which is why you can loop the same array twice.

      The two roles are usually separate objects, but the built in iterators
      also implement Symbol dot iterator by returning themselves, so an
      iterator can be passed anywhere an iterable is expected. That is what
      lets you loop directly over map dot keys. The cost is that an iterator
      is one shot. Used as an iterable, it can be looped exactly once.`,
  },
  {
    title: 'What is iterable',
    heading: 'What is iterable',
    script: `Arrays, strings, Maps, Sets, typed arrays, the arguments object,
      NodeLists, and every generator object. A string iterates by code point,
      not by code unit, which is the one place where spreading a string and
      splitting it on the empty string disagree: an emoji is one element in
      the first and two in the second.

      Plain objects are not iterable. A for of loop over one throws, and so
      does spreading one into an array. Object spread inside curly braces is
      a different feature entirely. It copies own enumerable properties and
      has nothing to do with this protocol. To iterate an object, you choose
      what you mean: Object keys, Object values or Object entries, each of
      which returns a real array.

      That is also the answer to the for in question. For in walks
      enumerable string keys, including inherited ones. On an array it gives
      you index strings plus anything someone added to the array prototype.
      For of walks the values an iterable produces. They look similar on an
      array and they are doing different things, and for in on an array is
      almost always a bug.`,
  },
  {
    title: 'Making one',
    heading: 'Making one',
    script: `An object becomes iterable the moment it has the method. The
      contract is small enough to write from memory. A range class with a
      from and a to. Its Symbol dot iterator method declares a current
      counter, starting at from, and returns an object whose next method
      either hands back the current value and moves on, or says done.

      Two things in that shape are not accidents. The counter lives inside
      the Symbol dot iterator call, not on the instance, so every call starts
      a fresh sequence and the range can be iterated twice. And next is an
      arrow function, so if it is ever detached and called on its own it
      still closes over the counter.

      The next topic shows that a generator writes the same thing in three
      lines. Knowing the long form is what tells you what those three lines
      do.`,
  },
  {
    title: 'Stopping early',
    heading: 'Stopping early',
    script: `A consumer does not always read to the end. Break, return, an error
      thrown inside the loop body, and destructuring that takes two elements
      out of a thousand all leave the sequence unfinished. For a range that
      is fine. For an iterator holding a file handle, a database cursor or a
      lock, it is a leak.

      So the protocol has an optional third method, called return. If the
      iterator has it, every built in consumer calls it on early exit, and
      only on early exit. When the sequence finishes normally it is not
      called, because the iterator already knows it is done.

      For of, spread, destructuring, Array from, Promise all and yield star
      all honour it. Calling next by hand does not, which is the one place
      cleanup is your own responsibility. Generators implement return for
      you and run any finally blocks, which the next topic covers.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what makes something work with for of, say a Symbol dot
      iterator method that returns an object with next, returning value and
      done. Then name three built ins that have it, and the one common thing
      that does not: a plain object.

      Asked for in versus for of, say for in walks enumerable property keys,
      including inherited ones, as strings, and for of walks an iterable's
      values. Never use for in on an array.

      Asked to make an object iterable, write the method, keep the state
      inside it so the object can be iterated twice, and mention return if
      the sequence holds a resource. Then say a generator is the short way,
      and write that too.`,
  },
]
