import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'cancellable-pipeline',
    title: 'A pipeline that actually stops',
    difficulty: 'hard',
    prompt:
      'Build runPipeline(steps, signal) where steps is an array of async functions executed in order, each receiving the previous result. Aborting between steps must stop the pipeline with an AbortError; aborting during a step must be visible to that step through the same signal.',
    requirements: [
      'A step started before the abort runs to its own end — assert it completes, and that the next step never starts.',
      'signal.throwIfAborted() between steps rejects the whole pipeline with the abort reason; assert the reason arrives at the caller.',
      'Each step receives the signal, and a step that watches it can exit early; write one such step to prove it.',
      'After the pipeline settles — either way — no timer or listener from it remains pending; assert cleanup.',
      'Comment on what happens if a step ignores the signal entirely, and which layer is responsible for that being safe.',
    ],
  },
  {
    id: 'stale-search-race',
    title: 'Only the latest request counts',
    difficulty: 'medium',
    prompt:
      'Simulate a search box: a createSearch() factory returning search(query), where each new call cancels the previous in-flight request via AbortController and resolves only if it is still the latest. Back it with fake fetches of controllable latency.',
    requirements: [
      'Fire three searches at staggered times with reversed latencies so the first-issued would finish last without cancellation; assert the final rendered result belongs to the last query.',
      'Aborted requests reject with an AbortError carrying your reason ("superseded"); assert the name and message.',
      'A genuine failure on the latest request propagates to its caller rather than being swallowed as an abort.',
      'Assert no request is still in flight after the sequence ends, by counting active fake fetches.',
    ],
  },
]
