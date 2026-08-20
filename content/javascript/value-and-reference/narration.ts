import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Two variables can hold the same object, and changing one appears to
      change both. That is not a quirk. It is the only way objects could work
      without copying them on every single assignment. The bugs come from not
      knowing which of your variables are sharing.

      This is also the topic underneath every state management library you have
      ever used. Return a new object instead of mutating the old one is advice
      that only makes sense once you know what identity means, and what strict
      equality actually compares when both sides are objects.`,
  },
  {
    title: 'What a variable holds',
    heading: 'What a variable holds',
    script: `A variable holding a primitive holds the value itself. A variable
      holding an object does not hold the object. It holds a reference to it.
      The object lives somewhere else, and any number of variables can point at
      the same one.

      So when you assign one object variable to another, what gets copied is the
      reference. There is still exactly one object.

      Now hold two operations apart in your head, because they look similar and
      they are not. Mutating, which means setting a property on the object,
      changes the object that everybody can see. Reassigning, which means
      pointing the variable at a brand new object, changes only that one
      variable and leaves the original object untouched. Confusing those two is
      most of the bugs in this topic.`,
  },
  {
    title: 'Arguments work exactly the same way',
    heading: 'Arguments work the same way',
    script: `JavaScript is pass by value. Always. There is no exception.

      What makes people say otherwise is that the value passed for an object
      happens to be a reference. So a function can mutate its argument and the
      caller sees it, because both are looking at the same object. But a
      function cannot replace its argument. Assigning a new object to the
      parameter just repoints the local name, and the caller sees nothing.

      Some people call this pass by sharing, which is a clearer name for the
      same mechanic. And here is the test that settles it. If the language were
      genuinely pass by reference, reassigning the parameter would be visible to
      the caller. It is not. So it is not pass by reference.`,
  },
  {
    title: 'Identity, not contents',
    heading: 'Identity, not contents',
    script: `Strict equality on objects asks one question: is this the same
      object? It never asks whether two objects look alike. Two separately
      created arrays holding one and two are not equal, and never will be.

      That is not a limitation, it is what makes several things fast. Set
      members, Map keys, weak map lookups and React's render checks all compare
      identity, which is a pointer comparison, rather than walking two
      structures.

      If you do want to compare contents, you have to decide how deep to go, and
      what to do about not a number, about key order, about undefined values,
      and about prototypes. That is exactly why every codebase either imports a
      deep equality function or writes a narrow one for its own shapes. There is
      no single right answer, which is why the language does not pick one.`,
  },
  {
    title: 'How deep is a copy',
    heading: 'How deep is a copy',
    script: `Spread and Object dot assign copy one level. Everything nested is
      still shared. So spreading a settings object gives you a new outer object
      whose nested timeout object is the very same one as before, and changing a
      field inside it changes both.

      For a genuine deep copy, structured clone is the built in answer. It
      handles nested objects, arrays, dates, maps, sets, regular expressions,
      and even cycles. It has two limits. It throws on functions, and it
      produces plain objects rather than instances, because the prototype is not
      carried across.

      The old trick of stringifying to JSON and parsing it back is lossy in ways
      that bite quietly. Undefined values and functions disappear entirely.
      Dates become strings. Maps and sets become empty objects. Not a number and
      infinity become null. And a cycle throws.

      Most of the time, though, the right answer is neither. Copy the level you
      are changing and share the rest. That is what an immutable update is, and
      it is far cheaper than cloning a whole tree to change one field.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked whether JavaScript is pass by value or pass by reference, the
      answer is pass by value. Then immediately add the clause that shows you
      understand it. For objects the value is a reference, so mutations are
      visible to the caller and reassignments are not. Saying pass by reference
      without that distinction is exactly what the interviewer is listening for.

      Asked how you would check whether two objects are equal, do not jump to a
      library. Start by asking what equal means for this data. Then say what you
      would use and why, and name the trade off. Comparing stringified JSON is
      fine for plain, key ordered, JSON safe data, and it is wrong the moment
      any of those three assumptions breaks.`,
  },
]
