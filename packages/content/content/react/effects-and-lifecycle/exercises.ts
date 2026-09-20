import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'race-condition-safe-search',
    title: 'Implement race-condition-safe asynchronous search with cleanup',
    difficulty: 'easy',
    prompt:
      'Build a search input component that queries an asynchronous search API on query change, using an AbortController or ignore flag in useEffect cleanup to discard out-of-order responses.',
    requirements: [
      'Trigger an asynchronous fetch whenever the user input query changes.',
      'Provide a cleanup function in useEffect that aborts the in-flight request or flags it as ignored when the query changes or the component unmounts.',
      'Ensure that if an older slow network response finishes after a faster newer response, the older response is discarded and does not overwrite current state.',
      'Display loading, empty, and populated result states cleanly without flickering old results.',
    ],
  },
  {
    id: 'synchronize-browser-media-api',
    title: 'Synchronize an imperative HTML5 audio or canvas player with declarative props',
    difficulty: 'medium',
    prompt:
      'Create an AudioPlayer or CanvasVisualizer component that uses useEffect to synchronize imperative browser APIs with React state, including comprehensive cleanup on unmount.',
    requirements: [
      'Wrap an imperative browser element (audio element or 2D canvas context) using useRef.',
      'Synchronize playback state (playing, paused, volume) or animation loops using useEffect driven strictly by incoming props.',
      'Implement an effect cleanup function that cancels animation frame requests or stops audio playback immediately when unmounting.',
      'Verify that the component behaves correctly under React StrictMode without duplicate audio playback or leaking animation loops.',
    ],
  },
]
