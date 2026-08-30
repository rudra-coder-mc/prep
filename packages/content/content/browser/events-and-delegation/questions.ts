import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'delegation-why-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'What is the main reason to put one click listener on a list instead of one on every row?',
    options: [
      'Because a thousand listeners is a thousand function objects, and the memory saving is what makes long lists feasible',
      'Because it keeps working when the rows are replaced, and rows get replaced on every render, so there is nothing to reattach and nothing to forget',
      'Because listeners on a container run before listeners on the rows, so the container can validate the click and cancel it',
      'Because a listener on a row only fires when the click lands on the row itself, so nested content inside the row would otherwise be missed',
    ],
    correctOption: 1,
    answerInFull: `Because the listener is not on the thing that keeps being thrown away.

Rows are replaced. A re-render, an innerHTML assignment, a sort, a filter: any of them discards the row nodes and builds new ones, and every listener attached to those nodes goes with them. Code that attaches per row has to reattach on every one of those paths, which means every new path somebody adds is a chance to forget. A listener on the list is attached once and handles rows that did not exist when it was registered, because it is not on them. The event reaches it by bubbling.

The other two benefits are real and secondary. One registration instead of a thousand is measurable at the margin and is almost never what is making a page slow. And one handler that reads the target is easier to reason about than a thousand closures, each capturing whatever happened to be in scope when its row was built.

The cost is that the handler has to work out what was clicked, and getting that wrong is quiet rather than loud.

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.delete')
      if (!button || !list.contains(button)) return
      remove(button.closest('.row').dataset.id)
    })

Match on something structural, a class or a data attribute, never on tag name or text. Use closest rather than comparing event.target to an element, because the target is whatever the pointer actually landed on, which is usually a span or an icon inside the button.`,
    explanation: `Memory is the answer people give when they have read about delegation rather than used it. It is true and it is not why anyone reaches for this.

Container listeners running first describes capture, which is a phase you have to opt into. Delegation uses the bubble phase, so the container runs last.

The last option has it backwards: a listener on a row fires for clicks anywhere inside the row, because the event bubbles up to it. That property is exactly what delegation is built on.`,
    hints: ['What happens to a listener when the node it is on is replaced?'],
    tags: ['events', 'delegation'],
  },
  {
    id: 'target-vs-currenttarget-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is the difference between event.target and event.currentTarget?',
    options: [
      'target is the element whose listener is running, and currentTarget is the outermost element the event will reach',
      'target is what the event happened to and never changes as the event travels, while currentTarget is the element whose listener is running right now',
      'They are the same during bubbling and differ only during capture, when currentTarget is the ancestor being passed through',
      'target is set only on the element that registered the listener, and currentTarget is set only when the event was dispatched by your own code',
    ],
    correctOption: 1,
    answerInFull: `target is where it happened. currentTarget is where you are.

The browser computes the path before anything runs: the target and every ancestor up to the window. As the event walks that path, target is fixed and currentTarget is whichever element's listener is executing at that moment. On a listener attached to the target itself they are the same element, which is why the difference goes unnoticed until the first time somebody writes a delegated handler.

Two consequences worth carrying.

In a listener written as a normal function, this is bound to currentTarget. In an arrow function it is not, because an arrow has no this of its own and takes the enclosing one. That is the whole story of why a method written as an arrow in a class sees the instance and a normal one sees the element.

And currentTarget is only meaningful while the listener is running. The browser clears it when the listener returns, so reading it after an await or inside a setTimeout gives null. Capture what you need into a local first.

    list.addEventListener('click', async (event) => {
      const row = event.currentTarget      // read it now
      await save()
      row.classList.add('saved')           // not event.currentTarget, which is null here
    })`,
    explanation: `Swapping the two is the natural first guess, and the names encourage it: current sounds like the specific one and target sounds like the general one.

They do not differ only in capture. They differ at every step of the path where the listener is not on the target, which includes the whole bubble phase.

Neither depends on who dispatched the event. A custom event dispatched from your own code has both, set exactly the same way.`,
    hints: ['Which of the two can change while a single event is being handled?'],
    tags: ['events', 'dom'],
  },
  {
    id: 'propagation-order-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt:
      'eventPhase is 1 during capture, 2 at the target and 3 during bubbling. Put the lines this prints in the order it prints them.',
    code: `// <body><div id="card"><button id="buy">Buy</button></div></body>

const log = (name) => (event) => console.log(name, event.eventPhase)

body.addEventListener('click', log('body'), true)
card.addEventListener('click', log('card'), true)
buy.addEventListener('click', log('buy'))
card.addEventListener('click', log('card'))
body.addEventListener('click', log('body'))

buy.click()`,
    items: ['card 1', 'buy 1', 'body 1', 'buy 2', 'card 3', 'card 2', 'body 3', 'buy 3'],
    correctOrder: [2, 0, 3, 4, 6],
    answerInFull: `body 1, card 1, buy 2, card 3, body 3.

The path is computed before anything runs: window, document, html, body, card, buy. The event then walks it down and back up.

Down first, and only listeners registered with the capture flag are called. That is the body listener, then the card listener, both reporting phase 1. Notice that the body listener runs first even though the click was nowhere near the body; capture goes outside in, which is the reverse of what people expect.

Then the target. Listeners on the target run in the order they were added, and the capture flag is not consulted here at all, which is why the button prints once and reports phase 2 rather than printing once for each phase.

Then back up, calling the listeners that were not registered with capture: the card, then the body, both reporting phase 3. Bubbling is inside out, the mirror of the way down. This is the phase delegation uses, and it is why a listener on the list hears a click on a row.

The lines that do not print are the ones that assume the target is visited twice. It is on the path once, so its listeners run once, and the phase is 2 for all of them.

Worth knowing for the follow-up: capture is genuinely useful in one situation, which is catching an event before something further down can stop it. An analytics or logging listener on the document, registered with capture, sees clicks that a stopPropagation deeper in would otherwise hide.`,
    hints: ['How many times does the path include the target?'],
    tags: ['events', 'propagation'],
  },
  {
    id: 'stop-against-prevent-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'The button is inside a form and has no type attribute, so it is a submit button. What does clicking it do?',
    code: `form.addEventListener('submit', () => console.log('form submitted'))
document.addEventListener('click', () => console.log('document saw a click'))

button.addEventListener('click', (event) => {
  event.stopPropagation()
  console.log('button clicked')
})`,
    options: [
      'Logs "button clicked" only. Stopping propagation cancels the submit as well, since the submit is triggered by the click travelling on',
      'Logs "button clicked" and "form submitted". The document never hears the click, and the default action of the button still runs',
      'Logs "button clicked" and "document saw a click", then submits. stopPropagation only affects listeners in the capture phase',
      'Logs all three, since stopPropagation applies to the next event dispatched rather than to the one currently travelling',
    ],
    correctOption: 1,
    answerInFull: `"button clicked" and "form submitted", in that order. The document listener never runs.

This is the question that separates the two methods, and the separation is that a default action is not a listener.

stopPropagation ends the event's journey through the tree. Nothing further along the path is called, so the click never reaches the document. That is all it does.

The default action is the browser's own reaction to the click, and it is decided after the propagation is over, by looking at what was clicked rather than at who listened. A submit button inside a form submits it. Cancelling that needs preventDefault, which is the other method entirely and which does nothing to the propagation.

So the four combinations are all reachable and all mean different things. Neither: the event travels and the browser reacts. preventDefault: the event travels and the browser does not react. stopPropagation: the event stops and the browser reacts anyway, which is this code. Both: the event stops and nothing happens.

The practical rule: preventDefault is almost always what you meant, and stopPropagation is almost always a bug waiting to be filed, because it breaks listeners it cannot see. An outside-click handler on the document is the usual casualty, and the symptom appears somewhere else entirely.`,
    explanation: `Believing stopPropagation cancels the submit is the exact misconception the question exists to catch. The submit is not something a listener does.

stopPropagation is not phase-specific. Called anywhere on the path, it ends the path.

And it applies to the event in hand, not to a later one. It is a flag on that event object.`,
    hints: ['Is the browser submitting the form a listener, or something else?'],
    tags: ['events', 'forms'],
  },
  {
    id: 'listener-this-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What do the two listeners print when the button is clicked?',
    code: `class Panel {
  name = 'panel'

  bindNormal(button) {
    button.addEventListener('click', function () {
      console.log('normal:', this.name)
    })
  }

  bindArrow(button) {
    button.addEventListener('click', () => {
      console.log('arrow:', this.name)
    })
  }
}`,
    options: [
      'normal: panel, then arrow: panel. Both are methods of the instance, so this is the panel in each',
      'normal: undefined, then arrow: panel. A normal listener has this bound to the element, and a button has no name, while the arrow keeps the enclosing this',
      'normal: panel, then arrow: undefined. The arrow has no this of its own, so it falls back to the global object',
      'Both throw, because this is undefined in a class body under strict mode and reading name off it fails',
    ],
    correctOption: 1,
    answerInFull: `normal: undefined, then arrow: panel.

Two rules meeting, and neither is about events specifically.

The browser calls a listener with this bound to currentTarget, the element whose listener is running. So in the normal function, this is the button. A button element has no name property in the sense meant here, so reading it gives undefined rather than throwing.

An arrow function has no this of its own. It closes over the this of where it was written, which is inside a method of the instance, so it is the panel. The browser still sets a this when it calls the function; the arrow simply ignores it, because there is nothing to set.

This is why arrow listeners are the default in class-based code. It is also why the two most common workarounds exist for the normal case, and they are worth naming: bind the method when you register it, or use the currentTarget the browser hands you in the event, which is what this was going to be anyway.

The trap that follows from this: a bound function is a new function every time bind is called, so registering with a fresh bind and later trying to remove with another fresh bind silently removes nothing. Store the bound reference once.

    this.onClick = this.onClick.bind(this)   // once, in the constructor
    button.addEventListener('click', this.onClick)
    button.removeEventListener('click', this.onClick)   // the same function`,
    explanation: `Expecting both to see the instance is the reflex from writing methods, where the call site is what decides this and the call site is usually the object.

The arrow does not fall back to the global object. It has no this at all, so the lookup goes outward through the enclosing scopes exactly like any other name.

Nothing throws. this is the button, which is a real object, and a missing property is undefined.`,
    hints: ['What does the browser bind this to when it calls a listener?'],
    tags: ['events', 'this'],
  },
  {
    id: 'delegation-target-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Each delete button contains an SVG icon and a span of text. The delegated handler works when you click the very edge of the button and does nothing when you click the icon or the label. Why?',
    code: `list.addEventListener('click', (event) => {
  if (!event.target.classList.contains('delete')) return
  remove(event.target.dataset.id)
})`,
    options: [
      'Because the SVG and the span stop the click from bubbling, so it never reaches the list when they are the ones clicked',
      'Because event.target is the innermost element the pointer landed on, which is the icon or the span, and neither of those carries the delete class',
      'Because classList on an SVG element is an SVGAnimatedString rather than a DOMTokenList, so contains is not a method on it',
      'Because the handler runs during the bubble phase, and by the time it runs the target has been reassigned to the currentTarget',
    ],
    correctOption: 1,
    answerInFull: `Because target is the deepest element under the pointer, and that is almost never the element you drew the button around.

Click the icon and target is the SVG. Click the label and target is the span. Click the two pixels of padding between them and target is the button itself, which is why it works sometimes and looks intermittent rather than broken.

The fix is closest, which walks up from the target through its ancestors and returns the first match. That turns "you clicked the icon inside the span inside the button" into "you clicked the button".

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.delete')
      if (!button || !list.contains(button)) return
      remove(button.dataset.id)
    })

Two details in that fix. The contains check matters when the container is the document, because closest can walk all the way out past where you are listening. And reading the data attribute off button rather than off target is the other half of the same bug: the icon has no dataset id either.

Worth knowing about SVG specifically, since it comes up: an SVG element inside a button will be the target unless you give it pointer-events: none in CSS, which is the CSS-side version of this fix and is worth doing anyway for decorative icons.

The general principle for delegated handlers: never compare target to an element, and never test target directly. Ask what the target is inside.`,
    explanation: `Nothing stops the click. An SVG element and a span both bubble like any other element, and the handler does run; it just returns early.

The classList on an SVG element is a real DOMTokenList and contains works. The className property is the odd one, and it is not what is used here.

target is never reassigned. It is fixed for the whole journey, which is the property that makes it useful.`,
    hints: ['What exactly was under the pointer when the click happened?'],
    tags: ['events', 'delegation'],
  },
  {
    id: 'remove-listener-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This component is mounted and unmounted as the user navigates. Memory grows on every navigation and the old handlers keep running. Why does the cleanup not work?',
    code: `mount() {
  window.addEventListener('resize', () => this.reflow())
}

unmount() {
  window.removeEventListener('resize', () => this.reflow())
}`,
    options: [
      'Because removeEventListener has to be called with the same options object that was used to add the listener, and neither call passes one',
      'Because the two arrow functions are different function objects, and removal matches on reference, so nothing is ever removed',
      'Because a listener on window cannot be removed once the element that registered it has been detached from the document',
      'Because the removal has to happen before the component is detached, and unmount runs after, so the listener has already been orphaned',
    ],
    correctOption: 1,
    answerInFull: `Because removal matches on the function reference, and those are two different functions that happen to have identical source.

An arrow function expression creates a new object every time it is evaluated. The one passed to add and the one passed to remove are as unrelated as any two objects, so the remove call finds nothing matching and silently does nothing. There is no error, which is what makes this leak survive review.

The leak itself is worth being precise about. window outlives every component. It holds the listener, the listener holds the handler, the handler closes over this, and this is the component and everything it references. So each navigation leaves an entire component graph reachable from a root, and the handlers keep firing on resize, doing work against a component nobody can see.

Three ways not to have the problem.

Keep the reference:

    this.onResize = () => this.reflow()
    window.addEventListener('resize', this.onResize)
    window.removeEventListener('resize', this.onResize)

Use once, when the listener should fire exactly one time and go.

Or pass an abort signal, which is the one to reach for when there is more than one listener:

    this.controller = new AbortController()
    window.addEventListener('resize', () => this.reflow(), { signal: this.controller.signal })
    document.addEventListener('keydown', (e) => this.onKey(e), { signal: this.controller.signal })
    this.controller.abort()   // both gone, and no references to keep in step

That is the same AbortController that cancels a fetch, and one controller per component covers listeners, requests and observers together.`,
    explanation: `Options do participate in matching, and only capture does: a listener added with capture is not removed by a call without it. Neither call here passes any, so options are not the difference.

A listener on window is removable at any time. Nothing about detaching an element affects it, which is exactly why this leaks.

Ordering is not the issue either. The removal would work at any point if it named the same function.`,
    hints: ['How many function objects does this code create?'],
    tags: ['events', 'memory'],
  },
  {
    id: 'custom-event-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A quantity stepper deep inside a page should tell an ancestor cart component that an item was added, without the two knowing about each other. Which dispatch is right?',
    options: [
      'stepper.dispatchEvent(new CustomEvent("cart:add", { detail: { id, quantity }, bubbles: true }))',
      'stepper.dispatchEvent(new CustomEvent("cart:add", { id, quantity }))',
      'stepper.dispatchEvent(new Event("cart:add", { detail: { id, quantity }, bubbles: true }))',
      'window.dispatchEvent(new CustomEvent("cart:add", { detail: { id, quantity } }))',
    ],
    correctOption: 0,
    answerInFull: `The first. Dispatch on the element that the thing happened to, put the payload in detail, and ask for bubbling explicitly.

Three details, and each of the wrong answers gets exactly one of them wrong.

A custom event does not bubble unless you say so. The default for bubbles is false, which is the opposite of what built-in events trained you to expect, and it means a listener on an ancestor hears nothing. This is the single most common reason a custom event appears not to fire at all.

The payload goes in detail. The CustomEvent constructor reads bubbles, cancelable, composed and detail from its options object and ignores anything else, so properties put beside them are simply dropped. Event, the base constructor, has no detail at all.

And dispatch from the element, not from window. Dispatching where it happened is what lets any ancestor listen, which is the decoupling you wanted. Dispatching on window makes the tree irrelevant and turns the event into a global broadcast, which is occasionally what you want and is a different design.

Two more things worth knowing. dispatchEvent is synchronous: it runs every listener and returns when they are done, so it behaves like a function call rather than like a queued task. And it returns false when a listener called preventDefault, which is only meaningful if you passed cancelable: true, which is how you build a cancellable custom event such as one that lets a listener veto a close.

The honest limitation to state in an interview: the listener has to be on an ancestor of the dispatching element, so the tree decides who can hear you. This is a decoupling tool for parts of a page, not a general event bus.`,
    explanation: `Putting id and quantity directly in the options object looks the most natural and loses the data entirely: the constructor reads detail and ignores unknown keys.

Event instead of CustomEvent is the same mistake in a different place. The base constructor accepts bubbles, so the event travels, and detail is not part of its interface, so the payload never arrives.

Dispatching on window works, in the sense that a window listener hears it. It also throws away the reason to use the DOM for this at all, and it puts your event name in a global namespace.`,
    hints: ['Which of these actually carries the payload to a listener?'],
    tags: ['events', 'custom-events'],
  },
  {
    id: 'passive-scroll-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A parallax effect reads scroll position in a scroll listener and writes transforms. Scrolling is visibly janky on a phone. Which change addresses the cause?',
    options: [
      'Throttle the listener to once every 16 milliseconds, so it cannot run more often than the display refreshes',
      'Register the listener as passive, and move the writes into a requestAnimationFrame callback so the reads and writes are separated and the browser is free to scroll without waiting',
      'Register the listener with capture, so it runs before the browser begins scrolling and the transform is already applied by the time anything paints',
      'Replace the scroll listener with a resize listener on the scrolling element, since scroll fires far more often than the layout actually changes',
    ],
    correctOption: 1,
    answerInFull: `Passive, plus requestAnimationFrame. Those are two separate fixes for two separate causes, and the jank usually has both.

The first cause is that the browser cannot scroll until your listener has finished. A non-passive scroll or touch listener might call preventDefault, and the browser has no way to know without running it, so it waits. Marking the listener passive is a promise that you will not, and lets scrolling proceed immediately.

    window.addEventListener('scroll', onScroll, { passive: true })

The second cause is that the handler reads layout and then writes styles, which is layout thrashing inside the highest frequency event on the page. The fix is the same as it is anywhere else: read, then write, and do the writing where writing belongs.

    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        applyParallax(window.scrollY)   // write, once per frame
        ticking = false
      })
    }

That flag is the part people leave out. Scroll can fire several times per frame, and without it you queue several callbacks that all do the same work before one paint.

The better answer where it applies: do not listen to scroll at all. IntersectionObserver covers appearing and disappearing, position: sticky covers pinning, and a scroll-driven CSS animation covers a lot of parallax without any JavaScript on the main thread.

Worth knowing for the follow-up: touchstart, touchmove and wheel listeners on the document are already passive by default in browsers, which is why a preventDefault in one of them does nothing and logs a warning about it.`,
    explanation: `Throttling to 16 milliseconds reduces how often the work happens and does not stop the browser waiting for the listener, and its timer is unrelated to when frames are actually produced. requestAnimationFrame is the timer that is.

Capture changes when the listener runs relative to other listeners, and nothing about when the browser scrolls.

Scroll and resize are different events reporting different things, and a scrolling element does not resize as it scrolls.`,
    hints: ['Why would the browser wait for your listener before scrolling?'],
    tags: ['events', 'performance'],
  },
  {
    id: 'outside-click-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A dropdown closes when you click anywhere outside it, via a click listener on the document. It works everywhere except inside one modal, where the dropdown will not close at all. Nothing in the dropdown or the document handler mentions the modal. What is the most likely cause, and what would you change?',
    options: [
      'The modal is rendered in a portal outside the document body, so clicks inside it never reach the document. Render the dropdown into the same portal',
      'A handler inside the modal calls stopPropagation, so clicks in that subtree never reach the document listener. Remove the stopPropagation, or register the outside-click listener in the capture phase',
      'The modal calls preventDefault on click, which cancels the click before any listener runs, so the document handler is never called',
      'The document listener runs in the bubble phase and the modal is a sibling of the dropdown rather than an ancestor, so the event travels up a different branch of the tree',
    ],
    correctOption: 1,
    answerInFull: `Somebody inside the modal called stopPropagation, and the outside-click handler is one of the things it broke without knowing.

This is the standard shape of a stopPropagation bug and worth recognising by its symptoms. The breakage is in a component that does not mention the one that caused it, it is confined to one subtree, and the code that caused it looks entirely reasonable in isolation: a modal that stops clicks propagating so that a click inside it is not treated as a click outside it.

The other usual casualties are analytics, which silently under-reports for one region of the page, and any other outside-click handler, so the second dropdown someone adds has the same bug and it gets diagnosed twice.

Two fixes, and they answer different questions.

Remove the stopPropagation and make the modal's own handler check what was clicked instead. This is the right fix, because it puts the decision in the component that has the information, and it stops the modal from breaking listeners it has never heard of.

Or register the outside-click listener in the capture phase, so it runs on the way down and is already finished before anything in the modal can stop anything.

    document.addEventListener('click', onOutsideClick, { capture: true })

That is a genuine use of capture and it is also a workaround: it makes your listener unstoppable rather than making the modal well behaved. Reach for it when the stopPropagation is in code you do not own, which is often, since it lives in a lot of component libraries.

The general rule to say out loud: stopPropagation is a global side effect written locally. Prefer preventDefault, and where you truly need it, scope it to the narrowest possible handler.`,
    explanation: `A portal renders into a different part of the document body, not outside the document, so clicks still bubble to the document. This is worth knowing because it causes the mirror-image bug: a portalled dropdown is not a DOM descendant of the thing that opened it, so a contains check on the wrong element fails.

preventDefault cancels the browser's reaction and does not stop listeners from running. If it did, the difference between the two methods would not be worth asking about.

Bubbling always reaches the document from any element in it. There is no branch of the tree that does not lead to the root.`,
    hints: [
      'What could a component do locally that changes behaviour somewhere it never references?',
    ],
    tags: ['events', 'propagation'],
  },
  {
    id: 'delegation-limits-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'You have argued for event delegation. Your interviewer asks when it is the wrong choice. What do you say?',
    answerInFull: `The answer should name real limits rather than hedge, and there are four worth having.

The event has to bubble, and several do not. focus and blur do not bubble, so delegating focus handling means focusin and focusout instead. mouseenter and mouseleave do not bubble, and their bubbling counterparts mouseover and mouseout fire again for every descendant, so delegated hover is genuinely harder rather than just differently spelled. Anything you delegate should have event.bubbles checked first.

Somebody upstream can stop it. A delegated handler is at the top of the path, so it is the last thing to run and the first thing lost when a component in between calls stopPropagation. Per-element listeners are closer to the target and survive that. If the subtree contains third-party components you cannot change, delegation is a bet on their behaviour.

The handler has to identify what was hit, and that logic is a second place to be wrong. Every delegated handler is a small router: closest to find the element, a containment check, then a branch on a class or a data attribute. It is quiet when it is wrong, because a mismatch means nothing happens rather than something throwing. A form with fifteen distinct controls delegated to one handler is worse than fifteen listeners, and I would split it once the branching gets past a few cases.

And it does not fit when the listener needs per-element state or per-element options. A listener registered with once, or with passive, or with an AbortSignal tied to that element's lifetime, is expressing something about that element. Delegation flattens all of that into one registration and you end up rebuilding it inside the handler.

Two more I would mention if there is room. Delegating on document rather than on the nearest stable container makes every click in the page run your handler, which is both slower and easier to get wrong, so delegate to the closest ancestor that outlives the children. And in a framework, this argument is mostly already settled for you: React attaches one listener per root and dispatches through its own tree, so hand-rolled delegation inside a React app is solving a problem the framework has solved and doing it against a tree React is managing.

The summary I would end on: delegation is the default for lists and repeated structures whose children change, and per-element listeners are the default for a fixed set of controls that each need their own behaviour.`,
    hints: [
      'Name events that do not bubble, and what you use instead.',
      'What does being furthest from the target cost you?',
    ],
    tags: ['events', 'delegation'],
  },
  {
    id: 'preventdefault-submit-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'The log flashes up for an instant, the page reloads, and the form is empty again. The request never reaches the server. Why, and what is the fix?',
    code: `form.addEventListener('submit', (event) => {
  console.log('saving', form.elements.email.value)
  save(new FormData(form))
})`,
    options: [
      'Nothing cancelled the browser default, so the form submits and the page navigates away mid-handler. Call event.preventDefault() first',
      'The handler has to return false to tell the browser not to submit',
      'The listener belongs on the submit button rather than on the form, because the browser submits before a listener on the form runs',
      'save is asynchronous and the page is gone before it finishes, so the call needs an await in front of it',
    ],
    correctOption: 0,
    answerInFull: `The handler ran, and then the browser did what it always does with a submit event: it submitted the form as a navigation.

Your listener does not replace the default action. It runs alongside it, and the default happens once the event has finished travelling unless something cancels it.

    form.addEventListener('submit', (event) => {
      event.preventDefault()
      save(new FormData(form))
    })

That is the whole fix, and it is the first line of almost every submit handler ever written.

The symptom is worth recognising on sight, because it explains three different bug reports. A log that appears and vanishes is a page unloading. A network request that starts and is cancelled is the same thing: the browser tears down the page and everything in flight with it. And a form that "resets itself" has not reset, it has reloaded.

preventDefault is also what you want on a link that should not navigate, a checkbox that should not tick until the server agrees, and a context menu you are replacing.

Two things it is not. It does not stop the event travelling, so every other listener on the path still runs. And it does nothing at all on an event that is not cancelable, which you can check with event.cancelable.`,
    explanation: `return false is a real convention in two places and neither of them is here. In an inline onsubmit attribute, and in a jQuery handler, it means preventDefault and stopPropagation together. In a listener added with addEventListener the return value is thrown away.

Moving the listener to the button changes nothing worth having. The click on the button is what generates the submit event on the form, so the form's listener is not late, and a submit handler on the form is the right place for form validation.

Awaiting save is a genuinely good idea for other reasons and it is not the cause. The navigation is not waiting for your handler to finish, and awaiting inside a handler does not hold it up, because the default fires after the handler returns, which an await does immediately.`,
    hints: ['What does the browser do with a submit event once every listener has run?'],
    tags: ['events', 'forms'],
  },
  {
    id: 'onclick-property-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A component sets button.onclick = save. A later feature adds button.onclick = track somewhere else. Only track runs. What is the rule, and what would have avoided it?',
    options: [
      'Both are registered, and a browser only runs the most recently registered handler for a given type',
      'onclick runs during the capture phase and is skipped when the click starts on the element itself',
      'onclick is one property holding one function, so the second assignment overwrote the first. addEventListener keeps a list, and both would have run',
      'onclick is deprecated, and browsers ignore it as soon as any other listener exists on the element',
    ],
    correctOption: 2,
    answerInFull: `onclick is a property. It holds one function, and assigning to it replaces whatever was there.

That is the difference between the two ways of listening. addEventListener appends to a list the element keeps, so ten calls give you ten handlers running in the order they were registered. A property has room for exactly one.

    button.addEventListener('click', save)
    button.addEventListener('click', track) // both run

The failure is quiet because neither piece of code is wrong on its own, and the one that breaks is the one written first. It shows up in shared components, in anything a plugin touches, and in code that runs twice.

Two smaller differences worth having. A property handler cannot be registered for the capture phase or given once or a signal, because there is nowhere to put the options. And removing one is easy, button.onclick = null, where removeEventListener needs the same function reference you passed in.

There is one thing the property does better: it is idempotent. Assigning the same function twice leaves one handler, so code that might run more than once cannot stack up duplicates. addEventListener also refuses an exact duplicate of type, handler reference and capture flag, and an inline arrow is never that duplicate, which is how handlers pile up on a re-render.`,
    explanation: `"Only the last one runs" describes the outcome and gets the mechanism wrong, and the mechanism is what makes it predictable. Nothing chose between two registered handlers. There was only ever one, because the second assignment threw the first away.

Phases are a real thing and they are not this. A property handler listens in the bubble phase, the same as addEventListener without options, and both would have run at the target anyway.

onclick is not deprecated. It is old and limited, and it works exactly as specified in every browser.`,
    hints: ['How many functions can a property hold?'],
    tags: ['events', 'listeners'],
  },
  {
    id: 'checkbox-value-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A settings panel saves each checkbox as the user changes it. Every save records the string "on", whether the box was ticked or unticked. Why?',
    code: `form.addEventListener('change', (event) => {
  save(event.target.name, event.target.value)
})`,
    options: [
      'change fires before the browser has updated the input, so value is one event behind. Listen for input instead',
      'The checkboxes have no value attribute, so the browser substitutes "on". Give each one value="true"',
      'change bubbles, so by the time the handler runs event.target is the form rather than the checkbox',
      'value on a checkbox is the string it submits when ticked, and it never changes. Whether it is ticked is event.target.checked',
    ],
    correctOption: 3,
    answerInFull: `value is the wrong property. A checkbox's state is checked.

An input's value is what it contributes to a form submission. For a text field that is what the user typed, which is why value works everywhere else and the habit is so easy to form. For a checkbox it is a fixed string, defaulting to "on", and it exists so the server can tell which of several boxes was ticked. It does not change when the box does. What changes is checked, a boolean.

    save(event.target.name, event.target.checked)

The reason "on" appears at all is that nothing in your markup set a value, so the browser used its default. Setting one would only change which string you always get.

The neighbouring cases are worth knowing together, because a form handler meets all of them:

    text, textarea, select: value
    checkbox and radio: checked, and value says which one
    file input: files, a FileList, and value is a fake path
    number input: value is still a string, valueAsNumber is the number

A radio group is the case where both properties matter at once. Each button has its own value, and the one to read is the checked one, which is what querySelector('input[name="plan"]:checked') is for.`,
    explanation: `Being one event behind is a real bug in other places, and change is not one of them: it fires after the value has settled, which is the difference between change and input. Switching to input would give you exactly the same "on".

Adding value="true" is the most tempting answer here, because it makes the string look right in the payload. It would record "true" for every checkbox, ticked or not, and turn an obviously wrong value into a plausible one.

The bubbling option has the mechanism inside out. Bubbling is why one listener on the form sees every field, and target stays on whatever the event happened to for the whole journey. It is currentTarget that would be the form.`,
    hints: ['Which property changes when the user clicks the box?'],
    tags: ['events', 'forms'],
  },
  {
    id: 'delegation-rerender-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'The list is rebuilt from scratch whenever the data changes. The delete buttons work on the first render and do nothing after any render that follows. Which version keeps working?',
    options: [
      'Attach a listener to every delete button, but find them with getElementsByClassName, so the live collection covers buttons added later',
      'Attach a listener to every delete button inside a DOMContentLoaded handler, so the document is ready before anything is registered',
      'One click listener on the list, added once, which uses event.target.closest(".delete") to work out what was clicked',
      'Attach a listener to every delete button and pass { once: false }, so a registration is not discarded after it fires',
    ],
    correctOption: 2,
    answerInFull: `One listener on the list, which is what delegation is for.

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.delete')
      if (!button) return
      remove(button.closest('.row').dataset.id)
    })

Nothing about a re-render touches it. The listener is on the list, the list is not what gets rebuilt, and a row that did not exist when the listener was registered is handled anyway because the click reaches the list by bubbling.

The version that breaks is not wrong so much as tied to a lifetime it cannot control. Listeners live on nodes. Rebuild the rows and the old nodes are discarded with everything attached to them, so the buttons on screen are new objects that nobody has registered anything on. The per-button code has to run again after every render, and the render that forgets is the bug.

closest is the other half, and it is doing more than it looks. The click landed on whatever was under the pointer, which is usually an icon or a label inside the button, so event.target is rarely the button itself. closest walks up from there and returns the first ancestor that matches, which turns "you clicked the svg" into "you clicked the delete button".

When the container is document rather than a list, add a contains check as well, because closest can walk past where you meant to stop.`,
    explanation: `The live collection is the interesting wrong answer, because the collection really does update. What it updates is its own contents, and a listener is not one of them: addEventListener was called on the elements that were in it at the time. There is nothing in a collection that attaches anything to a node that joins it later.

DOMContentLoaded fixes a different bug, the one where a script runs before the markup exists. It fires once, so it is no help at all against a list rebuilt an hour into the session.

once: false is the default, and passing it explicitly changes nothing. once: true is the option that does something, and it removes a listener after it fires, which is the opposite of the problem here.`,
    hints: ['What happens to a listener when the node it was attached to is replaced?'],
    tags: ['events', 'delegation'],
  },
  {
    id: 'bubble-default-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A button sits inside a card. Each has a click listener added with addEventListener(type, handler) and no third argument. You click the button. Which listener runs first, and why?',
    options: [
      "The card's, because the event travels from the outside in and the card is on the way to the button",
      "The button's. With no options the listener is on the bubble phase, and bubbling runs from the target outwards",
      "The card's, if its listener was registered first, because listeners run in the order they were added",
      'Neither is guaranteed. The order of listeners on two different elements is left to the browser',
    ],
    correctOption: 1,
    answerInFull: `The button's, then the card's.

The third argument to addEventListener defaults to false, which means the bubble phase, and bubbling starts at the target and works outwards. So the innermost listener on the path goes first.

The event did travel from the outside in before that. The browser computes the path from the root to the target, runs it downwards for the capture phase, reaches the target, and runs it back up for the bubble phase. Nothing ran on the way down here because neither listener asked to be on it.

    card.addEventListener('click', onCard, true) // capture: now the card goes first

Registration order decides between listeners on the same element, and nothing else. Across elements the path decides, and the path is fixed before any handler runs.

Two consequences worth carrying. Delegation works because of this: a listener on a container hears clicks on its children, and it hears them after any listener the child has of its own. And capture is the answer when you need to be first, which is what it is genuinely for, such as seeing an event before something further in can stop it travelling.`,
    explanation: `Outside in is the capture phase, and it is real, and no listener here is on it. The natural mental picture of an event "arriving from the top" describes half the journey, and the half almost nobody registers for.

Registration order is the right rule in the wrong scope. Two listeners on the same element run in the order they were added; two on different elements are ordered by where those elements sit on the path.

The order is fully specified, not left to the browser. That is what makes delegation something you can build on rather than something that happens to work.`,
    hints: [],
    tags: ['events', 'propagation'],
  },
]
