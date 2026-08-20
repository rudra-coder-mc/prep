import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'safe-options',
    title: 'A signature that survives being called with nothing',
    difficulty: 'easy',
    prompt:
      'Write createUser(name, options) so that every optional setting has a sensible default and the function still works when it is called with only a name.',
    requirements: [
      'options supports role, defaulting to "member", and active, defaulting to true.',
      'createUser("ada") works, and so does createUser("ada", { active: false }).',
      'Passing active: false gives an inactive user rather than falling back to the default.',
      'The function never modifies the object the caller passed in.',
      'Destructure in the signature rather than reading properties in the body, and make sure calling with no options does not throw.',
    ],
  },
  {
    id: 'call-log',
    title: 'Record every argument a call was given',
    difficulty: 'medium',
    prompt:
      'Write logged(fn) which returns a wrapper that calls fn unchanged and records every call in an array on the wrapper, so a callback can be inspected after the fact.',
    requirements: [
      'wrapper.calls is an array, one entry per call, holding all the arguments that call received.',
      'The wrapper returns whatever fn returned, and lets a thrown error through after recording the call.',
      'It records arguments the wrapped function does not declare, so passing it to map shows the index and the array.',
      'It works as a method, so the wrapped function still sees the right this.',
      'wrapper.length reports the same number as fn.length, and add a comment saying why a rest parameter alone does not give you that.',
    ],
  },
]
