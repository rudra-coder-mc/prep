import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'rsc-async-fetch-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How does an engineer fetch data inside a React Server Component in the Next.js App Router?',
    options: [
      'By declaring the component as an async function and directly using await fetch() in the component body',
      'By calling useEffect and storing the result in a useState variable after the component mounts',
      'By exporting a getServerSideProps function alongside the component',
      'By calling the useServerFetch hook imported from react-dom',
    ],
    correctOption: 0,
    answerInFull: `Server Components can be declared as native JavaScript async functions.

    // app/users/page.tsx
    export default async function UsersPage() {
      const res = await fetch('https://api.example.com/users')
      const users = await res.json()
      return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
    }

The server awaits the promise before generating the HTML and streaming the response. There is no need for useEffect, useState, or loading spinners during initial page generation.`,
    explanation: `getServerSideProps is the legacy Pages Router pattern.

useEffect and useState only work in Client Components and run after hydration.

Async Server Components allow native direct await in the component body.`,
    hints: ['Can React Server Components be declared with the async keyword?'],
    tags: ['nextjs', 'data-fetching', 'rsc', 'async'],
  },
  {
    id: 'fetch-request-memoization-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'If a Header component and a Sidebar component in the same page both execute fetch("https://api.example.com/user") with the same options during a single server render, how many network calls are made?',
    options: [
      'Exactly 1 network call, because Next.js automatically memoizes and deduplicates identical fetch requests across the render pass',
      '2 network calls, because each component instance executes in isolation',
      '0 network calls, because Next.js requires all data to be passed down through props from the root layout',
      'It throws an error due to concurrent lock conflicts on the URL endpoint',
    ],
    correctOption: 0,
    answerInFull: `Next.js automatically extends the native fetch API with Request Memoization.

If multiple components in the same component tree make identical fetch requests during the same server render pass, only one network request is dispatched.

The first fetch executes the HTTP request and stores the result in an in-memory cache. Subsequent calls with the same URL and options return the cached result instantly without making additional network requests.`,
    explanation: `Request memoization applies per-render. Once the server response is complete, the in-memory memoization cache is reset.`,
    hints: ['Does Next.js deduplicate identical fetch calls within a single render cycle?'],
    tags: ['nextjs', 'memoization', 'caching', 'performance'],
  },
  {
    id: 'dynamic-rendering-triggers',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Which of the following operations will automatically opt a Next.js route segment into Dynamic Rendering at request time?',
    options: [
      'Calling cookies() or headers() from next/headers to read incoming request data',
      'Importing a CSS module or styled-jsx stylesheet',
      'Rendering more than five nested child components',
      'Using the Next.js Image component with priority loading',
    ],
    correctOption: 0,
    answerInFull: `Next.js automatically switches a route from Static Rendering to Dynamic Rendering when it encounters dynamic functions:

- Reading cookies with cookies()
- Reading request headers with headers()
- Accessing dynamic searchParams on page components

Because cookies and headers are unique to each incoming HTTP request, Next.js cannot pre-compute the page at build time.`,
    explanation: `Stylesheets, component nesting depth, and Image components have no effect on whether a page is statically or dynamically rendered.`,
    hints: [
      'Which of these functions depends on specific data from an incoming browser HTTP request?',
    ],
    tags: ['nextjs', 'dynamic-rendering', 'cookies', 'headers'],
  },
  {
    id: 'cache-revalidation-order',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Put the steps of time-based cache revalidation (stale-while-revalidate) in chronological order when a user requests a page after its cache TTL has expired.',
    items: [
      'User visits the page after the revalidation time window has elapsed',
      'Next.js immediately serves the previously cached (stale) page to the user',
      'Next.js initiates a background revalidation fetch to retrieve fresh data',
      'Background fetch resolves and Next.js updates the cache with fresh data',
      'Subsequent visitors receive the newly cached data',
      'Browser clears its local localStorage to invalidate client tokens',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `Time-based revalidation follows the Stale-While-Revalidate pattern:

1. A request arrives after the TTL (time-to-live) has expired.
2. Next.js serves the cached (stale) data immediately so the user experiences zero delay.
3. In the background, Next.js triggers a revalidation fetch.
4. When the revalidation fetch succeeds, Next.js updates the cache.
5. All subsequent requests receive the fresh cached response.

The browser localStorage is never involved in server-side cache revalidation.`,
    explanation: `Stale data is served immediately while the background revalidation occurs asynchronously.`,
    hints: ['Does the user wait for the new fetch to finish, or do they receive stale data first?'],
    tags: ['nextjs', 'caching', 'revalidation', 'swr'],
  },
  {
    id: 'revalidate-time-based-syntax',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the correct way to configure a fetch request in Next.js to cache its response for 60 seconds before revalidating?',
    options: [
      'fetch("https://api.example.com/data", { next: { revalidate: 60 } })',
      'fetch("https://api.example.com/data", { cache: "ttl-60s" })',
      'fetch("https://api.example.com/data", { headers: { "X-Revalidate": "60" } })',
      'fetch("https://api.example.com/data", { timeout: 60000 })',
    ],
    correctOption: 0,
    answerInFull: `Next.js extends the standard fetch options object with the 'next' configuration property.

    const res = await fetch('https://api.example.com/data', {
      next: { revalidate: 60 },
    })

This instructs the Next.js Data Cache to keep the response fresh for 60 seconds before triggering background revalidation on subsequent requests.`,
    explanation: `cache: 'ttl-60s' and custom HTTP headers are not Next.js cache configuration options.

The valid Next.js extension is next: { revalidate: <seconds> }.`,
    hints: ['Which property inside the options object is prefixed with "next"?'],
    tags: ['nextjs', 'data-fetching', 'caching', 'revalidate'],
  },
  {
    id: 'on-demand-revalidation-tag',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'How does on-demand cache revalidation using cache tags work in Next.js?',
    options: [
      'Requests are tagged using fetch(url, { next: { tags: ["my-tag"] } }) and purged when calling revalidateTag("my-tag")',
      'Components are decorated with @CacheTag("my-tag") and purged via the browser URL query parameter ?clear=my-tag',
      'Tags are stored in indexedDB on the client and cleared by calling window.caches.delete("my-tag")',
      'Every tag requires a dedicated Redis database cluster configured in next.config.mjs',
    ],
    correctOption: 0,
    answerInFull: `On-demand cache revalidation allows fine-grained invalidation of specific fetch queries without clearing entire route caches.

    // Fetch call tagged with 'products'
    const res = await fetch('https://api.example.com/products', {
      next: { tags: ['products'] },
    })

    // In a Server Action or Route Handler:
    import { revalidateTag } from 'next/cache'

    export async function addProduct() {
      'use server'
      await db.product.create({ ... })
      revalidateTag('products') // Immediately purges cached queries tagged with 'products'
    }`,
    explanation: `revalidateTag purges cache entries associated with that tag in the Next.js Data Cache. No client indexedDB or TypeScript decorators are used.`,
    hints: ['How do you associate a tag with fetch and purge it from next/cache?'],
    tags: ['nextjs', 'caching', 'revalidateTag', 'on-demand'],
  },
  {
    id: 'waterfall-prevention-promise-all',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What performance drawback occurs when two independent fetch calls are awaited one after another in a Server Component, and how should it be fixed?',
    options: [
      'An unnecessary network waterfall occurs where the second fetch waits for the first; fix it by running them concurrently with Promise.all()',
      'The server crashes because Node.js only allows a single active network socket per component',
      'The second fetch automatically overwrites the memory buffer of the first fetch',
      'Next.js cancels the first fetch when the second fetch is initiated',
    ],
    correctOption: 0,
    answerInFull: `Sequential awaits create an artificial request waterfall:

    // WATERFALL: Total time = time(user) + time(posts)
    const user = await fetchUser()
    const posts = await fetchPosts()

If the two queries are independent, running them concurrently with Promise.all reduces the total latency to the duration of the slowest query:

    // PARALLEL: Total time = Math.max(time(user), time(posts))
    const [user, posts] = await Promise.all([
      fetchUser(),
      fetchPosts(),
    ])`,
    explanation: `Sequential awaiting causes the server to sit idle waiting for the first network request to return before starting the second. Parallelizing with Promise.all is standard practice for independent fetches.`,
    hints: ['If fetch A and fetch B do not depend on each other, do they need to wait in line?'],
    tags: ['nextjs', 'performance', 'waterfalls', 'promise-all'],
  },
  {
    id: 'memoization-vs-data-cache',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What is the fundamental difference between Request Memoization and the Data Cache in Next.js?',
    options: [
      'Request Memoization deduplicates fetch calls in memory for the duration of a single render pass, whereas the Data Cache persists responses across requests and deployments',
      'Request Memoization stores data in the browser, while the Data Cache stores data on the server',
      'Request Memoization works only with POST requests, while the Data Cache works only with GET requests',
      'Request Memoization is a manual hook, while the Data Cache is fully automated',
    ],
    correctOption: 0,
    answerInFull: `Next.js distinguishes between two caching layers:

1. Request Memoization: An in-memory mechanism tied to the lifecycle of a single render pass. It ensures that calling fetch with the same URL across different components in the same render tree only makes 1 HTTP request. The cache is destroyed as soon as the render finishes.

2. Data Cache: A persistent HTTP cache that lives across multiple user requests, page reloads, and deployments. It is controlled via the cache and next.revalidate options on fetch.`,
    explanation: `Both mechanisms run on the server. Memoization is short-lived per-render; Data Cache is persistent across requests.`,
    hints: [
      'Does request memoization survive across multiple incoming HTTP requests from different users?',
    ],
    tags: ['nextjs', 'caching', 'memoization', 'architecture'],
  },
  {
    id: 'server-component-error-handling',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How does the Next.js App Router handle unhandled promise rejections or thrown errors during data fetching inside a Server Component?',
    options: [
      'The error bubbles up to the nearest error.tsx file in the route segment hierarchy, rendering that error boundary fallback',
      'The server immediately shuts down and restarts the Node process',
      'Next.js displays an empty white screen with no console output',
      'The component silently renders null and suppresses the exception',
    ],
    correctOption: 0,
    answerInFull: `When an error is thrown in a Server Component:

1. The thrown error is caught by the nearest error.tsx file in the segment hierarchy.
2. The error.tsx component renders as a fallback UI for that segment.
3. The rest of the page (such as the outer layout.tsx) remains intact and interactive.

This prevents an isolated data fetching failure from crashing the entire application.`,
    explanation: `Next.js does not crash the Node process on component errors; it delegates error presentation to error boundaries defined by error.tsx files.`,
    hints: ['What special file in a route folder catches runtime errors in child components?'],
    tags: ['nextjs', 'error-handling', 'error-boundary', 'app-router'],
  },
  {
    id: 'client-vs-server-fetching-tradeoff',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is fetching initial page data on the server in a Server Component generally superior to fetching inside a Client Component useEffect?',
    options: [
      'It eliminates client-server latency round trips to the database, avoids shipping API secrets to the browser, and renders full HTML for SEO',
      'Client Components are not permitted to use JSON data formats',
      'Browsers restrict useEffect hooks to a maximum of 3 API calls per session',
      'Server Components automatically encrypt all client network traffic with quantum keys',
    ],
    correctOption: 0,
    answerInFull: `Server Component data fetching provides major architectural advantages:

- Latency: The server is typically co-located with the database or backend services in the same data center, drastically reducing request round-trip time.
- Bundle size: No data-fetching or client-state management libraries are shipped to the client.
- Security: Database credentials, API tokens, and secret environment variables never leave the server.
- SEO and UX: The page arrives in the browser with full HTML content, preventing loading flicker and ensuring search engines can index the content.`,
    explanation: `Client-side useEffect fetching causes layout shift, requires shipping API keys or public proxies, and forces the browser to download JS before even starting data fetching.`,
    hints: ['Think about SEO, latency between server and database, and API credentials.'],
    tags: ['nextjs', 'rsc', 'data-fetching', 'performance', 'security'],
  },
]
