import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'One decision from nineteen ninety five',
    heading: 'Why this matters',
    script: `The length of a thumbs up emoji is two. Reversing a name by
      splitting on the empty string can produce a row of replacement characters.
      And two strings that display identically, both typed by a user as the word
      cafe with an accent on the e, can be unequal, so a search finds nothing and
      a uniqueness check lets a duplicate through.

      None of that is a quirk. It is one design decision showing through. A
      JavaScript string is a sequence of UTF sixteen code units, and a code unit
      is not a character. Most string code never notices, and the code that does
      notice is usually handling somebody's name.`,
  },
  {
    title: 'Three units of length',
    heading: 'A string is a sequence of UTF-16 code units',
    script: `A code unit is sixteen bits. Unicode has more than sixteen bits
      worth of code points, so anything above the sixteen bit ceiling is stored
      as two code units, called a surrogate pair. Length, indexing, charAt,
      charCodeAt, slice and substring all count and cut in code units.

      There are three units of length and they answer different questions. Code
      units, which length reports and which storage and slicing use. Code points,
      which is what Unicode assigns a number to, and what code point at, a regex
      with the u flag, and iteration work in. And grapheme clusters, which is
      what a reader would call a character.

      A family emoji makes the difference concrete. It is one grapheme, five code
      points and eight code units, because it is several people joined by zero
      width joiners. Only the internationalisation segmenter counts graphemes.

      So if somebody asks how long a string is, the correct first move is to ask
      which of the three the answer is for.`,
  },
  {
    title: 'What iterating fixes, and what it does not',
    heading: 'Iterating fixes most of it',
    script: `Anything that iterates a string walks it by code point rather than
      by code unit. That is for of, spread, Array from, and every regular
      expression with the u flag.

      Splitting on the empty string cuts between code units, so a surrogate pair
      is torn in half and you get two broken halves, neither of which renders on
      its own. Spread keeps the pair together, so the array has one entry for the
      emoji and reversing it is safe.

      But iterating is not a complete fix, because it stops at code points. A
      family emoji or a flag reversed by code point still comes out wrong, and an
      accent written as a separate combining mark ends up attached to the wrong
      letter. For those, the segmenter with grapheme granularity is the only
      correct answer.

      Which is the honest reason reversing a string is an interview exercise
      rather than a requirement. There is no unit of reversal that is right for
      every script.`,
  },
  {
    title: 'Templates, and what interpolation converts with',
    heading: 'Template literals',
    script: `Backticks give you interpolation, real newlines and nesting, and
      every embedded expression is converted with String.

      Two things worth knowing. Interpolating a plain object gives you the text
      object Object, because String calls toString and the one every object
      inherits says only what kind of thing it is. In a log line that is almost
      never what you wanted, so stringify it as JSON instead. An array is the
      confusing middle case, because its toString joins with commas, so a list of
      identifiers interpolates as something that looks fine right up until one
      entry is an object.

      And a template literal preserves the indentation of the source file, so a
      multi line template inside an indented function carries that whitespace
      into the string.`,
  },
  {
    title: 'What a tag actually receives',
    heading: 'Tagged templates',
    script: `Putting a function in front of a template calls it with the literal
      parts and the interpolated values kept apart. The first argument is an
      array of the text between and around the holes, and the rest are the
      values.

      There is always exactly one more literal part than there are values,
      because the parts surround the holes. A template that begins or ends with
      an interpolation gets an empty string at that end, which is what keeps the
      count consistent.

      The point is that a tag can see which text the developer wrote and which
      came from a variable, and that is what makes tagged templates the right
      tool for escaping. An HTML tag escapes every value and leaves the literal
      parts alone. A SQL tag turns every value into a bound parameter, so an
      injection is impossible by construction rather than by discipline. The
      graphql, css and sql tags you have seen are all this.

      The first argument also carries a raw property, holding the text before
      escape sequences were processed. That is what String dot raw exposes.`,
  },
  {
    title: 'The same text, spelled two ways',
    heading: 'Normalisation',
    script: `Unicode can spell the same text more than one way. The word cafe
      with an accent is either four code points, ending in a single letter e
      acute, or five, ending in a plain e followed by a combining acute accent.
      They render identically and they are different strings.

      Which form you get depends on the operating system, the keyboard and the
      source of the data. Mac filenames are decomposed, most web input is
      composed, and a paste out of a PDF can be either.

      Normalise converts between them. Normalise on the way in, once, and compare
      normalised strings after that. N F C composes, and it is the right default
      for storage and comparison. N F D decomposes, which is how you strip
      accents, by removing the combining marks afterwards. N F K C and N F K D
      also fold compatibility characters, turning a circled digit into a plain
      one and the f i ligature into two letters. That is what you want for a
      search index and not what you want for a name you will display back.`,
  },
  {
    title: 'Comparing, sorting, and the interview answer',
    heading: 'Comparing and sorting',
    script: `Strict equality on strings compares code units, which makes it
      exact, fast and completely unaware of language. Sorting with no comparator
      inherits that. Capital Z is ninety and lower case a is ninety seven, so
      every capital sorts before every lower case letter, and an accented capital
      A is one hundred and ninety six, so it lands after both. No address book in
      the world sorts that way.

      Locale compare is the comparator that knows about language, and for a long
      list, the internationalisation collator is the same rules with the setup
      done once instead of on every comparison. Locale compare also takes
      options, and sensitivity base is the one worth remembering. It treats case
      and accent differences as equal, which gives you a case insensitive and
      accent insensitive comparison without butchering the string first.

      Two questions to expect. How do you count the characters in a string:
      answer with a question back about which unit, then give the consequence,
      which is that a two hundred and eighty character limit measured in code
      units charges an emoji twice. And, two strings look the same and are not
      equal, what do you check: normalisation first, then invisible characters,
      a zero width space or a non breaking space pasted from a document. Mapping
      both strings to their code points shows you the difference in one line.`,
  },
]
