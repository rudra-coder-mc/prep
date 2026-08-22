import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `JSON is the format every API speaks, every config file is written in,
      and every local storage value is stored as. It is also a strict subset
      of what a JavaScript value can be, and stringify gets from one to the
      other by quietly dropping, converting or nulling whatever does not fit.
      Most of the time that is invisible. The rest of the time a date comes
      back as a string, a map comes back as an empty object, an undefined
      disappears, and a sixty four bit id is off by three.

      The rules are mechanical and short. Knowing them is what separates JSON
      serialisation is fine from knowing exactly which values in your state
      will not survive a round trip, and having a hook ready for each one.`,
  },
  {
    title: 'What stringify keeps',
    heading: 'What `stringify` keeps',
    script: `Stringify walks own enumerable string keyed properties, the same set
      Object keys lists, and applies one rule per value.

      Strings, finite numbers, booleans and null are written as themselves.
      Undefined, functions and symbols are dropped from an object, and become
      null inside an array, because an array cannot lose a position. Not a
      number and infinity become null. An object with a toJSON method is
      replaced by whatever that returns, and Date has one, which is why dates
      come out as ISO strings. Any other object is written from its own
      enumerable properties, and a Map or a Set has none, because their
      entries live in internal slots, so they serialise as an empty object.

      Two things cannot be written at all. A BigInt throws, and a structure
      that refers back to itself throws.

      Follow the walkthrough and count. Six properties go in, four keys come
      out, and two of those four mean something different from what went in.
      Nothing warned you about any of it.`,
  },
  {
    title: 'toJSON and the replacer',
    heading: '`toJSON` and the replacer',
    script: `Two hooks change what stringify writes, and they run in a fixed order
      for each value: toJSON first, then the replacer.

      toJSON is a method on the value. If it exists, stringify calls it and
      serialises the return value instead of the object. It is how a class
      decides what its instances look like on the wire. A money class can
      serialise as a formatted string rather than as a pair of fields.

      The replacer is the second argument to stringify. As a function it is
      called for every key and value, including the root with an empty string
      as its key, and its return value is what gets written. Return undefined
      and the property is dropped. As an array of strings it is an allow list
      of keys to include, at every level.

      The third argument is indentation. Passing null and then two is the
      usual form. Passing two as the second argument is the usual mistake,
      which puts the number in the replacer slot where it is silently ignored.`,
  },
  {
    title: 'parse and the reviver',
    heading: '`parse` and the reviver',
    script: `Parse is strict. Trailing commas, comments, single quotes and unquoted
      keys all throw. It produces plain objects and arrays with strings,
      numbers, booleans and null in them, and nothing else. Whatever a date
      was on the way in, it is a string on the way out.

      The reviver is the second argument. It is called for every key and
      value, from the innermost values outward, with the root last under an
      empty string key, and its return value replaces the parsed value. That
      inside out order matters: by the time the reviver sees an object, its
      children have already been revived. It is where a tagged date comes
      back to life.

      One safety property worth knowing. If the text contains a key literally
      named underscore underscore proto, parse creates an own property with
      that name. It does not set the prototype. It is copying the parsed keys
      into another object with a loop that turns that into prototype
      pollution, not parse itself.`,
  },
  {
    title: 'What does not round trip',
    heading: 'What does not round-trip',
    script: `Stringify then parse is the oldest deep copy trick, and it is lossy in
      a fixed list of ways. Undefined properties vanish. Undefined in an array
      becomes null. Functions and symbols vanish. Not a number and infinity
      become null. Negative zero becomes zero. Dates become strings. Maps,
      sets, regular expressions and errors become empty objects. Class
      instances become plain objects with no prototype. BigInts throw. Cycles
      throw. And an integer above two to the fifty three is rounded to the
      nearest double, silently.

      That last one is the one that reaches production. A sixty four bit id
      from a backend parses to a nearby number, and parse has no option to do
      otherwise. The fix is to send ids as strings.

      For a copy, structured clone handles every row on that list except
      functions and class prototypes. For transport, the rule is to serialise
      what JSON can hold, and tag what it cannot, with a reviver that knows
      the tags.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what stringify does with undefined, say it drops the property
      from an object and writes null in an array. Then give the neighbours:
      functions and symbols go the same way, not a number and infinity become
      null, and dates become strings through toJSON. Listing those without
      being asked is what shows you have been bitten by each one.

      Asked whether stringify then parse is a deep copy, say it is a lossy
      one. It copies plain data deeply and loses dates, maps, sets, undefined,
      functions, prototypes and precision above two to the fifty three, and
      it throws on cycles and BigInts. Then name structured clone as the built
      in that does the job properly.`,
  },
]
