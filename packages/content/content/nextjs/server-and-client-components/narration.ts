import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Rethinking the client-server boundary',
    heading: 'Why this matters',
    script: `In traditional React applications, every component you create is
      bundled into JavaScript and shipped to the user's browser. Even if a
      component just fetches data and outputs HTML, the browser has to
      download, parse, and execute all of its code.

      Next.js changes this with React Server Components. By default, components
      run solely on the server. They produce rendered markup and data without
      shipping any JavaScript to the client.

      In technical interviews, you will frequently be asked how Server
      Components differ from traditional server-side rendering, when you should
      introduce the use client directive, and how to structure applications so
      heavy server logic is not accidentally bundled into client code.`,
  },
  {
    title: 'Zero client JavaScript by default',
    heading: 'The default is server',
    script: `In the App Router, every component inside the app directory is a
      Server Component unless you explicitly declare otherwise. You do not need
      to add any special tags or wrappers to get this behavior.

      Because Server Components run only on the server, their JavaScript is
      never sent to the browser. If you import a massive markdown parsing library
      or an internal database client inside a Server Component, exactly zero
      bytes of that library end up in the user's bundle.

      Server Components can read databases, query backend microservices, and
      access private environment variables directly.

      However, because they never execute in the browser, they cannot use state
      hooks like useState, lifecycle hooks like useEffect, or browser APIs like
      window or localStorage.`,
  },
  {
    title: 'Defining the hydration boundary',
    heading: "The 'use client' boundary",
    script: `When a component needs browser capabilities, like responding to
      button clicks, managing form inputs, or reading window scroll positions,
      you add the use client directive at the very top of the file.

      A widespread misunderstanding is that use client means a component runs
      only in the browser. That is not true.

      Client Components are still pre-rendered into static HTML on the server
      during initial page load so the user sees content immediately. Then, in the
      browser, React hydrates that HTML, binding interactive event listeners.

      The use client directive defines a module boundary. It tells Next.js and
      the bundler that this file and everything it imports belongs in the client
      bundle. Best practice is to push this boundary as far down into the leaf
      nodes of your tree as possible to keep your JavaScript bundles lean.`,
  },
  {
    title: 'Nesting server components inside client wrappers',
    heading: 'Composing server and client components',
    script: `A common architectural puzzle is how to place a Server Component
      inside a Client Component. For instance, you might have an interactive
      collapsible drawer that holds a heavy feed of server-rendered data.

      You cannot directly import a Server Component into a Client Component,
      because the bundler would pull the server component into the client
      bundle.

      Instead, you use composition. You pass the Server Component into the
      Client Component as children or as another JSX prop from a parent Server
      Component.

      The server renders the child component on the server, and hands the
      resulting rendered element to the client wrapper. The client wrapper
      manages the open or closed state, while the heavy child component remains
      pure server-rendered content with zero client bundle overhead.`,
  },
  {
    title: 'Serialization and props across the wire',
    heading: 'Boundary rules and serialization',
    script: `When a Server Component renders a Client Component and passes props
      to it, those props must travel across the network from the server
      process to the browser.

      Because of this network hop, every prop passed across the server-client
      boundary must be serializable.

      You can pass strings, numbers, booleans, arrays, plain objects, and JSX
      elements. But you cannot pass functions, class instances, or database
      connections.

      A very common beginner mistake is trying to pass an onClick event handler
      function from a Server Component into a Client Component. This throws a
      serialization error because functions cannot be turned into JSON-like data
      across the wire. Event handlers must always be defined directly inside
      Client Components.`,
  },
]
