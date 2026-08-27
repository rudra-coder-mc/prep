import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'live-collection-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'What does it mean that getElementsByClassName returns a live collection, and querySelectorAll does not?',
    options: [
      'The live one re-runs its query every time you read it, so it always describes the tree as it is now, while the static one holds the nodes that matched when it was built',
      'The live one holds weak references to its nodes, so removed elements drop out of it once they are collected',
      'The live one updates when you write to it, so assigning to an index inserts a node into the document',
      'The live one fires events when the tree changes, and code that needs to know about changes subscribes to it',
    ],
    correctOption: 0,
    answerInFull: `A live collection is a standing query. A static one is a snapshot.

Read length or an index on an HTMLCollection and the browser answers from the tree at that moment. Nothing was stored when you made it, so a node added or removed since is already reflected. querySelectorAll walks the tree once, puts the matches in a NodeList, and hands it over; the tree can change all it likes afterwards and the list will not.

The reason this is asked is the loop that breaks on it.

    const rows = document.getElementsByClassName('row')
    for (let i = 0; i < rows.length; i++) rows[i].remove()

Removing index 0 shifts every remaining row down one while i moves up, and length shrinks as it goes, so every other row survives. Over querySelectorAll the same loop is correct, because the snapshot does not move under it.

The fixes are all about removing the liveness or removing the movement: iterate backwards, spread into an array first, or query with querySelectorAll.

Live is not useless. It is what makes element.children mean "the children right now" rather than "the children when I asked", and something has to be live for the tree to be observable at all. But it is a default that surprises people, which is why the modern API is static.`,
    explanation: `Weak references are a different mechanism entirely, and a removed element is not collected while your code still holds it. A detached node is a perfectly usable object.

Nothing about either collection is writable in that sense. Assigning to an index on an HTMLCollection does not insert anything into the document.

The change-notification API does exist, and it is MutationObserver, which is a separate object you construct. A live collection tells you nothing; you have to look.`,
    hints: ['What happens when you read length twice with a removal in between?'],
    tags: ['dom', 'collections'],
  },
  {
    id: 'text-content-vs-inner-html-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt:
      'A comment body arrives from your API and has to go on the page. Why is textContent the right property and innerHTML the wrong one?',
    options: [
      'Because innerHTML is slower, since it invokes the HTML parser rather than setting a string',
      'Because innerHTML parses the string as markup, so anything in it that looks like a tag becomes one, and a crafted comment can run script',
      'Because innerHTML strips whitespace and newlines, so the comment loses its formatting',
      'Because textContent escapes HTML entities before inserting them, which innerHTML does not do',
    ],
    correctOption: 1,
    answerInFull: `Because innerHTML runs the parser, and the parser does what the string says.

Set textContent and the browser makes one text node containing exactly those characters. There is no markup in it, because a text node cannot hold markup. Set innerHTML and the string is parsed as HTML, so an angle bracket starts a tag and an onerror attribute is an event handler. The classic payload is an image with a broken source and an onerror, which needs no script tag at all and survives most naive filters.

The rule to follow without thinking about it: textContent for anything from a user or a server, innerHTML only for markup you wrote yourself.

Two things people reach for instead, and why neither is as good. Escaping by hand means getting every context right, and attribute context, URL context and script context all have different rules; you will get one wrong. Sanitising is a real answer when you genuinely have to accept markup, and it means a library that is maintained against new bypasses, not a regular expression.

There is a third property worth knowing about, innerText, which is neither of these. It reads and writes rendered text, so it skips what CSS has hidden and it forces a layout to find out. Reach for textContent unless you specifically want what the user can see.`,
    explanation: `innerHTML is slower, and performance is not the reason. If it were, a slow safe option would still be the right one for untrusted data.

Whitespace handling is innerText's behaviour, not innerHTML's, and it is about what is rendered rather than about what is stored.

textContent does not escape anything. Escaping implies the string still becomes markup afterwards. It never becomes markup at all, which is a stronger guarantee than escaping and the reason it cannot be got wrong.`,
    hints: ['What does the browser do with the string in each case?'],
    tags: ['dom', 'security'],
  },
  {
    id: 'live-removal-loop-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'A list holds four items with the class row. What does this print?',
    code: `const rows = document.getElementsByClassName('row')

for (let i = 0; i < rows.length; i++) {
  rows[i].remove()
}

console.log(rows.length, document.querySelectorAll('.row').length)`,
    options: [
      '0 0, because the loop removes every row and both collections agree afterwards',
      '2 2, because removing index 0 shifts the rest down while i moves up, so the loop only removes half of them',
      '4 0, because rows still holds the four nodes it was built with and the document has none left',
      '0 4, because the live collection empties as you remove and the query afterwards sees the original markup',
    ],
    correctOption: 1,
    answerInFull: `2 2. The loop removes two of the four rows, and both counts then report what is left.

Follow it. i is 0 and length is 4, so row A is removed. The collection is live, so B, C and D shift to indexes 0, 1 and 2 and length becomes 3. Now i is 1, which is C, and C is removed. B and D remain, length is 2, and i becomes 2, which is not less than 2, so the loop stops. B and D survive.

The last line is then two different collections agreeing on the same tree, which is the part worth noticing. rows is live, so it reports 2. The fresh querySelectorAll also reports 2, because a snapshot taken now is a snapshot of a tree with two rows in it. The difference between them is never about what the tree contains, only about when they looked.

Three fixes, all standard. Loop backwards, so the shifting happens behind you. Snapshot first with querySelectorAll or a spread. Or repeatedly remove index 0 until length is 0, which uses the liveness deliberately instead of fighting it.

    for (const row of [...rows]) row.remove()`,
    explanation: `0 0 is the answer if you assume the collection is static, which is exactly the assumption the modern API trained into everyone.

4 0 swaps the two collections around: it describes what a static rows would report against an emptied document, and rows is the live one here.

0 4 has the liveness backwards in both halves. A query run after the removals cannot see the original markup; the markup is gone, and only the tree exists.`,
    hints: ['Write down i and length after each removal.'],
    tags: ['dom', 'collections'],
  },
  {
    id: 'append-moves-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `// <ul id="list"><li id="a">a</li><li id="b">b</li></ul>
// <ul id="other"></ul>

const list = document.getElementById('list')
const other = document.getElementById('other')
const a = document.getElementById('a')

console.log('list starts with ' + list.children.length)
other.append(a)
console.log('list now has ' + list.children.length)
console.log('other now has ' + other.children.length)
other.append(a.cloneNode(true))
console.log('other after the clone has ' + other.children.length)
console.log('a lives in ' + a.parentElement.id)`,
    items: [
      'list now has 2',
      'list starts with 2',
      'other now has 1',
      'a lives in list',
      'list now has 1',
      'other after the clone has 2',
      'a lives in other',
      'other after the clone has 3',
    ],
    correctOrder: [1, 4, 2, 5, 6],
    answerInFull: `list starts with 2, list now has 1, other now has 1, other after the clone has 2, a lives in other.

The whole question is one rule: a node has exactly one parent, so appending a node that is already in the tree moves it. There is no copy anywhere in the DOM API unless you ask for one.

So other.append(a) does two things in one call. It detaches a from list, which is why list drops to one child, and it attaches it to other, which is why other goes to one. The same call, one move.

cloneNode is how you ask for the copy, and its argument is whether to bring the descendants: cloneNode(true) is a deep copy, cloneNode() alone gives you the element with none of its contents. The clone is a new node with no parent, so appending it adds rather than moves, and other ends with two children.

The last line is the same rule read from the other side. parentElement follows the tree, and the tree says a is in other now.

Worth knowing about the clone: it copies attributes and it does not copy event listeners or any state held in JavaScript against the original. A cloned input carries the value attribute and not what the user typed into it.`,
    hints: ['How many parents can a node have?'],
    tags: ['dom', 'nodes'],
  },
  {
    id: 'child-nodes-whitespace-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'The markup is indented exactly as shown. What does this print?',
    code: `<ul id="list">
  <li>one</li>
  <li>two</li>
</ul>

const list = document.getElementById('list')
console.log(list.children.length, list.childNodes.length)`,
    options: [
      '2 2, because whitespace between tags is not part of the document',
      '2 5, because the newline and indentation between the tags are text nodes, and there are three of them',
      '2 3, because the text nodes between the two items count but the ones at each end do not',
      '5 5, because both properties report every node and children is an alias for childNodes',
    ],
    correctOption: 1,
    answerInFull: `2 5.

children is elements only, and there are two list items, so that half is uncontroversial. childNodes is every node the parser produced, and the parser produces a text node for every run of whitespace between tags.

Count them in the source. There is a newline and two spaces after the opening ul tag, a newline and two spaces between the items, and a newline before the closing tag. Three text nodes, two elements, five child nodes.

This is why a walk over childNodes that assumes elements breaks on formatted markup and works on minified markup, which is a difference nobody enjoys debugging. It is also why firstChild and firstElementChild are separate properties, along with lastChild, nextSibling and their element-only twins.

Use children, firstElementChild and nextElementSibling by default. Reach for the node versions only when you actually care about text, which is real: a text node is where the text is, and normalising or measuring content means visiting them.

The other reason to know this: whitespace text nodes are not always inert. Between inline-block elements they render as a space, which is the source of the mysterious four pixel gap that a hundred blog posts blame on the CSS.`,
    explanation: `Whitespace being absent from the document is the intuition from writing CSS, where it collapses. The parser keeps it; layout is what decides whether it shows.

Counting only the interior separator misses the two at the ends. The rule is not "between the items", it is every run of whitespace inside the element.

children is not an alias. If it were, every walk over children would have to skip text nodes, which is precisely the job children exists to do.`,
    hints: ['Count the runs of whitespace inside the ul, not the ones around it.'],
    tags: ['dom', 'nodes'],
  },
  {
    id: 'inner-html-append-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Each row has a delete button with a click listener attached when the row is built. Adding a row makes every existing delete button stop working. Why?',
    code: `function addRow(item) {
  list.innerHTML += renderRow(item)
  const row = list.lastElementChild
  row.querySelector('.delete').addEventListener('click', () => remove(item))
}`,
    options: [
      'Because addEventListener on a node inside a string of markup does not attach until the parser has finished, so the listener is registered against a node that is about to be replaced',
      'Because innerHTML += serialises the whole subtree, concatenates and re-parses it, so every existing row is destroyed and replaced by a new node with no listeners on it',
      'Because the listeners are still attached but the arrow function closes over a stale item, so every button now deletes the newest row',
      'Because lastElementChild returns the last text node rather than the last row, so the listener is attached to the wrong node',
    ],
    correctOption: 1,
    answerInFull: `Because innerHTML += is not an append. It is a read, a concatenation and a full rewrite.

Expanded, the line is list.innerHTML = list.innerHTML + renderRow(item). The read serialises the entire current subtree back into a string of markup. The write parses the combined string and replaces every child of the list with freshly built nodes. The old nodes are discarded, and everything that lived on them goes with them: event listeners, values typed into inputs, scroll positions, any property your code set, and the identity that made a held reference valid.

So each call reattaches a listener to the newest row and silently destroys the listeners on all the others. The bug scales with the number of rows, which is why it usually gets found in production.

Two fixes, and the second is better.

Parse only the new markup, so the existing nodes are never touched:

    list.insertAdjacentHTML('beforeend', renderRow(item))

Or stop attaching a listener per row and put one on the list, which is event delegation and the subject of the next topic. One listener that reads the click target survives any amount of rebuilding, and there is nothing to reattach.

The general lesson is the one to say out loud in an interview: assignment to innerHTML replaces a subtree, so += replaces a subtree with a copy of itself plus something.`,
    explanation: `There is no deferred attachment. addEventListener is synchronous and the parse has already finished by the time the assignment returns.

The stale closure is a real bug in other code and not this one. Each call makes a new arrow function over its own item, and the listeners are not stale, they are gone.

lastElementChild is element-only, which is exactly why it is the right property here. lastChild is the one that would hand back a whitespace text node.`,
    hints: ['Write the += out as the assignment it is.'],
    tags: ['dom', 'events'],
  },
  {
    id: 'layout-thrash-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'This runs in about 40 milliseconds for 20 boxes and about four seconds for 2000. What is wrong with it, and what is the fix?',
    code: `for (const box of boxes) {
  box.style.height = box.offsetHeight * 2 + 'px'
}`,
    options: [
      'Setting style directly is the problem, because inline styles bypass the stylesheet cache. Use a class and let CSS do the arithmetic',
      'The loop is synchronous, so it blocks the main thread. Split it into chunks with setTimeout so the browser can paint between them',
      'Each read of offsetHeight has to flush the writes queued before it, so layout runs once per box. Do every read first, then every write',
      'Reading and writing the same property makes the browser recompute the cascade for that element. Read a different property, such as getBoundingClientRect, which is cached',
    ],
    correctOption: 2,
    answerInFull: `Layout thrashing. Every iteration forces a full layout pass, so the cost grows with the product of the boxes and the document, not with the boxes.

The mechanism is worth stating precisely. DOM writes are queued: setting style.height marks the document dirty and returns immediately, and the browser recalculates layout once, later, before it paints. That batching is what makes many small writes affordable. A geometric read cannot be served from the queue, because its answer depends on every pending change, so reading offsetHeight makes the browser stop and compute layout for the whole document first.

One read at the top of a frame is fine. A read after a write, in a loop, means one layout pass per iteration.

The fix separates the phases and changes nothing else:

    const heights = boxes.map((box) => box.offsetHeight)
    boxes.forEach((box, i) => {
      box.style.height = heights[i] * 2 + 'px'
    })

Now every read happens with nothing pending, so the first forces layout and the rest are answered from it, and every write stays queued until the browser is ready to paint.

The properties that flush are worth recognising rather than memorising: anything positional or geometric. offsetTop, offsetHeight, scrollTop, scrollHeight, getBoundingClientRect, getComputedStyle, and focus and scrollIntoView as well. If the answer depends on where things ended up, it costs a layout.

When the reads and writes genuinely cannot be separated, put the writes in a requestAnimationFrame callback, which runs immediately before the paint and is where visual changes belong anyway.`,
    explanation: `Inline styles are not what makes this slow. Applying the same change through a class thrashes exactly the same way, because the read is what forces the layout.

Chunking with setTimeout does unblock the page, and it does not make the work smaller. Two thousand layout passes spread over thirty frames is still two thousand layout passes, and now it takes half a second of wall clock as well.

getBoundingClientRect is not cached. It is one of the reads that flushes, so swapping to it changes nothing at all.`,
    hints: ['What has to be true before the browser can answer offsetHeight?'],
    tags: ['dom', 'performance'],
  },
  {
    id: 'bulk-insert-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'You have to replace a list with two thousand freshly built rows. Which version touches the live tree the fewest times?',
    options: [
      'Empty with innerHTML = "" and then append each row to the list in a loop, so the browser can render rows as they arrive',
      'Build a string of markup by concatenating two thousand row templates and assign it to list.innerHTML',
      'Append each row to a DocumentFragment, then call list.replaceChildren(fragment)',
      'Clone the list, append the rows to the clone off screen, then call list.replaceWith(clone)',
    ],
    correctOption: 2,
    answerInFull: `The fragment, with replaceChildren.

A DocumentFragment is a node with no parent and no presence in the document, so building inside it costs nothing: there is no layout to invalidate, because nothing you are touching is on screen. When you append the fragment somewhere, the fragment itself does not go in. Its children move across and the fragment is left empty, so the tree sees one insertion of two thousand nodes rather than two thousand insertions.

replaceChildren does the other half in the same breath. It removes the existing children and inserts the new ones, so there is no separate empty-the-list step, and calling it with no arguments at all is the clean way to empty an element.

    const fragment = document.createDocumentFragment()
    for (const item of items) fragment.append(makeRow(item))
    list.replaceChildren(fragment)

Why the others are worse is more interesting than why this one is right.

The string version also touches the tree once, and it gives up nodes for text. You cannot attach a listener, set a property or hold a reference while building, every value has to be escaped by hand, and any user data in there is an injection waiting to happen.

The clone version genuinely does build off screen, and it throws away the element you started with. Every reference to the old list is now stale, any listener on the list itself is gone, and if the list had CSS state or an id-based style you have a subtle bug.

And the honest follow-up: at two thousand rows the insertion is no longer the expensive part. Two thousand rows is two thousand rows to lay out and paint. The answer at that scale is to render only what fits on screen.`,
    explanation: `The append-in-a-loop version does not let the browser render as it goes. Rendering happens between tasks, and a synchronous loop is one task, so the two thousand insertions all land before a single frame is painted. What you get is the invalidation cost with none of the imagined benefit.

The string version is a real technique and its cost is in what a string cannot carry, not in speed.

Cloning is close to right and replaces the wrong thing. Building off screen is the idea; the fragment is how you do it without discarding the element you already have.`,
    hints: ['Which of these puts something into the document more than once?'],
    tags: ['dom', 'performance'],
  },
  {
    id: 'scoped-selector-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'Each row contains a nested table of variants, and both the row and the variants have cells with the class price. row.querySelector(".price") keeps finding a variant price. Which fix is correct?',
    options: [
      'row.querySelector(":scope > .price"), which anchors the selector at the row so only its own direct children match',
      'row.getElementsByClassName("price")[0], because a live collection is ordered by position in the tree and the row\'s own price comes first',
      'document.querySelector("#" + row.id + " .price"), which makes the scope explicit by naming the row in the selector',
      'row.querySelector(".price:first-of-type"), which takes the first price rather than the deepest one',
    ],
    correctOption: 0,
    answerInFull: `:scope, with a child combinator.

The thing to understand is what element.querySelector actually does. It searches the element's descendants, but the selector itself is still matched against the whole document, so an ancestor named in the selector can be an element outside the subtree you called it on. That is why row.querySelector("div .price") can match a price whose only div ancestor is the page wrapper.

:scope is the pseudo-class that refers to the element you called the method on. Written as ":scope > .price" it says: a price that is a direct child of this row. The nested variant prices are grandchildren or deeper, so they cannot match.

    row.querySelector(':scope > .price')

Two related tools worth having beside it. closest walks up from an element through its ancestors and returns the first match, which is how you get from a clicked node to the row that owns it. matches asks whether one element satisfies a selector, which is the test you want inside a filter.

If the structure allows it, a more specific class is better than a cleverer selector. A row price and a variant price doing different jobs is an argument for calling them different things, and a selector that has to defend against your own markup is usually a hint that the markup is ambiguous.`,
    explanation: `Taking index zero of a collection ordered by document position happens to work here and works by accident. Reorder the markup, or put the variants above the price, and it silently returns the wrong cell. Correctness by layout is not correctness.

Building a selector string by concatenating an id assumes the row has one, and it is the injection shape of the DOM: an id that came from data can break out of the selector.

first-of-type counts among siblings of the same tag, not among matches of the selector, so it is answering a different question. The deepest match is not what the browser returns anyway; document order is.`,
    hints: ['Which element is the selector matched against?'],
    tags: ['dom', 'selectors'],
  },
  {
    id: 'attribute-vs-property-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A "revert" button is meant to put a form back to the values it loaded with. It reads each input with getAttribute("value") and it works. A colleague changes it to read input.value and it now reverts to whatever the user just typed. What is going on?',
    options: [
      'input.value is a getter that reads the attribute, so it should behave identically. The change must have broken something else in the same commit',
      'The attribute holds the value the markup loaded with and never changes as the user types, while the property holds the current value, so the original version was reading the initial state on purpose',
      'The attribute is stale because the browser only syncs it back on form submission, so reading it before submit gives an out-of-date value',
      'Both are current, but getAttribute returns a string while value returns the coerced type, so the revert was comparing different types and doing nothing',
    ],
    correctOption: 1,
    answerInFull: `The original code was right, and it was right for a reason nobody wrote down.

For value, checked and selected, the attribute and the property are deliberately different things. The attribute is the initial state: what the markup said, what getAttribute reads, and what a form reset goes back to. The property is the current state: what the user has typed, what the form will submit, and what input.value reads. Typing changes the property and leaves the attribute alone.

So getAttribute("value") is a genuine way to ask "what did this load with", which is exactly what a revert button needs.

That said, this is a fragile way to hold that state, and the interview answer should say so. The attribute is only the original value while nothing has assigned to it, and setting input.value = x leaves it untouched while setting input.defaultValue = x changes it. A revert built on the attribute quietly depends on nobody ever writing to the attribute for any other reason.

The version I would ship keeps the loaded values in a plain object when the form is populated and restores from that. It says what it means, it survives someone touching defaultValue, and it works for controls where the pattern does not apply at all.

The general rule for the rest of the DOM: most attributes and properties do stay in sync, class and className and id among them, and the form controls are the exception that costs people a day. Also worth knowing that some names differ, class against className, for against htmlFor, because the attribute names were already keywords.

And a form reset is built in. If the form really has loaded straight from markup, form.reset() does this without any of it.`,
    explanation: `The property is not a getter over the attribute. They are separate state, and the sync between them runs one way at parse time.

There is no deferred sync on submit. The attribute is never updated from typing at all, at any point.

Type coercion is a real difference between the two and not this behaviour. input.value is a string too.`,
    hints: ['What does a form reset put the field back to, and where does it read that from?'],
    tags: ['dom', 'forms'],
  },
  {
    id: 'render-large-list-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'A table renders fifty thousand rows and the page freezes for several seconds on load, then scrolls badly afterwards. Walk me through how you would diagnose and fix it.',
    answerInFull: `The answer has to separate three costs that all look like "the page is slow", because the fix is different for each.

First, is it the insertion, the layout, or the data. Insertion cost is how many times you touch the tree, and it is the one thing you can fix without changing the design: build in a DocumentFragment and insert once. Layout and paint cost is proportional to the nodes that exist, and no amount of batching helps, because fifty thousand rows are fifty thousand boxes to position. Data cost is the JSON parse and whatever mapping happens before any of it. Profile before guessing, and the profiler tells you directly: a long Recalculate Style or Layout block is the second cost, a long yellow scripting block is the third.

For fifty thousand rows it will be the second, and the honest answer is that the fix is to stop creating them. Render the rows that fit on screen plus a small buffer, and swap their contents as the user scrolls. That is windowing, or virtual scrolling, and it makes the node count constant in the viewport rather than proportional to the data. It costs you: find on page stops working, so does anchor linking to a row, and printing needs a separate path. Those are real trade-offs to name rather than skip.

If windowing is genuinely off the table, the next answer is pagination, which is the same idea with a worse user experience and a tenth of the work. After that, keep the rows but make each one cheaper: fewer nodes per row, no per row event listeners, contain: content or content-visibility: auto so the browser can skip laying out what is off screen.

The bad scrolling afterwards is a separate diagnosis and usually one of two things. Either the scroll handler is doing layout reads, so every scroll event forces a layout pass, which is fixed by reading once and writing in a requestAnimationFrame, or better by using IntersectionObserver so there is no scroll handler at all. Or the rows are expensive to paint and the fix is on the CSS side.

What I would not do is chunk the insertion with setTimeout and call it fixed. It unblocks the first paint and leaves every one of the fifty thousand rows in the document, so scrolling stays bad and memory stays high. It converts one visible freeze into a slow page, which is often worse because nobody files a bug about it.`,
    hints: [
      'Name the three separate costs before naming a fix.',
      'What does the fix cost the user, and what would you not do?',
    ],
    tags: ['dom', 'performance'],
  },
]
