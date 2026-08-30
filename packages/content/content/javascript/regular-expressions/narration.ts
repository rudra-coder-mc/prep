import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'The densest line in the file',
    heading: 'Why this matters',
    script: `A regular expression is the densest notation in the language. One
      line of it replaces a page of string handling, and that same line is where
      a subtle bug hides longest, because nobody reads it carefully in review.

      Three things separate someone who uses regexes from someone who is caught
      out by them. Knowing that a global regex carries state between calls.
      Knowing that a greedy quantifier takes everything it can and gives back
      only under protest. And knowing when the job belongs to a parser rather
      than a pattern. Those three are also, almost exactly, the interview
      questions.`,
  },
  {
    title: 'Where the state lives',
    heading: 'Flags, and where the state lives',
    script: `Six flags are worth carrying. G matches every occurrence rather
      than the first. I ignores case. M moves the anchors, so the caret and the
      dollar match at every line break instead of only the ends of the string. S
      lets the dot match a newline, and the dot refusing a newline is the single
      most common "why did this not match". U matches by code point and unlocks
      the unicode property escapes. And Y is sticky, matching only at the exact
      position it is standing on.

      The one to internalise is that g and y make the regex object stateful. It
      grows a mutable last index property, and test and exec both read it and
      write it back. Call test twice on the same string with a shared global
      regex and you get true, then false, then true. The second call started
      searching where the first one stopped, ran off the end, failed, and the
      failure reset the counter. Hoist that regex to module scope, share it
      across a loop, and it skips every other item.

      The fixes, in order of preference. Drop the g flag when all you want is a
      yes or no, because test never needs it. Or build the regex inside the
      function, so every call starts fresh.`,
  },
  {
    title: 'Three kinds of parentheses',
    heading: 'Groups',
    script: `Parentheses do two jobs at once, grouping for a quantifier and
      capturing for later use, which is why there are three kinds of them.

      Plain parentheses do both, and the captures are numbered from one in the
      order the opening brackets appear. That numbering is fragile: add a group
      in the middle of a pattern and everything after it shifts. Question mark
      colon groups without capturing, which keeps the numbering stable when all
      you wanted was the repetition. And a named group captures under a name,
      which is the readable one. You get it back on the groups object of the
      match, and the same name works inside a replacement string.

      Two edges to have ready. A match result puts the whole match at index
      zero, with the groups after it. And a group that did not take part in the
      match comes back as undefined, not as an empty string, which matters the
      moment a group is optional.`,
  },
  {
    title: 'Taking too much, giving it back',
    heading: 'Greedy against lazy',
    script: `Every quantifier is greedy by default. It takes as much of the
      string as it can, and it gives characters back one at a time only when the
      rest of the pattern cannot match. That is why dot plus between two
      delimiters swallows everything up to the last one in the string: it ran to
      the end, then backed up just far enough to let the pattern finish.

      A question mark after the quantifier makes it lazy. Take as little as
      possible, then let the rest of the pattern ask for more. Same pattern, one
      character of difference, and the match now ends at the first delimiter
      instead of the last.

      The giving back is called backtracking, and it is where a regex spends its
      time. Lazy is not always the fix, either. Often the better pattern is a
      negated character class, match anything that is not the closing delimiter.
      That one cannot overshoot in the first place, so it never backtracks at
      all.`,
  },
  {
    title: 'Picking the method',
    heading: 'Which method you want',
    script: `Six methods, and most regex frustration is picking the wrong one.

      Test returns a boolean. Use it for a yes or no, and prefer it without the
      g flag, so it stays stateless. Match without g returns one match with its
      groups. With g it returns a flat array of matched strings and throws the
      groups away entirely. And either way it returns null when nothing matched,
      not an empty array, which is where "cannot read properties of null" comes
      from.

      Match all is usually the one you want. It returns an iterator of full
      match objects, so you get every match with its groups and its position,
      and it gives you an empty iterator rather than null when nothing matched.
      It insists on the g flag and throws without it.

      Replace and replace all both accept a function as the replacement, which
      receives the match and then each group. Exec returns one match at a time
      while advancing last index, which is the low level loop match all was
      added to replace. And split takes a regex, with the wrinkle that captures
      in it survive into the output.`,
  },
  {
    title: 'User input is code',
    heading: 'Building a pattern from user input',
    script: `A string interpolated into a pattern is code, not data. Every regex
      metacharacter in it changes what the pattern means. A dot in a search term
      matches any character, so the results are quietly wrong. An unbalanced
      bracket is a syntax error, thrown at whichever user typed it.

      The fix is to escape the input first, a backslash in front of every
      metacharacter. There is a built in for this now, but it is recent, and the
      one line version is worth being able to write from memory: replace every
      metacharacter, globally, with a backslash and the matched character
      itself.

      And when the input can be long or deeply repetitive, escaping on its own
      is not enough, because a pattern of your own can still be made to
      backtrack forever. That trap closes the lesson.`,
  },
  {
    title: 'A job for a parser',
    heading: 'When not to use one',
    script: `A regular expression matches regular languages, and most of what
      people reach for it with is not one.

      HTML, XML and JSON nest arbitrarily, and nothing that cannot count can
      match nesting. That is a parser's job, and the platform ships the parsers.
      An email address has a real grammar far larger than anyone's pattern, so
      check for one at sign with something either side and send the
      confirmation email, which is the only check that establishes what you
      actually wanted to know. A URL already has a parser built in: the URL
      constructor throws on invalid input and knows about every part you were
      about to write a capture group for. And a plain string method, starts
      with, ends with, includes, beats any regex it can replace.

      What regexes are actually for is flat text. Finding and extracting
      patterns, validating a format you defined yourself, tokenising.`,
  },
  {
    title: 'The two stories to tell',
    heading: 'The interview angle',
    script: `Two questions come back again and again.

      Why does this test return true, then false, then true? Because the regex
      is global, so it carries last index between calls. Say the fix in the same
      breath: drop the g flag for a boolean test, or stop sharing the object.

      And what is wrong with the word list validator? Nested quantifiers over
      overlapping alternatives. On input that fails to match, the engine has to
      try every way of splitting the string between the inner and the outer
      repetition before it can give up, and the number of ways roughly doubles
      with each extra character. Twenty six characters is seconds. A few more is
      minutes. That is catastrophic backtracking, and when the string arrives in
      a request, it is a denial of service in one line. The rewrite makes the
      split unambiguous, so there is only one way to consume any input, and a
      length bound before matching is the seatbelt on top.

      The deeper point either question lets you make: a regex looks declarative,
      but it runs as a search, and the cost lives in backtracking you cannot see
      from the pattern.`,
  },
]
