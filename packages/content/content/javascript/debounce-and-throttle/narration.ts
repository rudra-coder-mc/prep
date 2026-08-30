import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Sixty calls a second',
    heading: 'Why this matters',
    script: `An input handler runs on every keystroke. A scroll handler runs
      dozens of times a second. A resize handler runs throughout the drag. Each
      of them is fine until the work inside is a network request, a layout read,
      or anything slower than the gap between calls.

      Debounce and throttle are the two answers, and they get asked about
      constantly for two good reasons. The distinction is a real design decision
      that people get backwards. And writing one from scratch uses closures,
      setTimeout, rest parameters, this and cleanup, in about ten lines. It is
      the smallest piece of code that shows whether you know the language.`,
  },
  {
    title: 'Wait for quiet, or enforce a rate',
    heading: 'The two shapes',
    script: `Debounce waits for quiet. Every call cancels the pending run and
      starts the wait again, so the function runs once, after the calls stop.
      Type ten characters quickly and one search happens.

      Throttle enforces a rate. The function runs at most once per interval,
      however many calls arrive. Scroll for two seconds with a hundred
      millisecond throttle and it runs about twenty times, spread evenly.

      The question that picks between them: do you want the last one, or do you
      want regular ones?

      A search box wants the last one, because the intermediate searches are
      wasted work whose results nobody will look at. A scroll position indicator
      wants regular ones, because a version that only updates when scrolling
      stops is broken.

      So: debounce for search, autosave, validation, and reflowing after a
      resize. Throttle for scroll, mouse move, progress reporting, and staying
      under a rate limit. The risk on the debounce side is that it may never run
      while input continues. The risk on the throttle side is acting on stale
      intermediate values.`,
  },
  {
    title: 'Debounce in ten lines',
    heading: 'Debounce, written out',
    script: `The closure holds one variable: the pending timer id. That is
      everything the function remembers between calls.

      Each call clears the pending timer and schedules a new one with its own
      arguments. First keystroke, timer scheduled. Second keystroke ninety
      milliseconds later, the pending timer is cleared before it ever fires and a
      new one is scheduled with the newer arguments. Third, fourth, the same.
      Then three hundred milliseconds of silence, the last timer fires, and one
      request goes out for the query the user actually finished typing.

      Three details in those ten lines are worth naming, because an
      implementation without them is the one that gets marked down.

      The returned wrapper is a normal function and the timer callback is an
      arrow. That combination is what preserves this: the arrow takes this from
      the wrapper, so a debounced method still works when it is called as a
      method. Then apply forwards both the receiver and the arguments.

      The arguments are captured per call, and the last call's arguments are the
      ones that run. That is what makes a search debounce correct rather than
      merely cheaper.

      And cancel is not optional in real code. A pending timer holds its
      callback, its arguments and everything they close over, so an uncancelled
      debounce is both a stale write and one of the leak shapes from two topics
      ago.`,
  },
  {
    title: 'Both edges of a throttle',
    heading: 'Throttle, written out',
    script: `Throttle has one design question that debounce does not: when in the
      interval does it run.

      Leading edge means the first call runs immediately. It matters more than it
      sounds. A throttle without it feels broken, because the first scroll event
      does nothing for a whole interval.

      Trailing edge means one more run at the end of the window, so the final
      position is not lost. Without it, a scroll that stops mid-interval leaves
      the indicator wrong forever.

      The implementation that does both keeps a timestamp of the last run. If the
      interval has passed, run now and record the time. Otherwise, if nothing is
      scheduled yet, schedule one run for the end of the window. Most real
      throttles do both and make each one configurable. On a whiteboard, write
      the leading edge version and then say out loud that a trailing call is
      needed so the last event is not dropped.

      For anything visual there is a simpler throttle, and it is usually the
      right one. Set a flag, request an animation frame, clear the flag inside
      it. That runs at most once per frame, which is exactly as often as the
      screen can show a change, and it pauses when the tab is hidden instead of
      burning a timer.`,
  },
  {
    title: 'A floor, not a schedule',
    heading: 'What the timers actually promise',
    script: `A timeout of three hundred milliseconds means not before three
      hundred milliseconds, and the gap between that and at three hundred
      milliseconds contains several real behaviours.

      A timer callback is a task, so it waits for the current synchronous run to
      finish and for the microtask queue to drain completely. A promise chain
      that keeps queueing microtasks can hold off a zero millisecond timer
      indefinitely.

      Nested timers are clamped. After five levels of nesting, browsers force a
      minimum of about four milliseconds, so a zero millisecond loop is really a
      four millisecond loop.

      Background tabs throttle timers hard, to roughly once a second, and less
      for pages hidden a long time. Code that assumes a hundred millisecond
      throttle keeps ticking while the user is in another tab is wrong about it.

      And setInterval drifts, with callbacks that can bunch up if the work takes
      longer than the interval. For repeating work of uncertain duration, a
      setTimeout that reschedules itself at the end of each run keeps the gap
      rather than the rate.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked the difference, say: debounce waits for the calls to stop and
      then runs once, throttle runs at most once per interval regardless. Then
      give the deciding question, do you want the last one or regular ones, which
      is what shows you can apply it rather than recite it.

      Asked to write debounce, write the ten lines and narrate the three details
      as you go. This and the arguments forwarded. The last call's arguments
      winning. And a cancel for teardown. An implementation that drops this works
      for arrow callbacks and breaks for methods, and interviewers ask about that
      specifically.

      Asked which one for a search-as-you-type box, say debounce at around three
      hundred milliseconds, and then say the part they were about to ask:
      debouncing does not solve out of order responses. Two requests can still be
      in flight if the user pauses twice, so the request itself needs an abort
      controller or a sequence check on the response.

      Expect a follow up on why a debounced function cannot return the result. It
      is because the real call has not happened yet, so a production version
      returns a promise that resolves when it eventually does.`,
  },
]
