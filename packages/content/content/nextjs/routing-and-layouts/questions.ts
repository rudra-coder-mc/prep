import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'app-router-page-convention-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'In the Next.js App Router, how does a folder inside the app directory become publicly accessible as a URL route?',
    options: [
      'By containing a default-exported React component inside a page.tsx file',
      'By registering the folder path in a routes.config.json file',
      'By exporting any named component whose name matches the folder name',
      'By adding an action.ts file returning an HTTP 200 response',
    ],
    correctOption: 0,
    answerInFull: `In Next.js App Router, the presence of a page.tsx file defines a public route.

Folder structure maps directly to URL paths, but only folders that contain a page.tsx (or page.js/page.jsx) are publicly routable.

    app/
      dashboard/
        settings/
          page.tsx   -> accessible at /dashboard/settings

If a folder contains components, styles, or tests without a page.tsx, it remains private and cannot be navigated to directly.`,
    explanation: `Next.js does not use a JSON configuration file for routing; routing is entirely file-system based.

The exported component must be the default export in page.tsx.

action.ts files are for Server Actions, not route definitions.`,
    hints: ['What specific file name makes a folder addressable as a page in the browser?'],
    tags: ['nextjs', 'routing', 'app-router'],
  },
  {
    id: 'layout-state-persistence-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What happens to client state inside app/dashboard/layout.tsx when a user navigates between /dashboard/analytics and /dashboard/settings?',
    options: [
      'The layout state is preserved because layouts remain mounted during child route navigation',
      'The layout unmounts and remounts, resetting its state to initial values',
      'The layout state is automatically serialized into URL search parameters',
      'Next.js throws an error unless the layout is wrapped in a template.tsx file',
    ],
    correctOption: 0,
    answerInFull: `Layouts do not unmount or re-render during child page navigation.

When navigating between sibling pages that share a common layout, Next.js keeps the layout mounted. Only the child segments inside layout's children prop change.

This means any client state in the layout—such as text entered in a search bar, an open dropdown menu, or audio playback—persists across navigation without interruption.`,
    explanation: `Remounting and resetting state on navigation is the specific behavior of template.tsx, not layout.tsx.

State is kept in React component memory, not in URL parameters.

Layouts work independently without requiring template.tsx.`,
    hints: [
      'Do shared layouts unmount when you click a link to another page within that same layout?',
    ],
    tags: ['nextjs', 'layouts', 'state'],
  },
  {
    id: 'template-vs-layout-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is the primary difference between layout.tsx and template.tsx in Next.js?',
    options: [
      'template.tsx creates a fresh component instance and resets state on every navigation, whereas layout.tsx persists state and stays mounted',
      'template.tsx renders exclusively on the server, whereas layout.tsx renders exclusively in the browser',
      'layout.tsx cannot receive a children prop, whereas template.tsx requires children',
      'template.tsx is only supported in legacy Pages Router applications',
    ],
    correctOption: 0,
    answerInFull: `template.tsx mounts a fresh instance on every navigation.

While layout.tsx wraps child routes and preserves state across transitions, template.tsx creates a new component instance each time the route changes.

    // Use template.tsx when you explicitly want:
    // 1. useEffect to run again on every page visit (e.g. page analytics)
    // 2. Component state (like an entrance animation or form) to reset

Both receive children as a prop, but their mounting lifecycle during navigation is opposite.`,
    explanation: `Both layouts and templates can be Server or Client Components.

Both accept children.

template.tsx was introduced in the modern App Router, not legacy Pages Router.`,
    hints: ['Which one is used when you deliberately want state to reset on route change?'],
    tags: ['nextjs', 'templates', 'layouts'],
  },
  {
    id: 'root-layout-requirement-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which rule must the root layout (app/layout.tsx) satisfy in the Next.js App Router?',
    options: [
      'It must explicitly render the top-level <html> and <body> tags because Next.js does not create them automatically',
      'It must include the "use client" directive at the top of the file',
      'It must export a getServerSideProps function to configure global headers',
      'It must be named RootPage rather than RootLayout',
    ],
    correctOption: 0,
    answerInFull: `The root layout defines the application HTML document shell.

In the App Router, Next.js does not inject default <html> or <body> tags. The root layout (app/layout.tsx) must define them:

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode
    }) {
      return (
        <html lang="en">
          <body>{children}</body>
        </html>
      )
    }

Without these tags, the browser receives an incomplete document and Next.js fails the build.`,
    explanation: `The root layout should generally be a Server Component to avoid sending unnecessary JavaScript to the client.

getServerSideProps belongs to the legacy Pages Router and cannot be used in the App Router.

Component export names do not determine functionality; the file path and default export do.`,
    hints: ['Where do the <html> and <body> tags get rendered in an App Router application?'],
    tags: ['nextjs', 'root-layout', 'html'],
  },
  {
    id: 'next-link-vs-anchor-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A developer notices that clicking items in their navigation bar triggers a full browser reload and resets their active music player. What is the bug?',
    options: [
      'They used standard HTML <a> tags instead of the Next.js <Link> component from next/link',
      'They omitted the preserveState attribute from their <html> root tag',
      'They placed their audio player inside app/layout.tsx instead of public/index.html',
      'They forgot to install the React Router DOM dependency',
    ],
    correctOption: 0,
    answerInFull: `Standard <a> tags cause full browser page reloads.

When a user clicks a regular HTML <a> tag, the browser makes a brand new HTTP request to the server, discarding all in-memory React state, DOM, and JavaScript execution.

The Next.js <Link> component intercepts the click and performs client-side navigation. It only requests the updated route payload and updates the DOM in place, keeping persistent layouts and client state (like audio playback) alive.`,
    explanation: `There is no preserveState attribute on HTML tags.

Audio players that need to persist belong in a layout.tsx.

Next.js App Router has built-in routing and does not use react-router-dom.`,
    hints: [
      'What Next.js component should be used instead of standard <a> tags for internal links?',
    ],
    tags: ['nextjs', 'link', 'navigation'],
  },
  {
    id: 'app-router-route-resolution-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Put the special files within a Next.js route segment in order from outermost wrapper component to innermost child content.',
    items: [
      'layout.tsx (outermost segment wrapper)',
      'template.tsx (re-mounted segment wrapper)',
      'error.tsx (error boundary fallback)',
      'loading.tsx (Suspense boundary fallback)',
      'page.tsx (the route content)',
      'server-action.ts (HTTP route handler)',
      'routes.json (URL mapping manifest)',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `Next.js nests segment files in a defined structural hierarchy:

1. layout.tsx wraps the entire segment.
2. template.tsx sits inside layout.
3. error.tsx provides a React error boundary around the child tree.
4. loading.tsx wraps the page in a React Suspense boundary.
5. page.tsx renders as the innermost content.

server-action.ts and routes.json are not special segment component wrappers.`,
    explanation: `The layout wraps the template, which wraps the error boundary, which wraps the loading boundary, which wraps the page.`,
    hints: ['Does layout wrap error and loading, or is it inside them?'],
    tags: ['nextjs', 'hierarchy', 'conventions'],
  },
  {
    id: 'route-group-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the purpose of wrapping a folder name in parentheses, such as app/(marketing)/about/page.tsx, in Next.js?',
    options: [
      'It creates a Route Group that organizes routes without affecting the public URL path (/about)',
      'It marks the route as authenticated and requires an active session token to view',
      'It prevents the route from being pre-rendered during the build step',
      'It signals that the folder contains API routes rather than page components',
    ],
    correctOption: 0,
    answerInFull: `Parentheses create Route Groups.

A folder wrapped in parentheses, like (marketing) or (dashboard), is completely omitted from the URL path.

    app/(marketing)/about/page.tsx -> accessible at /about

Route groups allow developers to:
1. Organize project files into logical sections without polluting URLs.
2. Opt different sections into different layouts (e.g. a marketing layout with a footer vs a dashboard layout with a sidebar) at the same URL depth.`,
    explanation: `Route groups do not provide authentication or access control; that is handled by middleware or page checks.

Route groups do not disable static generation.

API routes use route.ts files, not parenthesis folders.`,
    hints: ['Do folder names in parentheses appear in the browser URL bar?'],
    tags: ['nextjs', 'route-groups', 'organization'],
  },
  {
    id: 'not-found-handling-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'You are building a dynamic product page at app/products/[id]/page.tsx. If the requested product is not found in the database, how do you trigger the nearest not-found.tsx UI in Next.js?',
    options: [
      'Call notFound() imported from next/navigation',
      'Return null and set window.status = 404 in a useEffect',
      'Throw new Error("404") from the component body',
      'Use window.location.href = "/404"',
    ],
    correctOption: 0,
    answerInFull: `The notFound() function from next/navigation triggers the not-found boundary.

    import { notFound } from 'next/navigation'

    export default async function ProductPage({ params }: { params: { id: string } }) {
      const product = await getProduct(params.id)
      if (!product) {
        notFound()
      }
      return <h1>{product.title}</h1>
    }

Invoking notFound() throws a specific internal Next.js error that halts rendering and renders the closest not-found.tsx boundary, returning an HTTP 404 status code.`,
    explanation: `Returning null renders an empty page with an HTTP 200 status code rather than showing not-found.tsx.

Throwing a general Error triggers error.tsx instead of not-found.tsx.

window.location triggers a hard reload and bypasses Next.js boundary conventions.`,
    hints: [
      'Which helper function is imported from next/navigation specifically for 404 conditions?',
    ],
    tags: ['nextjs', 'not-found', 'error-handling'],
  },
  {
    id: 'explain-app-router-interview',
    type: 'interview',
    form: 'open',
    tier: 'swe-1',
    prompt:
      'In an interview, you are asked: "How does routing work in Next.js App Router, and why do layouts persist state across page transitions?" How would you structure your response?',
    answerInFull: `Structure the response around three points:

1. File-System Routing:
In Next.js App Router, the folder hierarchy under app/ defines the URL paths. Folders with a page.tsx file expose public routes. Reserved file names like layout.tsx, loading.tsx, and error.tsx define nested behaviors declaratively.

2. State Persistence in Layouts:
Layouts wrap child pages using the children prop. When a user navigates between sibling pages inside the same layout, Next.js performs client-side reconciliation: the layout remains mounted, its DOM nodes are not recreated, and its React state is not reset. Only the child route component changes.

3. User Experience & Performance Impact:
Persisting layout state prevents UI flickering, allows elements like search inputs, video players, and navigation bars to retain live state, and avoids re-fetching shared data that the layout already holds.`,
    explanation: `Be sure to contrast layout.tsx with template.tsx to demonstrate depth, and mention that client-side transitions avoid full browser document reloads.`,
    hints: [
      'Cover file-system conventions, why layouts stay mounted, and the user experience benefits.',
    ],
    tags: ['nextjs', 'interview', 'routing', 'layouts'],
  },
  {
    id: 'dashboard-layout-refactor-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'You are creating a dashboard where /dashboard/inbox and /dashboard/calendar share a search input in the sidebar. The product manager requires that any text typed in the search bar must not disappear when switching between inbox and calendar. Where should this sidebar and its state be located?',
    options: [
      'In app/dashboard/layout.tsx, because layouts preserve their state across navigation between child routes',
      'Duplicated inside both inbox/page.tsx and calendar/page.tsx, synced via window.localStorage',
      'In app/dashboard/template.tsx, because templates re-mount on every route transition',
      'In app/dashboard/loading.tsx, because loading states load before page content',
    ],
    correctOption: 0,
    answerInFull: `Place the sidebar inside app/dashboard/layout.tsx.

Because layouts do not re-render or unmount when navigating between sibling routes (inbox and calendar), any component state held in the layout stays alive. The user's typed search query will not be lost.

If you placed it in template.tsx, the component would remount on navigation, wiping the search query.`,
    explanation: `Duplicating state across pages via localStorage adds unnecessary latency and synchronization bugs.

template.tsx specifically resets state on navigation.

loading.tsx is a temporary Suspense fallback, not permanent UI.`,
    hints: [
      'Which special Next.js file is guaranteed to retain state when switching between child pages?',
    ],
    tags: ['nextjs', 'architecture', 'layouts'],
  },
]
