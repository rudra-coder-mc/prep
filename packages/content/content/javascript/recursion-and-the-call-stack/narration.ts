import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Recursion is how you walk anything shaped like a tree, and a
      surprising amount of what you handle every day is one. The document object
      model. A file system. A JSON response with objects inside objects. A
      comment thread. A menu with sub-menus.

      Writing the loop version of a tree walk by hand is the fastest way to
      understand why the recursive version exists at all.

      The other half of this topic is the call stack, and that is why it sits
      here rather than with the other function topics. The stack is the thing the
      event loop takes turns with. Knowing exactly what a call costs, and exactly
      when a frame goes away, is the groundwork for everything asynchronous that
      comes after this.`,
  },
  {
    title: 'What a frame holds',
    heading: 'What a frame holds',
    script: `Every call pushes a frame onto the call stack. That frame holds three
      things: the parameters for this particular call, its local variables, and
      the position to return to when it finishes.

      The frame is popped the moment the function returns. Not a moment before.

      That is the sentence that explains the cost of recursion. A function that
      calls itself ten thousand deep has ten thousand frames alive at the same
      time, each with its own copy of the locals, because none of them can return
      until the innermost one does. A loop doing the same work enters and leaves
      one frame over and over, so only one is ever alive.

      The stack has a fixed size, and when there is no room to push another
      frame, the engine throws a range error saying the maximum call stack size
      was exceeded. Roughly ten thousand frames is the order of magnitude in a
      browser. But it depends on the engine and on how large each individual
      frame is, so it is emphatically not a number to design against.`,
  },
  {
    title: 'Watching the stack',
    heading: 'Watching the stack',
    script: `Here is the part people get wrong when they describe recursion.
      Nothing is computed on the way down.

      Take factorial of three. The first call cannot return anything, because it
      needs factorial of two first. So it waits. That one needs factorial of one,
      so it waits too. Three frames are now sitting on the stack, each holding
      its own value of n, and not one multiplication has happened yet.

      Then the base case returns one without calling anything, and that is what
      stops the descent. Now the stack unwinds, and every multiplication happens
      on the way back up, innermost first.

      Two things to take away from that. The base case is the only thing that
      makes the stack shrink, so a recursion without one grows until it crashes.
      And the work happening on the way back up is why the depth is not free to
      trade away: every one of those waiting frames is holding a value that
      is still needed.`,
  },
  {
    title: 'When it runs out',
    heading: 'When it runs out',
    script: `There are two different ways to run out of stack, and they want
      different fixes.

      The first is that the base case is never reached. It is missing, or the
      call does not move towards it, or it is written after the recursive call so
      it is never consulted. That is a bug, and the fix is inside the function.

      The second is that the input is genuinely deep. A linked list of a hundred
      thousand nodes. JSON nested a few thousand levels by whatever generated it.
      The function is correct and the data is bigger than the stack. Here
      the fix is to stop using the stack at all.

      Now, you may have read that tail calls solve this. Proper tail calls are in
      the specification. A call in tail position, meaning its result is returned
      directly with nothing left to do afterwards, is supposed to reuse the
      current frame rather than push a new one.

      In practice, only JavaScriptCore, which is Safari, implements it. V8 and
      SpiderMonkey do not, and have said they will not, mostly because of what it
      does to stack traces. So write tail calls if you like the style, and never
      depend on them for depth.`,
  },
  {
    title: 'Turning recursion into a loop',
    heading: 'Turning recursion into a loop',
    script: `There are two rewrites, and which one you need depends on the shape
      of the recursion.

      Linear recursion, where each call makes one further call, becomes a loop
      with an accumulator. Straightforward.

      Tree recursion, where each call makes several, becomes a loop with an array
      standing in for the stack. And that array is the stack, just moved from the
      engine onto the heap, which is exactly why it can grow far past the frame
      limit.

      The mapping is direct. Popping from the array is entering a call. Pushing
      onto it is making one. The loop condition, run while there is anything
      pending, is the base case turned inside out.

      One thing to watch. Taking from the end of the array walks depth first, and
      the children come out in reverse order. Taking from the front makes it a
      queue and walks breadth first. Whichever you choose, say which one you
      chose, because it walks the tree is not a specification.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `The questions are always the same handful. Flatten a nested array.
      Walk a tree. Deep clone an object. Reverse a linked list. Count the nodes
      in a JSON document.

      A complete answer names four things. The base case. The recursive case. The
      step that makes progress towards the base case. And how deep the input can
      get.

      That fourth one is what the interviewer is actually listening for. If the
      depth is unbounded, or comes from outside the program, you say you would
      write it iteratively with an explicit stack. That single clause is the
      difference between somebody who knows recursion and somebody who has
      shipped it.

      And keep one distinction sharp, because it comes up constantly. Naive
      Fibonacci is slow because it recomputes the same subtrees, not because the
      stack is deep. Its depth is only n. That one is fixed by memoising, and
      rewriting it as a loop fixes it too, but neither of those is fixing the
      stack, because the stack was never the problem.`,
  },
  {
    title: 'Traps',
    heading: 'Traps',
    script: `Six of these, and every one of them has bitten somebody I know.

      Depth and repeated work are different problems with different fixes. Do not
      reach for a loop when you needed a cache.

      The base case has to come first. Written after the recursive call, it is
      unreachable.

      Cycles never terminate. A deep clone or a tree walk over data that
      references itself recurses forever. Keep a weak set of what you have
      already seen.

      Untrusted depth is a crash waiting to happen. Recursing over JSON that
      arrived in a request means the caller is choosing your stack depth.

      Catching the overflow does not fix it. The range error is catchable, but
      the handler runs on a stack that has just been unwound, and the work is
      gone. It is a way to observe the limit, not a way to survive it.

      And every frame keeps its locals alive. A recursive function holding a
      large array in a local variable keeps one of those per level, so depth
      multiplies memory as well as frames.`,
  },
]
