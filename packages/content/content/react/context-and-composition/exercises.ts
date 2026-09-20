import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'refactor-prop-drilling-with-composition',
    title: 'Eliminate prop drilling across layout components using composition',
    difficulty: 'easy',
    prompt:
      'Refactor a deeply nested application shell where user session details are drilled through Layout -> NavigationBar -> UserProfileMenu by leveraging the children prop to compose components cleanly.',
    requirements: [
      'Remove the user prop from intermediate layout components (Layout and NavigationBar).',
      'Refactor Layout and NavigationBar to accept and render children: React.ReactNode.',
      'In the root App component, compose UserProfileMenu directly inside the layout shell.',
      'Verify that UserProfileMenu receives the user prop without intermediate components knowing about it.',
    ],
  },
  {
    id: 'theme-context-provider-hook',
    title: 'Build an optimized ThemeContext provider with custom hook guard',
    difficulty: 'medium',
    prompt:
      'Construct a complete ThemeContext system featuring a ThemeProvider, a memoized context value, a theme toggle mechanism, and a guarded useTheme() hook.',
    requirements: [
      'Create a ThemeContext with a "light" | "dark" theme type and toggleTheme function.',
      'Implement a ThemeProvider component that holds theme state and wraps its value in useMemo.',
      'Write a custom useTheme() hook that throws a descriptive error when used outside ThemeProvider.',
      'Build consumer components that read the theme and trigger toggleTheme, verifying that consumers update correctly.',
    ],
  },
]
