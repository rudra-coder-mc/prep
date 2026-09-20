import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Mutating data without API routes',
    heading: 'Why this matters',
    script: `In traditional React applications, modifying server data is a
      multi-step process. You have to create an API route handler, write a
      client fetch request with manual POST options, serialize your data to
      JSON, handle HTTP status codes, and manually update local component
      state.

      Next.js Server Actions eliminate this ceremony. A Server Action is an
      asynchronous function that runs on the server, but can be invoked directly
      from client forms, buttons, or custom hooks.

      You get type safety and backend execution without manually configuring
      REST API endpoints. In this lesson, we will explore how the use server
      directive works, how HTML forms gain progressive enhancement, and how
      React hooks track pending states during submissions.`,
  },
  {
    title: 'Declaring server functions',
    heading: "The 'use server' directive",
    script: `You create a Server Action using the use server directive.

      You can add use server at the top of an individual async function inside a
      Server Component, or place it at the very top of a dedicated file. When
      placed at the file level, all exported functions become Server Actions
      that can be imported and executed from Client Components.

      Behind the scenes, Next.js wires up an internal HTTP POST endpoint for
      the action.

      Because Server Actions run on your server runtime, they can query
      databases and read private environment secrets directly.

      A critical security rule is that you must treat every Server Action like a
      public REST endpoint. Anyone can make a network request directly to it, so
      always authenticate the user and validate all input arguments before
      executing operations.`,
  },
  {
    title: 'Forms that work without JavaScript',
    heading: 'Form integration and progressive enhancement',
    script: `Server Actions integrate directly with the native HTML form
      element. Instead of writing an onSubmit handler that cancels the default
      event, you pass the Server Action directly to the form's action attribute.

      When a user submits the form, the browser packages the input fields into a
      standard FormData object and hands it to your Server Action.

      This approach delivers progressive enhancement out of the box. If a user
      has a slow network connection or client JavaScript is still downloading,
      the form still works. The browser submits the form via native HTTP POST,
      the server mutates the database, and fresh HTML is served.

      Once JavaScript loads, React seamlessly intercepts the form submission,
      preventing a hard page refresh and delivering a fast single-page app
      feel.`,
  },
  {
    title: 'Pending indicators and action state',
    heading: 'Managing pending state and feedback',
    script: `Good user interfaces need to communicate when an action is in
      flight, disabling submit buttons and showing loading indicators.

      React provides two hooks specifically for this purpose: useFormStatus and
      useActionState.

      The useFormStatus hook gives you a pending boolean indicating whether the
      parent form is currently submitting. To use it, you must place the hook
      inside a child component nested within the form element.

      When your Server Action returns validation errors or updated records, the
      useActionState hook allows a Client Component to capture that returned
      state and maintain access to the pending status simultaneously.`,
  },
  {
    title: 'Updating the UI after mutation',
    heading: 'Invalidation and redirects',
    script: `Once a Server Action modifies data in your database, the user's
      screen needs to show the latest changes.

      Next.js provides revalidatePath and revalidateTag inside Server Actions.
      Calling revalidatePath tells Next.js to purge cached data for that route
      and re-render the Server Components with the fresh data, streaming the
      updated UI directly to the client.

      If the mutation means the user should move to another screen, such as
      redirecting to a newly created article, you call the redirect function
      from next slash navigation.

      Just remember that redirect works internally by throwing a special
      control flow error. Avoid wrapping redirect in a broad try catch block
      that intercepts all errors, or the redirect will fail to execute.`,
  },
]
