import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Closures are not an advanced feature you reach for occasionally.
      They are how every callback, every event handler, every module and every
      hook in React keeps hold of the data it needs.

      If you have ever wondered why a timeout inside a loop prints the wrong
      number, or why a React effect sees a stale value, the answer is the same
      one both times, and it is this topic.

      Interviewers like closures because a shallow answer and a real one look
      very different, and the difference shows up in a single sentence. By the
      end of this you will have that sentence.`,
  },
  {
    title: 'The idea',
    heading: 'The idea',
    script: `Every function carries a hidden reference to the scope it was
      defined in. Defined in, not called from. That is the whole mechanism.

      Normally, when a function returns, its local variables become unreachable
      and go away. But if an inner function survives the return, then so does
      the scope it points at, because the inner function is still holding a
      reference to it.

      Now the crucial word, and it is the word that separates a shallow answer
      from a real one. A closure captures the variable, not the value. It
      captures the binding itself. So if that variable changes later, every
      closure over it sees the new value. Nothing was copied at the moment the
      closure was created.`,
  },
  {
    title: 'Two counters, two scopes',
    heading: 'Watching one run',
    script: `Picture a factory function that declares a count starting at zero,
      and returns an inner function that increments it and hands it back.

      Call the factory once and you get a function with its own private count.
      Call it a second time and you get a completely separate function with a
      completely separate count. The second one cannot see the first one's
      count, and never will, because each call to the factory created a fresh
      scope.

      So calling the first counter twice and the second counter once prints one,
      two, one.

      Here is the change worth making by hand, because it is the entire concept
      in one edit. Move the count declaration above the factory instead of
      inside it. Now there is one variable rather than one per call, both
      counters share it, and the same three calls print one, two, three.`,
  },
  {
    title: 'Captured, not copied',
    heading: 'Captured, not copied',
    script: `This is why the classic loop puzzle behaves the way it does.

      Take a loop using var, scheduling a timeout on each pass that prints the
      loop variable. All three print three. The reason is that var is function
      scoped, so the loop creates exactly one binding. All three callbacks
      capture a reference to that same single box. And nothing runs until the
      loop has finished, by which point the loop has written three into the box.

      Switching to let fixes it, and it is worth knowing exactly why rather than
      just knowing that it works. The specification creates a new binding for
      each iteration, and copies the previous value into it. So there are three
      variables, and each closure gets its own.

      One caveat that catches people. That per iteration binding is a loop
      feature, not a block feature. A single let declared outside the loop
      brings the shared binding problem straight back.`,
  },
  {
    title: 'What it costs',
    heading: 'Traps',
    script: `Closures are not free, and the cost is the thing interviewers probe
      when they ask about memory.

      A closure keeps its whole enclosing scope reachable. Not only the
      variables it actually uses. The whole scope. So a small event handler,
      defined next to a large array in the same function, can keep that entire
      array alive for as long as the handler is registered.

      That is the honest answer to how a closure causes a memory leak. It is
      also why removing listeners you added is not just tidiness. The listener
      is a closure, and while the browser holds it, it holds everything the
      closure could reach.`,
  },
  {
    title: 'The sentence to have ready',
    heading: 'The interview angle',
    script: `Asked what a closure is, a weak answer stops at: a function that
      remembers its variables. A strong answer adds the consequence.

      Here it is. A closure is a function plus the scope it was defined in. It
      captures the variable, not the value, so closures over the same binding
      stay in sync. And the captured scope stays alive as long as the closure
      does.

      That last clause is the one that leads somewhere, because it explains both
      the loop puzzle and the memory question in the same breath.

      Expect these follow ups. Rewrite the var loop two different ways.
      Implement once, or memoize, or debounce, or a private counter. How is this
      different from a private class field? And how could a closure cause a
      memory leak? You now have an answer to all four.`,
  },
]
