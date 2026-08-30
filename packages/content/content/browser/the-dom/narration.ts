import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Where the rest of this track happens',
    heading: 'Why this matters',
    script: `Everything else in this track happens to the tree. Events travel
      through it, fetch exists to put things into it, and storage exists to
      survive it being thrown away. So it goes first.

      It is also the topic where interview answers are thinnest. Most people can
      name querySelector and stop. The questions that separate candidates are the
      ones about the model rather than the method names. What the tree is a model
      of, which collections change under you, and why the browser gets slow when
      you touch it in the wrong order.`,
  },
  {
    title: 'The bytes are gone',
    heading: 'The tree is not your HTML',
    script: `The HTML you serve is a byte stream. The browser parses it once, into
      a tree of objects, and from that moment the bytes are gone. The tree is
      what exists.

      Three consequences, before any method names.

      The tree can hold things the HTML never said. An unclosed list item, a
      paragraph inside a paragraph, a table row outside a table. The parser has
      recovery rules for all of them, and what you get is what the rules
      produced, not what you typed. Read innerHTML back and you get a
      serialisation of the tree, which is frequently not the markup you sent.

      Properties and attributes are different things. The attribute is what the
      markup said. The property is the current state. Type into an input and the
      value property changes while the value attribute still reports whatever the
      page loaded with. For value, checked and selected, the attribute is the
      initial value and the property is the live one, and confusing them is the
      most common bug in a form.

      And none of this is JavaScript. There is no document defined by the
      language, and no engine on its own has one. It is supplied by the browser,
      which is why this is a separate track, and why every one of these objects
      behaves slightly unlike an ordinary object. A NodeList is not an array, a
      classList is not a Set, and a style is not a plain object.`,
  },
  {
    title: 'Two families of lookup',
    heading: 'Finding things',
    script: `Two families, and the difference between them is the part that
      matters.

      querySelector and querySelectorAll take any CSS selector and search the
      subtree of whatever you call them on, so asking a row for a price is scoped
      to that row. Prefer them. getElementById is the one older lookup worth
      keeping, because it is the only one that does not involve matching a
      selector at all.

      Three things people get wrong about the results.

      querySelectorAll returns a NodeList, which has forEach and nothing else
      from the array methods. No map, no filter, no find. Spread it, or use Array
      from, when you want them.

      Children and childNodes are not the same. Children is elements. ChildNodes
      is every node, including text nodes made of the whitespace between your
      tags. A pretty printed list has a text node between every item, so asking a
      three item list for the length of its childNodes usually answers seven.

      And a selector is matched against the whole document, not against where you
      started. Asking a row for a price that sits inside a div requires a div
      inside the row, and the row itself does not count as that ancestor. The
      scope pseudo-class is what fixes that.`,
  },
  {
    title: 'A snapshot, or a standing query',
    heading: 'Live and static',
    script: `querySelectorAll gives you a snapshot. getElementsByClassName,
      getElementsByTagName and the children property give you a live view, which
      reflects the tree as it is now, every time you look at it.

      A live collection is really a standing query. Nothing was stored when you
      made it, so reading its length asks the tree again.

      That sounds convenient and is mostly a hazard, because of the loop it
      breaks. Take a live collection of rows, loop forward by index, and remove
      each one. Removing index zero shifts everything down while the index moves
      up, and the length shrinks as you go. Half the rows survive. The same loop
      over a snapshot is correct, because the snapshot does not move under you.

      The fixes all come down to removing the liveness or removing the movement.
      Iterate backwards, spread into an array first, or query with
      querySelectorAll.

      One more thing worth carrying out of this section. A node removed from the
      tree is detached, not destroyed. It is still a perfectly good object, it
      still has its listeners, and appending it somewhere else puts it back.`,
  },
  {
    title: 'Move a node, or parse a string',
    heading: 'Changing the tree',
    script: `Everything that changes the tree is either moving a node or parsing a
      string.

      Append, prepend, before and after are the modern set. They take several
      arguments, and they take strings, which become text nodes. The older
      appendChild takes one node. Both have the property that surprises people:
      appending a node that is already in the tree moves it. There is no copy. If
      you want one, ask with cloneNode, whose argument is whether to bring the
      descendants too.

      Then the two ways of putting content in. textContent sets text. innerHTML
      parses a string as markup and replaces the subtree with the result. Follow
      one rule without thinking about it. textContent for anything that came from
      a user or a server, innerHTML only for markup you wrote. Assigning user
      input to innerHTML is how a page runs somebody else's script, and escaping
      by hand is never as reliable as using the property that cannot parse.

      Appending to innerHTML with plus equals is worse than either. It serialises
      the whole subtree to a string, concatenates, and re-parses the result,
      which destroys and rebuilds every node inside. Every listener is gone,
      every input loses what was typed in it, and every reference you were
      holding now points at a detached node. When you want to add markup, use
      insertAdjacentHTML, which parses only the fragment.

      And when you are building many nodes, build them off screen. A document
      fragment is a node with no parent that disappears into its children when
      you append it, so the tree is touched once instead of a thousand times.
      Replace children, called with the fragment, does the removal and the
      insertion together, and called with nothing it is the honest way to empty
      an element.`,
  },
  {
    title: 'Writes batch, reads flush',
    heading: 'What a read costs',
    script: `Writes to the DOM are cheap and lazy. The browser queues the change
      and recalculates layout later, once, before it paints. That batching is
      what makes a hundred small writes affordable.

      Reading a geometric property breaks it. Offset height, offset top, get
      bounding client rect, scroll top, get computed style, and a dozen others,
      cannot be answered from the queue, because the answer depends on every
      pending change. So the browser stops, computes layout for the whole
      document, and then gives you the number.

      Once per frame that is fine. Once per iteration, in a loop that also
      writes, it is a full layout pass for every element you touch. A hundred
      boxes is a hundred layout passes, each one over the entire document rather
      than over the box you touched.

      The fix changes nothing about the work and everything about the order. Do
      every read first, while nothing is pending, so the first one forces layout
      and the rest are answered from it. Then do every write, with no read
      between them, so they all stay queued and flush together before the next
      paint.

      The pattern has a name, and interviewers use it: this is layout thrashing,
      and the fix is read then write batching. If the reads and writes genuinely
      cannot be separated, put the writes in a request animation frame callback,
      which runs just before the browser paints, and so is the right place to be
      making visual changes anyway.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what the DOM is, say: the browser's object model of the parsed
      document. Not the HTML you sent, and not part of JavaScript. It is supplied
      by the host, which is why the same code has no document in Node.

      Asked for the difference between querySelectorAll and
      getElementsByClassName, say one returns a static snapshot and the other a
      live collection that re-answers from the tree every time you read it. Then
      give the loop that breaks on the live one, because that is the reason the
      question gets asked at all.

      Asked how you would add five thousand rows without freezing the page, say
      build them in a document fragment and insert once, so layout runs once.
      Then be honest about the limit. If it still blocks, the problem is not the
      DOM work, it is that five thousand rows are five thousand rows, and the
      answer is to render only what is on screen.

      Asked why a loop is slow, say layout thrashing, say that a geometric read
      has to flush the writes queued before it, and say the fix is all the reads
      and then all the writes.

      Expect a follow up on innerHTML and user input, and answer it with
      textContent rather than with escaping.`,
  },
]
