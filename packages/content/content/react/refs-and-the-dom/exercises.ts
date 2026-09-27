import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'auto-focus-search-input',
    title: 'Focus an input element on user action using a DOM ref',
    difficulty: 'easy',
    prompt:
      'Build a search bar component that focuses the input element when a keyboard shortcut or a dedicated "Quick Search" button is clicked.',
    requirements: [
      'Initialize an input ref using useRef<HTMLInputElement>(null) and attach it to an <input> element.',
      "Provide a button whose click handler imperatively calls the input's focus() method.",
      'Ensure the ref access uses safe optional chaining to avoid null dereference errors.',
      'Verify that focusing the input does not cause any unnecessary re-renders of the parent component.',
    ],
  },
  {
    id: 'video-player-controls',
    title: 'Control HTML5 video playback imperatively with useRef',
    difficulty: 'medium',
    prompt:
      'Create a custom media player interface that controls an HTML5 <video> element using imperative APIs without storing playback state in React state.',
    requirements: [
      'Attach a ref to an HTML5 <video> element with a sample video source.',
      'Implement custom "Play", "Pause", and "Restart" buttons that call .play(), .pause(), and set currentTime = 0 on the video DOM node.',
      'Store any interval timer or playback measurement in a separate ref rather than useState.',
      'Ensure that clicking playback controls modifies media playback without triggering visual React re-renders.',
    ],
  },
]
