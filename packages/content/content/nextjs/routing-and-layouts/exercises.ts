import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'build-nested-dashboard-layout',
    title: 'Build a multi-level nested layout with persistent navigation state',
    difficulty: 'easy',
    prompt:
      'Structure an App Router directory hierarchy with a persistent root navigation bar, a nested dashboard sidebar with collapsible state, and two sibling routes.',
    requirements: [
      'Create an app/layout.tsx file that defines the top-level <html> and <body> document structure.',
      'Implement an app/dashboard/layout.tsx file containing an interactive sidebar with toggleable open/collapsed state.',
      'Provide two child pages under dashboard (e.g. analytics/page.tsx and settings/page.tsx) that navigate between each other using next/link.',
      'Verify that toggling the sidebar open or closed persists its state across transitions between the two child pages.',
    ],
  },
  {
    id: 'template-vs-layout-comparison',
    title: 'Demonstrate the difference between layout and template state lifecycles',
    difficulty: 'medium',
    prompt:
      'Create a test harness comparing layout.tsx against template.tsx side-by-side, demonstrating that state resets on navigation in one and survives in the other.',
    requirements: [
      'Create two parallel route groups or paths: one wrapped in a layout.tsx and the other wrapped in a template.tsx.',
      'Place an interactive input field and a timer counter in each wrapper component.',
      'Demonstrate that navigating between sibling pages resets the input and counter in the template branch, but preserves them in the layout branch.',
      'Add an automated test or scripted assertion validating that navigation does not cause the layout wrapper component to unmount.',
    ],
  },
]
