import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Direct data fetching without boilerplate',
    heading: 'Why this matters',
    script: `In traditional React client applications, fetching data requires a
      lot of ceremony. You render empty states, trigger useEffect after
      mounting, track loading spinners, manage error state, and cancel in-flight
      requests when components unmount.

      Next.js App Router changes this entirely. React Server Components can be
      declared as standard JavaScript async functions. You can directly await
      database queries or HTTP fetch calls right inside the component body.

      Beyond simple fetching, Next.js implements an intelligent caching
      pipeline. Understanding how request memoization prevents duplicate calls,
      how static and dynamic rendering differ, and how to invalidate stale
      caches on demand is essential for any full-stack React engineer.`,
  },
  {
    title: 'Components that await data',
    heading: 'Async Server Components',
    script: `Because Server Components run in Node.js on the backend, they can
      be native async functions. When Next.js renders your page, it awaits your
      data queries before generating the HTML and streaming it to the browser.

      This means users receive fully rendered, content-rich HTML immediately.
      There are no layout shifts or blank screens waiting for client-side
      JavaScript bundles to download and boot.

      When a page requires multiple independent data sources, be careful not to
      await them in a sequential waterfall. Awaiting one call after another
      multiplies your latency. Instead, use JavaScript's Promise dot all to fire
      both requests in parallel, cutting your total wait time down to whichever
      request is slowest.`,
  },
  {
    title: 'Automatic request deduplication',
    heading: 'Request memoization',
    script: `In a large component tree, multiple components frequently need the
      exact same data. For example, your navigation header might need the
      current user's profile to show an avatar, while the main page needs the
      same profile to show an account settings form.

      In traditional architectures, you would either fetch at the root layout
      and drill props down through dozens of layers, or reach for complex
      global state stores.

      Next.js solves this with automatic request memoization. If multiple
      components throughout your tree call fetch with the identical URL and
      options during a single render pass, Next.js executes the network call
      only once.

      Every subsequent call receives the memoized response from memory. You can
      freely fetch the data exactly where it is used without worrying about
      duplicate network requests.`,
  },
  {
    title: 'Build time vs request time',
    heading: 'Static versus dynamic rendering',
    script: `Next.js automatically determines whether a route segment should be
      rendered statically or dynamically.

      Static rendering is the default. If a route does not rely on
      request-specific data, Next.js pre-renders it at build time. The resulting
      HTML is cached globally on content delivery networks, providing instant
      load times and near-zero compute cost.

      Dynamic rendering happens when a route needs information that changes per
      request. As soon as you read cookies, inspect incoming HTTP headers, or
      access URL search parameters, Next.js automatically switches that route to
      dynamic rendering at request time.

      You can also explicitly opt into dynamic rendering by passing cache no
      store to your fetch requests.`,
  },
  {
    title: 'Keeping cached data fresh',
    heading: 'Cache revalidation strategies',
    script: `Cached data is fast, but real-world data changes. Next.js provides
      two core mechanisms to refresh cached content: time-based revalidation and
      on-demand revalidation.

      Time-based revalidation uses the revalidate option on fetch, specifying a
      duration in seconds. Next.js uses a stale-while-revalidate model. It
      serves the cached version instantly, while kicking off a background
      refresh once the time window expires.

      On-demand revalidation updates data immediately when an event occurs, like
      a user publishing a blog post or submitting a form.

      You can purge an entire route path using revalidatePath, or assign custom
      tags to specific fetch requests and purge only those queries using
      revalidateTag. Tag-based invalidation gives you surgical precision without
      blowing away unrelated caches.`,
  },
]
