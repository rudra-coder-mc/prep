import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-is-constant-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Three of these cost the same whether the collection holds ten items or a million. Which one does not?',
    options: [
      'obj.total = 12 on an ordinary object',
      'arr.shift(), taking the first element out of an array',
      'map.get(id) on a Map with a million entries',
      'arr.push(item), averaged over many pushes',
    ],
    correctOption: 1,
    answerInFull: `shift is the linear one, and the reason is the index.

An array is a sequence of numbered slots. Removing the first element means the element at index 1 has to become index 0, index 2 becomes index 1, and so on to the end. Every remaining element moves, so the work is the length of the array.

pop is the opposite. It takes the last element, nothing after it has to move, and the cost is the same for any length.

push is constant when averaged out rather than on every single call. The array occasionally runs out of room and the engine copies it into a larger block, which is one expensive push among many cheap ones. Spread over all the pushes, that averages to constant, and amortised is the word for exactly this.

The Map is constant by design. The specification requires access times that are, on average, sublinear in the number of entries, which is a promise about growth rather than about a specific speed.

Where this bites is the queue. Draining a job list with shift in a while loop moves the whole remaining list on every iteration, which makes the drain quadratic. Walking it with an index instead moves nothing.`,
    explanation: `The push option names amortisation because that is the honest description, and it is the answer people suspect is the trick. It is constant in the sense that matters: doubling the array does not double the cost of a push.

Property assignment on an object is a hash lookup and a write. It stays constant however many properties the object has, and the thing that does degrade it is deleting properties, not adding them.`,
    hints: ['What has to happen to the elements that stay behind?'],
    tags: ['performance', 'arrays'],
  },
  {
    id: 'map-guarantee-concept',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does the language specification actually promise about the cost of map.get?',
    options: [
      'Nothing. Map is specified as a list of entries, and every engine happens to optimise it',
      'That a Map is a hash table, so get is exactly one hash and one comparison',
      'That access times are, on average, sublinear in the number of entries, which forbids a scan without naming an implementation',
      'That it is the same cost as a property read on an object, since both are hash lookups underneath',
    ],
    correctOption: 2,
    answerInFull: `The specification describes the semantics as a list of entries and then adds a requirement about performance: a Map has to be implemented with hash tables or something else that gives access times which are, on average, sublinear in the number of entries.

That wording is doing two things at once. It rules out the obvious implementation, a plain array of pairs scanned from the start, so you can rely on lookups not degrading as the collection grows. And it names no data structure, so engines stay free to choose one and to change it.

What you can rely on in practice: get, set, has and delete do not care how many entries there are, and Set is specified with the same sentence.

What you cannot rely on: a specific number. A Map lookup and an object property read are both constant and they are not the same constant. Objects get hidden classes and inline caches, which can make a property read on a stable shape faster than anything a Map can do. Map wins on any key type, insertion order, size, and deletes that do not deoptimise the object.

The practical version of the answer is that both are constant, so choose between them on semantics, and reach for a Map when the keys are data rather than names you wrote.`,
    explanation: `Saying the specification promises nothing is the common answer from people who have read the algorithm steps and not the note underneath them. The list of entries is the semantics; the sublinear requirement sits right next to it.

Naming a hash table exactly is too strong. The specification deliberately allows anything with the right growth, which is what lets an engine use different representations for small and large maps.

Equating it with an object property read confuses two things that are both constant with two things that are equally fast. They are not, in either direction.`,
    hints: [],
    tags: ['performance', 'map'],
  },
  {
    id: 'splice-in-a-loop-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const queue = ['a', 'b', 'c', 'd']

for (let i = 0; i < queue.length; i++) {
  console.log(queue[i])
  if (queue[i] === 'b') queue.splice(i, 1)
}`,
    items: ['b', 'a', 'c', 'd', 'undefined'],
    correctOrder: [1, 0, 3],
    answerInFull: `a, b, d. The c is skipped, and skipping it is the bug.

The loop reads index 0 and prints a. It reads index 1, prints b, and then splices that element out. Removing an element from the middle of an array is not a quiet operation: everything after it moves down one index, so c is now at index 1 and d is at index 2.

The loop counter has no idea any of that happened. It increments to 2, which used to be c and is now d, so d prints and c is never visited at all.

This is the mutation-while-iterating bug in its most common form, and it is worth recognising by shape rather than by memory. Any loop that removes from the collection it is walking will skip the element after each removal.

Two fixes, and they differ in more than style. Walk backwards, so the removals only disturb indexes the loop has already passed. Or build a new array with filter and leave the original alone, which is what you want unless something else holds a reference to it.

The cost matters too. Each splice moves every element after the removal, so removing k items this way is k passes over the tail rather than one pass over the array.`,
    explanation: `c is in the pool because it is what the loop prints if you assume the array is a fixed sequence the loop walks over. It is the answer everyone expects on first reading.

undefined is there for the other misreading, that the array keeps its length and leaves an empty slot behind, which is what delete does and splice does not.`,
    hints: ['What happens to the index of every element after the one that was removed?'],
    tags: ['performance', 'arrays', 'debugging'],
  },
  {
    id: 'delete-leaves-a-hole-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const scores = [10, 20, 30]
delete scores[1]

console.log(scores.length, scores[1], Object.keys(scores).length)`,
    options: [
      '2 30 2, because delete removes the element and the array closes up behind it',
      '3 undefined 2, because delete clears the slot without renumbering anything, and the missing index is not a key',
      '3 undefined 3, because the slot is still there holding undefined',
      '3 null 3, because a cleared array slot holds null',
    ],
    correctOption: 1,
    answerInFull: `3 undefined 2.

delete on an array does exactly what delete on an object does: it removes a property. The property here is called "1", and removing it does not renumber the others and does not touch length. What is left is a hole, an index that no longer exists.

Reading a hole gives undefined, the same as reading any missing property, which is why the middle value tells you nothing. Object.keys is what exposes the difference: it lists own properties, and index 1 is not one any more, so two keys come back for an array of length three.

Holes are not the same as undefined values, and the array methods disagree about them in a way worth knowing. forEach, filter and reduce skip them, map skips the callback and leaves the hole in its result, and find, includes and the spread operator all treat a hole as undefined.

There is a performance edge to this as well. Engines keep arrays in a fast packed representation while every index up to length exists. One delete makes an array holey, and it stays holey, with every element access from then on going through a slower path.

If the intent was to remove the element, splice does it and renumbers. If the intent was to blank it, assign undefined or null, which keeps the array packed.`,
    explanation: `Expecting the array to close up is the reflex from splice, and it is the main reason delete on an array is a mistake rather than a style choice.

Expecting three keys is the belief that a hole is a slot holding undefined. The read looks identical, and every method that enumerates keys can tell them apart.

null appears nowhere: nothing in the language turns a removed property into null.`,
    hints: ['What kind of thing does delete remove, and what is an array index really?'],
    tags: ['performance', 'arrays'],
  },
  {
    id: 'nested-find-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This report renders instantly against the twenty-row fixture and takes several seconds against the real ten thousand. What is the fix?',
    code: `function withCustomers(lines, orders) {
  return lines.map((line) => {
    const order = orders.find((o) => o.id === line.orderId)
    return { ...line, customer: order.customer }
  })
}`,
    options: [
      'Build a Map from order id to order once, before the map, and get from it inside',
      'Replace find with a for loop and break, since find has callback overhead per element',
      'Sort orders by id first, so find stops sooner on average',
      'Move the map onto a worker, since the work itself is unavoidable',
    ],
    correctOption: 0,
    answerInFull: `Index the orders once, then look each one up.

    const byId = new Map(orders.map((o) => [o.id, o]))
    return lines.map((line) => ({ ...line, customer: byId.get(line.orderId).customer }))

The original does a scan per line. With ten thousand of each, that is ten thousand scans of ten thousand orders, so around fifty million comparisons on average and a hundred million for lines whose order is missing. The rewrite does one pass to build the index and one constant lookup per line: twenty thousand operations rather than fifty million.

The shape to recognise is a scan inside a loop, and the giveaway is that the two collection sizes multiply instead of adding. It hides behind find inside map, includes inside filter, and some inside a for.

Two things to get right when you do it. Build the index outside the loop, because building it inside is the same nested scan with more allocation. And build it from whichever side is scanned, which here is orders, since lines is walked exactly once either way.

Worth handling the missing case while you are in there. find returning undefined and get returning undefined both throw on the property read, and the version that throws with a useful message is the one you want.`,
    explanation: `Swapping find for a hand-written loop removes the callback and keeps the scan. It is a constant-factor change to a quadratic problem, so it buys perhaps a factor of two and then the data grows again.

Sorting does not help a linear find at all, and it costs n log n to arrange. It would only pay off with a binary search, which is more code than a Map and slower than one.

Moving it to a worker moves fifty million comparisons somewhere else. The point is that the work was never necessary.`,
    hints: ['How many times does the inner scan run, and how long is it each time?'],
    tags: ['performance', 'debugging'],
  },
  {
    id: 'reduce-spread-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A profile of this shows most of the time in allocation and garbage collection rather than in the callback. Why?',
    code: `const byId = rows.reduce((acc, row) => ({ ...acc, [row.id]: row }), {})`,
    options: [
      'Object spread is slower than Object.assign, and swapping them removes the allocation',
      'The computed key forces the object into dictionary mode, and every write after that is slow',
      'Each callback builds a whole new object and copies every key gathered so far, so a thousand rows means a thousand objects and half a million key copies',
      'reduce holds every intermediate accumulator alive until it finishes, so nothing can be collected during the loop',
    ],
    correctOption: 2,
    answerInFull: `The spread is inside the callback, so it runs once per row, and each run copies everything accumulated before it.

Row one copies nothing, row two copies one key, row three copies two, and so on. That sum is n squared over two: about half a million key copies for a thousand rows, fifty million for ten thousand. Every intermediate object is garbage the moment the next one is built, which is why the profile is mostly allocation and collection.

    const byId = {}
    for (const row of rows) byId[row.id] = row

That is linear, allocates one object, and reads better than the reduce did. If you want the expression form, Object.fromEntries(rows.map((r) => [r.id, r])) is also linear.

The reduce is not the problem and neither is immutability. Mutating an accumulator that was created inside the same expression and returned from it is not shared mutable state: nothing else can observe it. The version to write when you want to keep reduce mutates acc and returns it.

The same trap in array form is [...acc, item], and it is the more common one because it looks so much like the correct way to avoid mutation. Both are a fresh collection per element.`,
    explanation: `Object.assign into a fresh object literal has exactly the same cost, because the copying is what costs, not the syntax. Object.assign onto the accumulator would fix it, by mutating.

Dictionary mode is a real thing and this is not it. It comes from deleting properties or from objects with wildly varying shapes, and it would show up as slow property access rather than as allocation.

reduce holds one accumulator, the current one. The intermediates are unreachable immediately, which is precisely why the collector has so much to do.`,
    hints: ['How many objects does this expression create for a thousand rows?'],
    tags: ['performance', 'debugging'],
  },
  {
    id: 'intersection-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You need the ids present in both of two arrays of about fifty thousand strings each. Which implementation would you write?',
    options: [
      'a.filter((id) => b.includes(id)) — the direct expression of what was asked',
      'a.sort() and b.sort(), then walk both with two indexes',
      'const inB = new Set(b); return a.filter((id) => inB.has(id)) — one pass to index, one pass to filter',
      'Object.keys({ ...Object.fromEntries(a.map((id) => [id, 1])), ...Object.fromEntries(b.map((id) => [id, 1])) })',
    ],
    correctOption: 2,
    answerInFull: `Build a Set from one side and filter the other against it.

    function intersect(a, b) {
      const inB = new Set(b)
      return a.filter((id) => inB.has(id))
    }

That is two linear passes: fifty thousand adds and fifty thousand constant lookups, so around a hundred thousand operations. The includes version is a scan of b for every element of a, which is fifty thousand times fifty thousand, or two and a half billion comparisons on average. The difference is a few milliseconds against several seconds.

Two details worth saying out loud. Index the larger side and filter the smaller one if the sizes differ, since the pass that builds the Set is the cheaper of the two. And this compares by identity with SameValueZero, so it is right for strings and numbers and does not merge objects with equal contents.

If duplicates in a matter, the filter keeps them all. Wrapping the result in a Set, or filtering a Set of a instead, is the version that returns each id once.

Current engines also have Set.prototype.intersection, which does exactly this with the same complexity. Check that your targets have it before using it.`,
    explanation: `The includes version is the one that gets written, because it reads like the sentence in the ticket. It is correct and quadratic, and on a fixture of twenty ids it looks perfect.

Sorting both sides and merging is a real algorithm, at n log n plus a linear walk. It is more code, it is slower than the Set version, and it mutates both inputs unless you copy them first.

The spread of two objects does not intersect anything. It unions the keys, so it answers a different question, and it allocates two intermediate objects on the way.`,
    hints: ['What does the inner operation cost, and how many times does it run?'],
    tags: ['performance', 'coding', 'set'],
  },
  {
    id: 'queue-drain-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A worker drains a queue of a hundred thousand jobs with while (queue.length) run(queue.shift()). Draining it takes far longer than the jobs themselves. What do you change?',
    options: [
      'Chunk the queue with splice(0, 100) and drain a chunk at a time',
      'Read jobs with queue.pop() instead, accepting that they now run newest first',
      'Keep an index into the array and advance it, so no element ever moves',
      'Reverse the array once, then shift from the end',
    ],
    correctOption: 2,
    answerInFull: `Move a pointer rather than the data.

    let head = 0
    while (head < queue.length) {
      run(queue[head++])
    }

Every shift renumbers the whole remaining queue, so draining n jobs moves roughly n squared over two elements. At a hundred thousand jobs that is five billion moves before a single job has been counted. Reading by index moves nothing, and the drain becomes linear.

For a queue that lives a long time and is written to as well as read, the pointer has to be paired with occasional compaction, or the consumed prefix is never released. Splicing off the front once, when head grows past some threshold, is the usual answer. For draining a batch and dropping the array afterwards, the pointer alone is the whole fix.

The general rule this is an instance of: an operation at the front of an array is linear, and one at the end is constant. push and pop are cheap, shift and unshift are not, and a queue is exactly the shape that wants both ends.`,
    explanation: `pop is genuinely constant and turns the queue into a stack. If order does not matter that is a legitimate answer, and if it is a queue then it does matter, which is why this is the tempting wrong one.

Chunking with splice reduces the number of expensive operations by a factor of a hundred and each one still moves the whole remaining array. It is the same quadratic curve with a smaller constant.

Reversing and shifting from the end still calls shift, which always operates on index 0. Reversing then popping would work, and it costs a full reverse to avoid a change of one line.`,
    hints: ['Which end of an array is cheap to operate on, and why?'],
    tags: ['performance', 'arrays', 'coding'],
  },
  {
    id: 'sort-by-parsed-key-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Fifty thousand rows are sorted by a date held as an ISO string, with rows.sort((a, b) => new Date(a.date) - new Date(b.date)). It is slow. What is the change worth making?',
    options: [
      'Replace the subtraction with an explicit comparison returning -1, 0 or 1',
      'Parse each date once into a number, sort on that, then drop the extra field',
      'Write your own quicksort, since the built-in sort is not specialised for numbers',
      'Sort the ISO strings directly with localeCompare, which is built for comparing text',
    ],
    correctOption: 1,
    answerInFull: `The comparator is the hot path, and this one parses two dates every time it is called.

A sort of n elements makes on the order of n log n comparisons, so fifty thousand rows means roughly eight hundred thousand comparisons and one and a half million date parses. Parsing is far more expensive than comparing numbers.

    const keyed = rows.map((row) => ({ row, at: Date.parse(row.date) }))
    keyed.sort((a, b) => a.at - b.at)
    const sorted = keyed.map((entry) => entry.row)

Now there are fifty thousand parses instead of a million and a half, and the comparator is one subtraction. The pattern has a name, decorate, sort, undecorate, and it applies to any expensive key: a lowercased string, a computed score, a field reached through several levels.

Two things to know about sort itself. It sorts in place and returns the same array, so the original order is gone unless you copied first, and it has been required to be stable since ES2019, which means equal keys keep their relative order and a second sort can refine a first.

The one case where you do not need any of this: ISO 8601 strings in the same time zone sort correctly as plain strings, because the format was designed for it. Comparing them with < and > directly is faster than all of the above.`,
    explanation: `Returning -1, 0 or 1 instead of a subtraction changes nothing about the parsing, which is where the time goes. It matters only for values where subtraction is meaningless, such as strings.

A hand-written sort competes with a carefully tuned engine implementation and starts from behind. The built-in is not the problem; what you handed it is.

localeCompare is the slowest string comparison available, because it applies locale rules. For ISO timestamps a plain < is both correct and fast.`,
    hints: ['How many times does the comparator run, and what does it do each time?'],
    tags: ['performance', 'coding', 'arrays'],
  },
  {
    id: 'set-of-six-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A reviewer asks you to change const BLOCKED = ["a", "b", "c", "d", "e", "f"] and BLOCKED.includes(code) into a Set, on the grounds that Set lookups are constant and array lookups are linear. Both statements are true. Is the change worth making?',
    options: [
      'No: at six fixed elements the scan is faster than hashing, and the complexity argument is about growth in data you do not control',
      'Yes: constant beats linear, and writing the faster form by default costs nothing',
      'No, and for the opposite reason: a Set cannot hold strings efficiently, so it would be slower at any size',
      'Yes, but only if the Set is rebuilt on each call so it never goes stale',
    ],
    correctOption: 0,
    answerInFull: `No, and the reason is worth being able to state without sounding like you are against measuring things.

Complexity describes how cost grows with size. Six is not a size, it is a constant written in the file, and it cannot grow unless somebody edits it. Comparing six short strings is a handful of machine operations; a Set lookup hashes the string and probes a table. At this size the array wins, and at any size the difference is nanoseconds either way.

The test that decides these arguments: does n come from data. A list of blocked codes in the source is fixed forever. A list of blocked codes loaded from the database is not, and if that is checked once per request against thousands of entries then the Set is right and so is the reviewer.

There is a real reason to use a Set here anyway, and it is not speed. It says the collection is a membership test rather than a sequence, and it makes duplicates impossible. Arguing for it on readability is honest; arguing for it on complexity is cargo cult.

The version of this that does matter is the same lookup inside a loop over data. Six elements times a hundred thousand rows is six hundred thousand comparisons, and that is when you hoist a Set out of the loop.`,
    explanation: `The blanket "constant beats linear" is true asymptotically and says nothing about six. It is the answer that sounds most professional and it skips the only question that matters, which is where n comes from.

Sets hold strings perfectly well; there is no such penalty.

Rebuilding a Set on every call is the worst of both: allocation and hashing on each request to speed up a scan of six items that was never slow. A module-level constant is built once.`,
    hints: ['Where does the size of this collection come from?'],
    tags: ['performance', 'scenario'],
  },
  {
    id: 'slow-list-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'A page that renders a table of rows has become unusable since a customer started uploading much bigger files. Nothing about it changed. Walk me through how you would find and fix the problem.',
    answerInFull: `- First I would establish that it is a growth problem rather than a constant one, because nothing else in the answer follows without that. Render it at a hundred rows, a thousand and ten thousand and look at the shape: ten times the data taking ten times as long is linear and probably honest work, and taking a hundred times as long is quadratic and is a bug.
- Then I would look for the multiplying shape, which is a scan inside a loop. find inside map, includes inside filter, some inside a for. Those are the ones where two sizes multiply, and they are invisible on a small fixture. The fix is to build a Map or a Set once outside the loop and look up inside it.
- Next, copies. Spread in a reduce accumulator, [...acc, item] or { ...acc, [key]: value }, allocates a new collection per element and copies everything accumulated so far. It profiles as garbage collection rather than as your code, which is why it is easy to miss.
- Then front-of-array operations. shift or unshift or splice inside a loop moves the whole tail on every call, so a queue built on shift is quadratic.
- Then work that could be hoisted: an expensive comparator that parses a date on every comparison, a regular expression compiled per row, a formatter constructed per cell. Sort makes n log n comparisons, so anything expensive in the comparator is multiplied by that.
- I would confirm with a profile rather than guessing, and specifically look at whether the time is in my functions, in allocation, or in layout and paint. If it is in paint, none of the above is the problem and the answer is to render fewer rows: virtualise the list, or paginate.
- The fix I would reach for first is always the index, because it is the one that changes the curve rather than the constant. Everything else is a factor of two.

The thing I would say before being asked: I would keep the fixture that reproduces it. A performance bug with no test at the real size comes back the next time someone rewrites the loop.`,
    explanation: `The order is what is being assessed. Measure the growth, look for multiplying work, then copying, then hoistable work, then confirm with a profile.

The two answers that separate people who have done this: naming garbage collection as the symptom of accumulator copying, and knowing when to stop optimising the data work because the time is in rendering. A candidate who goes straight to a worker or to memoisation has skipped the question of whether the work was necessary at all.`,
    hints: [],
    tags: ['performance', 'design'],
  },
]
