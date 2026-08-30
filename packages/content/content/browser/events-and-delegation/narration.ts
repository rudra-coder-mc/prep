import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'One question, four bugs',
    heading: 'Why this matters',
    script: `Delegation is the most reliably asked front end question that is not
      about a framework, and it is asked because the answer shows whether you
      know the event model or only the method name. Everyone can attach a click
      handler. The follow up questions are about the path the event took to get
      there.

      It is also the topic that explains a whole class of bugs that look
      unrelated. The button that stops working after a re-render. The modal that
      closes when you click inside it. The form that submits when you meant to
      validate. The scroll that stutters. All four are the same three ideas.`,
  },
  {
    title: 'Down, then back up',
    heading: 'Three phases, one path',
    script: `An event does not fire on an element. It travels a path, and the
      path is computed once, before anything runs.

      The browser takes the target and walks up to the root, collecting every
      ancestor. The event then goes down that list, from the window to the
      target, which is the capture phase. It arrives at the target. Then it comes
      back up, which is the bubble phase. Every listener on the path gets its
      turn, in that order.

      Capture is opt in. Pass true, or an options object with capture set, when
      you add the listener. Everything else is bubbling, which is the default,
      and which is the phase delegation uses.

      Two properties tell you where you are, and mixing them up is the commonest
      delegation bug. The target is what the event happened to, and it never
      changes as the event travels. The current target is the element whose
      listener is running right now. It changes at every step, and it is what
      this is bound to in a listener written as a normal function. The current
      target is only meaningful while the listener runs. Read it after an await
      and it is null.

      And not everything bubbles. Focus and blur do not, which is why focusin and
      focusout exist and do. Mouse enter and mouse leave do not, which is why
      mouse over and mouse out exist and do. When delegation mysteriously does
      not work, check whether the event bubbles before you check anything else.`,
  },
  {
    title: 'One listener that outlives the rows',
    heading: 'Delegation',
    script: `Delegation is one listener on an ancestor instead of one listener per
      element. The handler asks what was clicked, using closest, which walks up
      from the target through its ancestors and returns the first match. That is
      what turns "you clicked the icon inside the span inside the button" into
      "you clicked the button".

      Three reasons to do it, and they are not equally important.

      It survives the tree changing. This is the real reason. Rows that did not
      exist when the listener was attached are handled anyway, because the
      listener is not on them. Any code that rebuilds its markup gets this for
      free and otherwise has to reattach by hand, and will eventually forget.

      It is one registration instead of many. Real, and secondary. A thousand
      listeners is measurable at the margin and is rarely what makes a page slow.

      And there is one place to look. A single handler that reads the target is
      easier to reason about than a thousand closures, each capturing whatever
      was in scope when its row was built.

      The cost is that the handler now has to work out what was clicked, and
      getting that wrong is quiet rather than loud. Match on something
      structural, a class or a data attribute, never on tag name or text. And
      always use closest rather than comparing the target to an element, because
      the target is whatever the pointer actually landed on.`,
  },
  {
    title: 'Two names, two unrelated jobs',
    heading: 'Stopping and preventing',
    script: `Prevent default cancels the browser's built in reaction. The form
      does not submit, the link does not navigate, the checkbox does not tick.
      The event carries on along its path exactly as before, and every remaining
      listener still runs.

      Stop propagation ends the journey. No listener further along the path runs.
      The default action still happens, because the default is not a listener.

      Stop immediate propagation does that and also skips the other listeners on
      the current element, which are otherwise all run in registration order.

      The rule of thumb worth stating: prevent default is almost always what you
      wanted, and stop propagation is almost always a bug waiting to be filed. It
      breaks things it cannot see. A click that stops propagating never reaches
      the document, so the dropdown that closes on an outside click stays open,
      the analytics listener records nothing, and nobody connects the two.

      There is one more source of confusion, which is returning false. In an
      inline onclick attribute, and in jQuery, returning false means prevent
      default and stop propagation together. In a listener added with add event
      listener, it means nothing at all.

      Passive listeners are the other half of this. A scroll or touch listener
      blocks scrolling until it finishes, because the browser cannot know whether
      you are about to prevent the default. Marking a listener passive promises
      that you will not, and lets the browser scroll immediately. Touch start,
      touch move and wheel listeners on the document are already passive by
      default, which is why preventing the default in one of them does nothing
      and logs a warning.`,
  },
  {
    title: 'The shape of a front end leak',
    heading: 'The listener you forgot to remove',
    script: `Removing a listener needs the same type, the same options, and the
      same function reference. Not an equal function. The same one. A listener
      added as an inline arrow can never be removed, because there is no way to
      name it again.

      That matters more than it sounds, because of what a listener holds. The
      listener holds the handler, the handler closes over its scope, and the
      element holds the listener. So a listener on something long lived, the
      window, the document or a store, keeps the entire component that registered
      it alive for as long as the page is open. That is the shape of most front
      end memory leaks, and the handlers keep firing too, doing work against a
      component nobody can see.

      Three ways not to have the problem. Keep the reference, and pass the same
      one to add and to remove. Use the once option, for a listener that fires and
      goes. Or pass an abort signal.

      The signal is the one to reach for. It is the same abort controller that
      cancels a fetch. A component holds one controller, registers everything
      with its signal, and calls abort when it tears down. There is no list of
      removals to keep in step with the list of additions.

      Delegation helps here too, for the same reason it survives re-renders. A
      listener on a container that outlives the rows is one registration whose
      lifetime you can actually reason about.`,
  },
  {
    title: 'Your own events, in the same tree',
    heading: 'Custom events',
    script: `You can dispatch your own events through the same tree, caught by the
      same listeners. Two details do all the damage.

      A custom event does not bubble unless you say so. The default is false,
      which is the opposite of what built in events trained you to expect, and it
      is the single most common reason a custom event appears not to fire at all.

      And the payload goes in detail. The custom event constructor reads bubbles,
      cancelable, composed and detail from its options, and ignores anything
      else, so properties put beside them are simply dropped. The base event
      constructor has no detail at all.

      Two more things worth knowing. Dispatching is synchronous. It runs every
      listener and returns when they are done, so it behaves like a function
      call, not like a queued task. And it returns false when a listener
      prevented the default, which is only meaningful if you constructed the
      event as cancelable.

      This is a decent decoupling tool for parts of a page that should not know
      about each other, and it is not a general event bus. The listener has to be
      on an ancestor of the dispatching element, which means the tree decides who
      can hear you.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what event delegation is and why you would use it, say: one
      listener on a container instead of one per child, working because events
      bubble. Then give the reason, which is that it keeps working when the
      children are replaced, and the children are replaced on every render. Fewer
      listeners is a side benefit, not the point.

      Asked for the difference between target and current target, say the target
      is what the event happened to and never changes, and the current target is
      whose listener is running, which changes at every step of the path, and is
      what this is in a normal function listener.

      Asked about prevent default against stop propagation, say they are
      different jobs. One cancels the browser's reaction and lets the event carry
      on. The other ends the path and leaves the reaction alone. Then say that
      stop propagation breaks listeners you cannot see, and that you avoid it.

      Asked how you clean up listeners, say: keep the reference, or use once, or
      pass an abort signal and abort it. Then say why it matters, which is that a
      listener on the window keeps everything it closed over alive.

      Expect a follow up on capture, and answer it with when you would use it.
      Catching an event before something further in can stop it.`,
  },
]
