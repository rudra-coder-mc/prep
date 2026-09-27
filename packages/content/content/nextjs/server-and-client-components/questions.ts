import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'rsc-default-environment-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the default component execution model for files created inside the Next.js app directory?',
    options: [
      'They are React Server Components (RSC) and execute only on the server',
      'They are Client Components that render only in the browser',
      'They run as traditional Single-Page Application components with no server execution',
      'They require an explicit "use server" directive at the top of every file to execute on the server',
    ],
    correctOption: 0,
    answerInFull: `In the Next.js App Router, all components inside the app directory are React Server Components by default.

No directive or wrapper is required. Server Components execute exclusively in the server runtime (Node.js or Edge), and their JavaScript code is never bundled or sent to the browser.`,
    explanation: `Client components require an explicit "use client" directive at the top of the file.

"use server" is for Server Actions (server-side mutation functions), not for marking components as Server Components.`,
    hints: [
      'Do you need to write any directive at the top of a file to make it render on the server in the App Router?',
    ],
    tags: ['nextjs', 'rsc', 'server-components'],
  },
  {
    id: 'use-client-directive-meaning',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What does placing the "use client" directive at the top of a component file actually signify in Next.js?',
    options: [
      'It marks a module boundary indicating that the file and its imports are part of the client bundle and will hydrate in the browser',
      'It disables server-side rendering so the component only ever renders inside the browser window',
      'It marks the component as an asynchronous HTTP endpoint for client AJAX calls',
      'It automatically compiles the component to WebAssembly for client-side execution',
    ],
    correctOption: 0,
    answerInFull: `The "use client" directive establishes a boundary between the server-only module graph and the client module graph.

Files marked with "use client" are bundled for the browser. However, they are still pre-rendered to HTML on the server during the initial page load to provide fast first contentful paint, followed by hydration in the browser.`,
    explanation: `A widespread misconception is that Client Components only run in the browser. They still pre-render to HTML on the server during SSR.

"use client" does not convert files to HTTP endpoints or WebAssembly.`,
    hints: ['Does a client component still render initial HTML on the server?'],
    tags: ['nextjs', 'use-client', 'hydration', 'ssr'],
  },
  {
    id: 'rsc-zero-bundle-impact',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does importing a large 200 kilobyte Markdown parsing library inside a Server Component have zero impact on the client bundle size?',
    options: [
      'The Server Component executes solely on the server, so its code and dependencies are never shipped to the browser',
      'Next.js automatically strips all imported libraries and replaces them with browser-native equivalents',
      'The library is compressed using gzip before being sent to the browser bundle',
      'Dependencies in Server Components are dynamically streamed as micro-chunks only when clicked',
    ],
    correctOption: 0,
    answerInFull: `Server Components never execute in the browser environment.

    // app/docs/page.tsx (Server Component)
    import { parseMarkdown } from 'heavy-markdown-library' // 200 KB

    export default async function DocPage() {
      const html = parseMarkdown('# Hello World')
      return <div dangerouslySetInnerHTML={{ __html: html }} />
    }

The server runs the Markdown parser, produces the resulting HTML/RSC payload, and sends only that output down to the client. The 200 KB library remains on the server and is never downloaded by the browser.`,
    explanation: `Next.js does not compress or replace third-party libraries on the client; the library simply is not included in the client JavaScript bundle at all.`,
    hints: ['Where does the execution of a Server Component take place?'],
    tags: ['nextjs', 'rsc', 'bundle-size', 'performance'],
  },
  {
    id: 'client-component-capabilities',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which of the following React features strictly requires converting a Server Component to a Client Component using "use client"?',
    options: [
      'Attaching an onClick event listener or using the useState hook',
      'Fetching data asynchronously from an external REST API',
      'Rendering dynamic props passed from an ancestor component',
      'Using the async and await keywords in the component function definition',
    ],
    correctOption: 0,
    answerInFull: `Event listeners like onClick and state hooks like useState require the browser runtime and therefore require "use client".

    'use client'

    import { useState } from 'react'

    export function InteractiveCounter() {
      const [count, setCount] = useState(0)
      return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    }

Server Components cannot listen to user DOM events because they do not execute in the browser. In contrast, async/await and data fetching work directly inside Server Components.`,
    explanation: `Server Components can be async functions and can directly fetch data.

Rendering props is a standard feature of both Server and Client components.

Only browser event handling, state, effects, and browser APIs require Client Components.`,
    hints: ['What needs browser DOM interaction and React state memory?'],
    tags: ['nextjs', 'use-client', 'events', 'hooks'],
  },
  {
    id: 'rsc-rendering-pipeline-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Put the steps of initial page rendering in Next.js in chronological order, from the incoming browser request to full page interactivity.',
    items: [
      'Server executes Server Components and resolves async data queries',
      'Server generates the React Server Component payload and initial HTML',
      'Browser receives initial HTML and displays immediate non-interactive content',
      'Browser downloads and parses the Client Component JavaScript bundles',
      'React hydrates Client Components by binding event listeners to the DOM',
      'Server downloads browser cache files from the client device',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `The Next.js rendering sequence for a page with Server and Client components is:

1. The server executes Server Components and resolves async database or fetch calls.
2. The server compiles the output into HTML and the RSC payload.
3. The browser receives the initial HTML and paints the page (Fast First Contentful Paint).
4. The browser downloads the client-side JavaScript bundles for any Client Components.
5. React hydrates the Client Components, wiring up useState and onClick handlers to make the page interactive.

The server never downloads client browser cache files.`,
    explanation: `HTML is sent first for immediate visual display, followed by client JS downloading and hydration.`,
    hints: [
      'Does the HTML paint before or after the JavaScript bundle is downloaded and hydrated?',
    ],
    tags: ['nextjs', 'rsc', 'rendering-pipeline', 'hydration'],
  },
  {
    id: 'server-inside-client-composition',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the recommended pattern to place a Server Component inside an interactive Client Component without turning the Server Component into a client bundle?',
    options: [
      'Pass the Server Component as the children prop to the Client Component from an outer Server Component',
      'Import the Server Component directly into the Client Component file using dynamic import()',
      'Convert the Server Component into an iframe element',
      'Use the useServerInsideClient() experimental React hook',
    ],
    correctOption: 0,
    answerInFull: `To nest a Server Component inside a Client Component, pass it as children (or another JSX slot prop) from a parent Server Component.

    // ParentPage.tsx (Server Component)
    import { ClientDrawer } from './ClientDrawer'
    import { ServerFeed } from './ServerFeed'

    export default function ParentPage() {
      return (
        <ClientDrawer>
          <ServerFeed />
        </ClientDrawer>
      )
    }

Here, ServerFeed renders on the server. ClientDrawer receives the rendered output as children and can toggle its visibility without bundling ServerFeed into the client.`,
    explanation: `Directly importing a component into a 'use client' file automatically treats the imported component as a Client Component.

Passing it as children lets the server resolve it before the client wrapper receives it.`,
    hints: ['How does React composition with the children prop avoid direct module imports?'],
    tags: ['nextjs', 'rsc', 'composition', 'architecture'],
  },
  {
    id: 'rsc-props-serialization-function-error',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why does Next.js throw a serialization error if a Server Component attempts to pass an onClick handler function as a prop to a Client Component?',
    options: [
      'Props passed across the server-to-client boundary must be serializable to JSON-like data, and JavaScript functions cannot be serialized across network boundaries',
      'Client Components only accept string props and reject any other data types',
      'Server Components only permit inline styles and do not support HTML attributes',
      'The onClick attribute is reserved exclusively for native HTML form buttons',
    ],
    correctOption: 0,
    answerInFull: `Props passed from a Server Component to a Client Component must cross the network as part of the React Server Component payload.

Because functions cannot be serialized into JSON across a network response, passing a function like an event handler throws an error:

    // SERVER COMPONENT (app/page.tsx)
    export default function Page() {
      // ERROR: Functions cannot be passed across the RSC boundary!
      return <ClientButton onClick={() => console.log('clicked')} />
    }

Event handlers must be defined inside the Client Component itself.`,
    explanation: `Only serializable values (primitives, arrays, plain objects, JSX elements) can cross the RSC boundary. Functions cannot cross the wire.`,
    hints: ['Can you serialize an active JavaScript function to JSON?'],
    tags: ['nextjs', 'rsc', 'serialization', 'props'],
  },
  {
    id: 'use-client-placement-debugging',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Where must the "use client" directive be placed in a file to correctly designate a Client Component boundary?',
    options: [
      'At the very top of the file, before any import statements or code',
      'Directly above the component function export line',
      'Inside the JSX return statement wrapped in curly braces',
      'In a separate next.config.mjs configuration mapping',
    ],
    correctOption: 0,
    answerInFull: `The "use client" directive must be the very first statement at the top of the file, preceding all imports.

    'use client'

    import { useState } from 'react'

    export function MyWidget() {
      // ...
    }

If any imports or statements appear before "use client", the bundler will not treat the file as a client boundary.`,
    explanation: `Directives like 'use client' and 'use server' act as module-level pragmas and must precede all imports and declarations in the file.`,
    hints: ['Where do file-level directives like "use strict" or "use client" belong?'],
    tags: ['nextjs', 'use-client', 'syntax'],
  },
  {
    id: 'direct-import-server-in-client',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What happens if a Client Component file directly imports a utility module that accesses server-only resources like Node.js fs or secret environment variables?',
    options: [
      'The build or runtime fails because server-only modules and private keys cannot run or leak in the browser environment',
      'Next.js automatically launches an invisible server proxy to resolve the module calls',
      'The module silently returns null for all function calls in the browser',
      'The browser executes the Node.js APIs natively through polyfills',
    ],
    correctOption: 0,
    answerInFull: `Client Components and their imported modules are bundled into browser JavaScript.

If a Client Component imports Node.js built-ins like fs, or attempts to read private server environment variables, the build will fail or the browser will crash because Node APIs do not exist in the browser.

To enforce this boundary and prevent accidental server code leakage, Next.js provides the 'server-only' package:

    import 'server-only'

Importing 'server-only' in a data module guarantees a build-time error if any Client Component attempts to import it.`,
    explanation: `Next.js does not create invisible proxies for arbitrary server modules imported in client files. Server-only code must stay on the server.`,
    hints: ['Can Node.js filesystem modules run inside a web browser?'],
    tags: ['nextjs', 'server-only', 'security', 'client-components'],
  },
  {
    id: 'optimizing-bundle-leaves-scenario',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A developer creates a product details page. They mark the entire page file with "use client" because of a small interactive "Favorite" button. What is the SWE-1 best practice refactor?',
    options: [
      'Keep the page as a Server Component for data fetching, and extract only the "Favorite" button into a separate Client Component',
      'Leave the whole page as a Client Component since Next.js automatically optimizes bundle sizes',
      'Use an HTML form with a traditional HTTP POST reload instead of any React component',
      'Move the database fetching code into an external script and call it with eval()',
    ],
    correctOption: 0,
    answerInFull: `Best practice in Next.js is to push "use client" down to the leaves of the component tree.

    // app/products/[id]/page.tsx (Server Component)
    import db from '@/lib/db'
    import { FavoriteButton } from './FavoriteButton' // Client Component

    export default async function ProductPage({ params }: { params: { id: string } }) {
      const product = await db.product.findById(params.id)
      return (
        <article>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <FavoriteButton productId={product.id} />
        </article>
      )
    }

This keeps the product page, database client, and HTML rendering on the server, shipping only the tiny JavaScript code needed for the interactive button.`,
    explanation: `Marking entire pages with 'use client' ships unnecessary JavaScript to the browser and loses the security and performance benefits of Server Components.`,
    hints: [
      'Should you make the whole page a Client Component or just the small interactive part?',
    ],
    tags: ['nextjs', 'architecture', 'best-practices', 'rsc'],
  },
]
