import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'greedy-takes-the-longest-match',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const text = 'she said "let it go" and "hold on"'
console.log(text.match(/".+"/)[0])
console.log(text.match(/".+?"/)[0])`,
    options: [
      `'"let it go"' then '"let it go"'`,
      `'"let it go" and "hold on"' then '" and "'`,
      `'"let it go" and "hold on"' then '"let it go"'`,
      `'"let it go" and "hold on"' then '"let it go" and "hold on"'`,
    ],
    correctOption: 2,
    answerInFull: `"let it go" and "hold on"
"let it go"

A quantifier is greedy by default. In the first pattern, .+ takes everything from the opening quote to the end of the string, then gives characters back one at a time until the rest of the pattern can match. The first place it can stop is the last quote in the string, so the match runs from the first quote to the last one and swallows everything between them.

The ? after the + makes it lazy: take as little as possible, then let the rest of the pattern ask for more. It stops at the first closing quote it can, so the match is the first quoted phrase alone.

The pattern that says what was actually meant is /"[^"]+"/. A negated character class cannot cross a quote in the first place, so it never overshoots and never backtracks.`,
    explanation: `Both lines as '"let it go"' is greedy read as sensible: surely the match stops at the first closing quote. Greedy means it stops at the last one it can.

'" and "' is lazy read as finding the shortest quoted substring anywhere in the string. Lazy changes how much a match takes, not where it starts: the match still begins at the earliest possible position, which is the first quote.

Both lines as the long match reads the ? as decoration. It is the difference between the two lines.`,
    hints: ['Where does a greedy .+ stop giving characters back?'],
    tags: ['regex', 'greedy', 'backtracking'],
  },
  {
    id: 'shared-global-regex-skips',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This validator rejects every other valid code in the list. What is wrong, and what is the fix?',
    code: `const CODE = /^[A-Z]{3}-\\d{4}$/g

function isValid(code) {
  return CODE.test(code)
}

console.log(['AAA-1111', 'BBB-2222', 'CCC-3333'].filter(isValid))
// ['AAA-1111', 'CCC-3333']`,
    options: [
      'The g flag makes the regex stateful: test starts searching from lastIndex, which the previous call left at the end of the match. Drop the g flag, which a boolean test never needs, or build the regex inside the function',
      'test caches its result per regex object, so the second call replays a stale failure. Use match instead, which does not cache',
      'The regex is compiled once at module scope, so it is bound to the first string it ever sees. Recompile with new RegExp on every call',
      'filter passes the index and the array as extra arguments and test reads the second one as a start position. Wrap the call: code => CODE.test(code)',
    ],
    correctOption: 0,
    answerInFull: `The g flag gives the regex object a mutable lastIndex, and test both reads it and writes it back. The first call matches 'AAA-1111' and leaves lastIndex at 8. The second call starts searching 'BBB-2222' from index 8, finds nothing, fails, and the failure resets lastIndex to 0. The third call succeeds again, and the pattern repeats: with a shared global regex, every other call fails.

The fix is to drop the g flag:

  const CODE = /^[A-Z]{3}-\\d{4}$/

test answers whether the string matches at all, so it never needs g. Global matching exists for finding every occurrence, and a validator wants exactly one answer about the whole string.

The general rule: g and y are the two flags that make a regex carry state, and a stateful object shared across calls is a bug waiting for a loop. If a pattern genuinely needs g, create it where it is used, or reset lastIndex before each use.`,
    explanation: `The caching option invents a mechanism that does not exist, and it is tempting because the symptom looks exactly like a stale result being replayed. The state is real, it is just lastIndex rather than a cache.

The recompile option lands on a fix that works for the wrong reason. new RegExp per call does stop the skipping, because each call gets a fresh lastIndex, not because compilation binds a regex to a string.

The extra-arguments option is the parseInt-in-map trap applied where it does not exist. test takes one argument and ignores the rest, and isValid already takes only the code.`,
    hints: ['What does the first successful call leave behind on the regex object?'],
    tags: ['regex', 'lastindex', 'flags'],
  },
  {
    id: 'exec-moves-lastindex-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const re = /\\d+/g
const text = 'a1b22c333'
let match
while ((match = re.exec(text)) !== null) {
  console.log(match[0], re.lastIndex)
}
console.log(re.lastIndex)`,
    items: ['1 1', '1 2', '22 5', '9', '22 3', '333 9', '0'],
    correctOrder: [1, 2, 5, 6],
    answerInFull: `1 2
22 5
333 9
0

Each successful exec returns one match and advances lastIndex to the position just after it. '1' sits at index 1, so after matching it lastIndex is 2. '22' starts at index 3 and ends before 5, '333' starts at 6 and ends before 9.

The fourth line is the one that separates knowing exec from having used it. When exec finds nothing, it returns null, which ends the loop, and the failure resets lastIndex to 0. So the value printed after the loop is 0, not 9: the regex is ready to start over, which is the same reset that makes a shared global regex alternate between true and false.`,
    explanation: `'1 1' and '22 3' are the match.index values, where each match starts. lastIndex is where the next search will begin, which is the position after the match ends.

'9' is the loop read as leaving lastIndex where the last match put it. The extra, failing exec call is what ends the loop, and failure is what resets the counter.`,
    hints: [
      'Does lastIndex point at the start of the match or past its end?',
      'What does the exec call that returns null do to lastIndex?',
    ],
    tags: ['regex', 'lastindex', 'exec'],
  },
  {
    id: 'non-capturing-groups',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'In /(?:ab)+(c)/, what does the ?: in the first group do?',
    options: [
      'Makes the group optional, so the pattern also matches a lone c',
      'Groups ab so the + repeats both letters, without creating a capture. The (c) is group 1',
      'Makes the + lazy, repeating as few times as possible',
      'Makes the group atomic, so the engine never backtracks into it',
    ],
    correctOption: 1,
    answerInFull: `Parentheses do two jobs at once, grouping for a quantifier and capturing for later use, which is why there are three kinds. Plain (ab) does both. (?:ab) does only the grouping: the + still repeats the pair, and no capture is created, so (c) is group 1 rather than group 2.

Captures are numbered by the position of the opening parenthesis, so adding or removing a group in the middle of a pattern renumbers everything after it, and every $1 or match[2] that referred to the old numbering silently refers to something else. Marking a group non-capturing when you only wanted the repetition keeps the numbering stable.

The better answer to that fragility is a named group, (?<name>...), which is read back as match.groups.name and as $<name> in a replacement, and does not care what sits before it in the pattern.`,
    explanation: `Optional is a ? after the group, (ab)?, not inside its opening bracket. The position changes the meaning entirely.

Lazy is a ? after a quantifier, +?. This pattern's + is greedy.

Atomic groups are real, written (?>...) in engines that have them, and JavaScript is not one of them. It is the option for someone arriving from another regex flavour.`,
    hints: ['Parentheses do two different jobs. Which one does ?: switch off?'],
    tags: ['regex', 'groups'],
  },
  {
    id: 'match-returns-null',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'This works until somebody passes a string with no letters in it. What is wrong, and what is the fix?',
    code: `function countWords(text) {
  return text.match(/\\p{L}+/gu).length
}

countWords('42 + 7')
// TypeError: Cannot read properties of null (reading 'length')`,
    options: [
      'The u flag makes the regex throw on plain ASCII input. Drop the flag and \\p{L} still matches letters',
      'The g flag makes the regex stateful, and an earlier call left lastIndex past the end of this string. Reset lastIndex before each call',
      'match only ever returns the first match, so counting with it is wrong even when it works. Split on whitespace and count the pieces instead',
      'match returns null when nothing matches, not an empty array. Count with (text.match(/\\p{L}+/gu) ?? []).length',
    ],
    correctOption: 3,
    answerInFull: `match returns null when the string contains no match, not an empty array, so the code calls .length on null exactly when the input has no letters in it. Every input with a letter works, which is why this survives testing and fails in production.

The small fix is to supply the empty array yourself:

  return (text.match(/\\p{L}+/gu) ?? []).length

The version that removes the trap instead of patching it is matchAll, which returns an empty iterator when nothing matches:

  return [...text.matchAll(/\\p{L}+/gu)].length

This null is worth remembering as a design fact rather than an edge case: match, exec, and a failed capture all hand back null or undefined rather than an empty value, so any chain off a regex result needs to say what happens when nothing matched.`,
    explanation: `Dropping the u flag makes things worse in the opposite direction: \\p{L} is only a property escape with the flag on. Without it the pattern matches literal characters and the counting is quietly wrong.

The lastIndex option applies a real rule to the wrong method. lastIndex drives test and exec. match with g ignores it and always scans the whole string.

The split option misremembers match, which does return every match when the g flag is on, and its replacement counts anything between spaces, so '42 + 7' would count three words instead of zero.`,
    hints: ['What does match hand back when there is no match at all?'],
    tags: ['regex', 'match', 'null'],
  },
  {
    id: 'match-with-g-drops-groups',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const text = 'a12b34'
console.log(text.match(/(\\d)\\d/g))
console.log([...text.matchAll(/(\\d)\\d/g)].map((m) => m[1]))`,
    options: [
      "['12', '34'] then ['1', '3']",
      "['1', '3'] then ['1', '3']",
      "['12', '34'] then ['12', '34']",
      "One match object for '12', then ['1', '3']",
    ],
    correctOption: 0,
    answerInFull: `['12', '34']
['1', '3']

match with the g flag returns a flat array of the matched strings and nothing else: no groups, no index, no input. The capture in the pattern is simply thrown away, which is why the first line shows the full two-digit matches.

matchAll returns an iterator of complete match objects, each shaped like a single match result: the whole match at index 0, then one entry per group. m[1] is the first capture, so the second line is the first digit of each match.

That is the dividing line for choosing between them: match with g when the matched strings alone are enough, matchAll the moment you need a group or a position. Needing captures for every match and reaching for match is one of the most common regex mistakes, and it fails quietly, since the code gets an array and indexes into the wrong level of it.`,
    explanation: `['1', '3'] for the first line assumes match with g keeps the groups. Dropping them is the documented, surprising behaviour the question is about.

['12', '34'] for the second line reads m[1] as the second match in the list. Each m is one match object, so index 1 is its first capture group, not another match.

One match object is what match returns without the g flag. With it, every match is found and flattened to strings.`,
    hints: ['What does the g flag change about the shape of what match returns?'],
    tags: ['regex', 'match', 'matchall', 'groups'],
  },
  {
    id: 'dot-newline-and-anchors',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const text = 'one\\ntwo'
console.log(/one.two/.test(text))
console.log(/one.two/s.test(text))
console.log(/^two$/m.test(text))`,
    options: ['true, true, true', 'false, true, false', 'false, true, true', 'false, false, true'],
    correctOption: 2,
    answerInFull: `false
true
true

The dot matches any character except a line terminator, so /one.two/ fails on the newline between the words. That exception is invisible in the pattern and is the single most common "why did this not match" in real code, because it only surfaces when multi-line input arrives.

The s flag removes the exception: with it, the dot matches the newline too, and the second test passes. The portable spelling of the same idea is [\\s\\S], a class that matches everything, which you still meet in older code.

The m flag moves the anchors. Without it, ^ and $ are the ends of the whole string, so 'two' in the middle of the text has no ^ before it. With m, they also match at every line break, so the third test finds 'two' occupying its own line.`,
    explanation: `All three true reads the dot as "any character", which is how everyone first learns it. The newline exception is exactly the kind of detail that stays invisible until input with a line break arrives.

false, true, false forgets what m does: it is the flag whose whole job is making anchors match at line breaks.

false, false, true has s backwards. The flag exists to make the dot match a newline, not to forbid it.`,
    hints: ['Which single character does the dot refuse to match?'],
    tags: ['regex', 'flags'],
  },
  {
    id: 'escaping-user-input',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Users type a search term, and you highlight every case-insensitive occurrence of it in the page text. Which way of building the regex is right?',
    options: [
      "new RegExp(query, 'gi') inside a try/catch, so an invalid pattern falls back to showing no highlights",
      `Escape the query first: query.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"), then new RegExp on the result with the gi flags`,
      `new RegExp("\\\\b" + query + "\\\\b", "gi"), because the word boundaries keep the middle of the query from being read as a pattern`,
      `Strip the metacharacters out: query.replace(/[^\\w\\s]/g, ""), then new RegExp on the result, so nothing survives to be misread`,
    ],
    correctOption: 1,
    answerInFull: `A string interpolated into a pattern is code, not data. Every regex metacharacter in the query changes what the pattern means, so the query has to be escaped before it becomes one:

  const escaped = query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')
  const re = new RegExp(escaped, 'gi')

The replacement puts a backslash in front of every metacharacter, and $& is the matched character itself. After that, a search for 'a.c' matches only the literal text 'a.c', and a search for 'c++' is a valid pattern instead of a SyntaxError.

RegExp.escape does exactly this and is recent, so the one-liner is still the portable answer, and it is worth being able to write from memory.

The failure being prevented has two shapes. 'a.c' compiles fine and silently matches 'abc', wrong results with no error anywhere. 'c++' throws, an error thrown at whichever user typed it. Escaping fixes both at once, which no amount of error handling does.`,
    explanation: `The try/catch version only handles the query that fails to compile. 'a.c' compiles fine and highlights the wrong text, and there is no exception to catch for meaning silently changing.

The word-boundary version solves a different problem. \\b constrains where a match starts and ends; it does nothing to the metacharacters between the boundaries, so '.' in the query still matches anything.

Stripping metacharacters produces a valid regex that searches for something the user did not type: a search for 'c++' quietly becomes a search for 'c'. No error, wrong results, and the user cannot tell why.`,
    hints: ['What happens with the query a.c in each version?'],
    tags: ['regex', 'escaping', 'user-input'],
  },
  {
    id: 'named-groups-in-replacement',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt: "Which call turns '2024-05-01' into '01/05/2024'?",
    options: [
      ".replace(/(\\d{4})-(\\d{2})-(\\d{2})/, '\\\\3/\\\\2/\\\\1')",
      ".replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, '${d}/${m}/${y}')",
      ".replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, '$<d>/$<m>/$<y>')",
      ".replace(/\\d{4}-\\d{2}-\\d{2}/, '$3/$2/$1')",
    ],
    correctOption: 2,
    answerInFull: `'2024-05-01'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, '$<d>/$<m>/$<y>')

A replacement string has its own small language: $1 through $9 for numbered groups, $<name> for named ones, $& for the whole match, and $$ for a literal dollar sign. Named groups earn their keep here, because '$<d>/$<m>/$<y>' says what it does, where '$3/$2/$1' has to be checked against the pattern to be believed.

When the replacement needs any logic at all, pass a function instead. It receives the whole match, then each group in order, and with named groups the last argument is the groups object, so the same rewrite is (...args) => { const { y, m, d } = args.at(-1); return \`\${d}/\${m}/\${y}\` }.`,
    explanation: `\\1 syntax is a backreference, and it works inside the pattern, where it means "the same text group 1 matched". In a replacement string it is just a backslash and a digit.

\${d} is template literal syntax, and the replacement is an ordinary string. If it were a template literal it would be worse: it would interpolate whatever variables d, m and y are in scope at that moment, before replace ever ran.

'$3/$2/$1' would be right if the pattern captured anything. It has no parentheses, so there are no groups, and $3 with no third group stays in the output as literal text: the result is '$3/$2/$1'.`,
    hints: ['Which of the four replacement syntaxes does a plain string actually support?'],
    tags: ['regex', 'groups', 'replace'],
  },
  {
    id: 'catastrophic-backtracking',
    type: 'interview',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A review flags /^(\\w+\\s?)*$/ validating a display name that arrives in a request. What is the risk, and what do you do about it?',
    options: [
      'The * accepts the empty string, so the validation is too loose. Change the * to + and the risk is gone',
      'On input that fails to match, the nested quantifiers force the engine to try every way of splitting the string between the inner and outer repetitions, which grows exponentially. A request-sized string is a denial of service in one line. Rewrite so the repetitions cannot overlap, /^\\w+(\\s\\w+)*$/, and bound the input length before matching',
      '\\w and \\s are ASCII only, so names with accented letters are wrongly rejected. Switch to \\p{L} with the u flag',
      'The pattern itself is fine, but validators like this are usually declared with the g flag at module scope, and then every other request fails. Check the flags at the call site',
    ],
    correctOption: 1,
    answerInFull: `The pattern nests a quantifier inside a quantifier, and the two overlap: a run of word characters can be split between the inner \\w+ and another turn of the outer * in many different ways. On a string that matches, the engine finds one split and stops. On a string that cannot match, say thirty word characters followed by an exclamation mark, it has to prove no split works before failing, and the number of splits roughly doubles with each extra character. Twenty-six characters is seconds; a few more is minutes. That is catastrophic backtracking, and because the string arrives in a request, it is a denial of service one crafted input long.

Two properties make it dangerous in review. It is invisible in testing, because valid input stays fast and typical invalid input is short. And it looks like a correctness question, so the review conversation happens about the wrong risk.

The rewrite makes the split unambiguous: /^\\w+(\\s\\w+)*$/ forces every repetition to start with whitespace, so there is exactly one way to consume any input and nothing to backtrack over. Then bound the length before matching, as defence in depth rather than as the fix, since the bound protects every future pattern too. Behaviour does shift at the edges, since the original quietly accepted a trailing space and the empty string, so the accepted language has to be stated and tested rather than assumed.`,
    explanation: `The empty-string option is a real, minor looseness, and fixing it does not touch the blowup: /^(\\w+\\s?)+$/ backtracks exactly as badly.

The ASCII option is also a real defect, and worth raising, but it causes wrong rejections, not an outage. Tiering the two risks is the actual review skill this question is testing.

The g-flag option applies the other famous regex bug to a pattern that does not have the flag. It is the answer from someone who has met stateful regexes and not backtracking.`,
    hints: ['What does the engine have to prove before it can say a string does not match?'],
    tags: ['regex', 'backtracking', 'redos'],
  },
  {
    id: 'reviewing-regex-over-html',
    type: 'scenario',
    form: 'open',
    tier: 'senior',
    prompt:
      'A teammate\'s MR extracts every link from user-submitted HTML with /<a href="([^"]*)"/g, and the tests pass. What do you say in the review?',
    answerInFull: `The core of the review comment: this pattern matches the fixture the tests were written against, not HTML. HTML is not a regular language, and even ignoring nesting, the flat variations sink it. Single-quoted or unquoted attribute values, other attributes before href, whitespace around the equals sign, uppercase tags, and entities in the URL are all valid HTML this regex silently misses, and the tests pass because the fixtures were written by the same person who wrote the pattern.

Whether that is a blocking comment depends on what the extraction is for. If it feeds anything security-relevant, filtering which URLs are allowed, sanitisation, deciding what to proxy, then a missed link is a bypass, and user-submitted input guarantees someone will eventually construct one. That version I would block. If it is best-effort link statistics over trusted input, I would say so and let a documented approximation through.

The fix is a parser, because the platform ships one. In the browser, DOMParser and querySelectorAll('a[href]'), reading the href property. On the server, an HTML parser library. The parser handles every variation above, and it also answers questions the regex cannot, like links inside comments or script tags, which probably should not count.

What I would ask for either way: tests written against hostile input, single quotes, attribute order, an entity in the URL, rather than fixtures shaped like the pattern. Passing tests told us the regex agrees with its author, which is not the property we needed.`,
    explanation: `Two things separate a strong answer from a recited "never parse HTML with regex". The first is deciding severity from who produces the input and what consumes the output: user-submitted input feeding a security decision is a block, trusted input feeding statistics is a judgement call. The second is asking for the tests to change, not just the code, because the tests passing is how this got to review in the first place.`,
    hints: ['The tests pass. What exactly did they prove?'],
    tags: ['regex', 'html', 'parsing'],
  },
]
