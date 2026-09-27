import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'server-action-directive-purpose',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What does the "use server" directive designate when placed at the top of an async function or file in Next.js?',
    options: [
      'It defines an asynchronous Server Action that can be called from client forms and components, executing solely on the server',
      'It marks a React component to be rendered only on the server, replacing "use client"',
      'It configures a WebSocket server socket for real-time bidirectional streaming',
      'It instructs Node.js to spin up a new worker thread cluster for the file',
    ],
    correctOption: 0,
    answerInFull: `The "use server" directive marks an async function as a Server Action.

    'use server'

    export async function saveProfile(formData: FormData) {
      // Executes on the server in response to form submission or client call
    }

Server Actions can be called from client-side forms, event listeners, or custom hooks. Next.js creates an internal POST endpoint to handle the network execution automatically.`,
    explanation: `"use server" is for mutation functions (Server Actions). Components inside the app directory are already Server Components by default without any directive.`,
    hints: ['Does "use server" create a callable server function or mark a UI component?'],
    tags: ['nextjs', 'server-actions', 'use-server'],
  },
  {
    id: 'server-action-form-prop',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'How do you bind a Server Action to an HTML form in a Next.js component to handle user submissions?',
    options: [
      "Pass the Server Action directly to the form's action prop: <form action={myServerAction}>",
      'Attach an onSubmit listener that manually calls fetch() with JSON headers',
      'Assign the action function to a global window.onFormSubmit listener',
      'Wrap the form in an <ActionHandler action={myServerAction}> higher-order component',
    ],
    correctOption: 0,
    answerInFull: `React and Next.js extend the standard HTML form action attribute to accept Server Action functions directly:

    import { createItem } from './actions'

    export default function ItemForm() {
      return (
        <form action={createItem}>
          <input name="title" required />
          <button type="submit">Create</button>
        </form>
      )
    }

React automatically handles submitting the form, packaging inputs into a FormData instance, and executing the server function.`,
    explanation: `You do not need manual onSubmit listeners or custom higher-order components; pass the function directly to the form's action attribute.`,
    hints: ['Which standard HTML form attribute accepts the Server Action function directly?'],
    tags: ['nextjs', 'forms', 'server-actions'],
  },
  {
    id: 'progressive-enhancement-forms',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is passing a Server Action to <form action={myAction}> considered progressive enhancement?',
    options: [
      'The form submits and executes via native browser HTTP POST even before JavaScript finishes loading, and upgrades to single-page AJAX once hydrated',
      'The form automatically translates input text into multiple human languages',
      'The browser automatically generates client-side validation rules based on database schema types',
      'Next.js guarantees zero network latency regardless of user connection speed',
    ],
    correctOption: 0,
    answerInFull: `Progressive enhancement means core features work without depending on client JavaScript:

1. Before JavaScript loads: Clicking submit triggers a native browser HTTP POST request. The server executes the action and returns fresh HTML.
2. After JavaScript hydrates: React intercepts the submit event and sends an asynchronous background request, avoiding a hard full-page browser refresh.

This guarantees forms remain functional even on slow cellular connections or if client scripts fail to download.`,
    explanation: `Progressive enhancement ensures basic HTML functionality works without client JavaScript, then layers on enhanced interactive behavior when scripts load.`,
    hints: ['What happens if client JavaScript is slow to load or disabled?'],
    tags: ['nextjs', 'progressive-enhancement', 'forms', 'performance'],
  },
  {
    id: 'server-action-lifecycle-ordering',
    type: 'concept',
    form: 'ordering',
    tier: 'swe-1',
    prompt:
      'Put the steps of an enhanced form submission using a Server Action in chronological order after client-side hydration.',
    items: [
      'User clicks the submit button on an interactive form',
      'React intercepts the submit event and collects input data into FormData',
      'Next.js dispatches an asynchronous HTTP POST request to the internal action endpoint',
      'Server Action executes on the server, modifying database records and invalidating caches',
      'Server streams the updated UI payload back to the browser to re-render client components',
      'Browser triggers a hard full-document reload discarding all client memory',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    answerInFull: `The sequence of an enhanced Server Action submission is:

1. The user clicks submit on the hydrated form.
2. React intercepts the native submit event and bundles inputs into FormData.
3. Next.js sends an asynchronous HTTP POST to the server.
4. The Server Action runs on the server, mutates backend data, and invalidates caches.
5. Next.js streams the updated UI and RSC payload back to the client, updating the DOM smoothly without a hard page reload.

A hard document reload is prevented during client-side execution.`,
    explanation: `React intercepts the submission, transmits data asynchronously, and updates the UI without a full reload.`,
    hints: ['Does React prevent the default full-page reload when JavaScript is active?'],
    tags: ['nextjs', 'server-actions', 'lifecycle', 'forms'],
  },
  {
    id: 'form-data-parameter-access',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'When a Server Action is triggered by a <form action={myAction}>, how does the function retrieve input values?',
    options: [
      'Via the first argument, which is automatically supplied as a standard FormData instance: formData.get("fieldName")',
      'By reading from a global request.body JSON object inside the function body',
      'By inspecting window.document.forms[0].elements on the server',
      'By injecting a custom @Input() TypeScript decorator on each function parameter',
    ],
    correctOption: 0,
    answerInFull: `Forms pass a native FormData object as the first parameter to the Server Action:

    'use server'

    export async function createPost(formData: FormData) {
      const title = formData.get('title') as string
      const content = formData.get('content') as string
      // save to database...
    }

Input elements must have a name attribute (e.g. <input name="title" />) to appear in the FormData object.`,
    explanation: `The browser packages form elements with names into a standard Web API FormData object, which React passes directly to the action function.`,
    hints: ['What standard Web API object represents form fields and values?'],
    tags: ['nextjs', 'formdata', 'server-actions'],
  },
  {
    id: 'use-form-status-placement',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Where must the useFormStatus hook be called within a component tree to correctly track form submission status?',
    options: [
      'Inside a child component rendered within the <form> element',
      'In the same parent component that renders the <form> tag',
      'Inside the Server Action function body on the backend',
      'Inside the root app/layout.tsx file',
    ],
    correctOption: 0,
    answerInFull: `The useFormStatus hook relies on React Context provided by the parent <form>.

Therefore, it must be called inside a component that is a child of the form:

    // Child component (Client Component)
    'use client'
    import { useFormStatus } from 'react-dom'

    export function SubmitButton() {
      const { pending } = useFormStatus()
      return <button disabled={pending}>{pending ? 'Saving...' : 'Submit'}</button>
    }

    // Parent form
    export function ProfileForm() {
      return (
        <form action={updateProfile}>
          <input name="username" />
          <SubmitButton /> {/* Hook works here! */}
        </form>
      )
    }`,
    explanation: `If useFormStatus is called in the same component that declares the <form>, it will return pending: false because it cannot read context from a form rendered in its own return statement.`,
    hints: [
      'Can a component read React context from an element rendered in its own JSX return block?',
    ],
    tags: ['nextjs', 'react-dom', 'useFormStatus', 'forms'],
  },
  {
    id: 'use-action-state-purpose',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: "What tuple of values does React's useActionState hook return in a Client Component?",
    options: [
      '[state, formAction, isPending]',
      '[data, error, mutate]',
      '[loading, startTransition]',
      '[response, executeAction]',
    ],
    correctOption: 0,
    answerInFull: `The useActionState hook returns three values:

    const [state, formAction, isPending] = useActionState(serverAction, initialState)

- state: The latest value returned by the Server Action (such as validation errors or success messages).
- formAction: A wrapper function passed to the <form action={formAction}> prop.
- isPending: A boolean flag indicating whether the action is currently executing on the server.`,
    explanation: `useActionState simplifies managing the returned action state alongside pending indicators in interactive Client Components.`,
    hints: [
      'It returns the state value, the action wrapper to pass to the form, and the pending status boolean.',
    ],
    tags: ['nextjs', 'react', 'useActionState', 'hooks'],
  },
  {
    id: 'cache-revalidation-in-action',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why is revalidatePath() commonly called inside a Server Action after updating the database?',
    options: [
      'It tells Next.js to purge cached data for that route and re-render the Server Components with the newly mutated database data',
      'It restarts the client browser session and clears the user cookies',
      'It converts dynamic Server Components into static HTML files on the client filesystem',
      'It generates a PDF report of the server mutation log',
    ],
    correctOption: 0,
    answerInFull: `When a mutation occurs, the server-side caches for affected routes must be invalidated:

    'use server'

    import { revalidatePath } from 'next/cache'

    export async function addComment(formData: FormData) {
      await db.comment.create({ ... })
      revalidatePath('/posts/[id]')
    }

Calling revalidatePath purges the cached Server Components for that path. Next.js re-renders the components with fresh data and sends the updated markup to the client in the same response.`,
    explanation: `revalidatePath clears the Next.js cache for the specified route so users see their changes immediately after mutation.`,
    hints: ['What happens to stale cached data when a database record is added or updated?'],
    tags: ['nextjs', 'revalidatePath', 'caching', 'server-actions'],
  },
  {
    id: 'server-action-security-model',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Why must developers treat every Server Action like a publicly accessible REST API endpoint?',
    options: [
      'Anyone with the action ID can send direct HTTP POST requests to invoke the function, regardless of UI form validation',
      'Next.js publishes all Server Actions to a public Swagger documentation page automatically',
      'Server Actions are converted to open WebRTC channels accessible by any network user',
      'Node.js disables SSL encryption when Server Actions are enabled',
    ],
    correctOption: 0,
    answerInFull: `Under the hood, Server Actions expose internal HTTP POST endpoints:

A malicious user can bypass the browser UI entirely and send arbitrary POST requests directly to your Server Action.

Therefore, you must never rely solely on client-side form validation. You must always:
1. Verify user authentication and authorization (e.g. check session cookies).
2. Validate and sanitize all input arguments (e.g. using Zod or a validator).`,
    explanation: `Server Actions create network-reachable POST endpoints. Never assume incoming requests originate from your trusted UI form.`,
    hints: ['Can an attacker send an HTTP POST request with curl directly to your server?'],
    tags: ['nextjs', 'security', 'server-actions', 'authentication'],
  },
  {
    id: 'redirect-in-try-catch-debugging',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'What problem occurs if you call redirect("/dashboard") inside a broad try/catch block that catches all errors inside a Server Action?',
    options: [
      'redirect() works internally by throwing a special NEXT_REDIRECT error, so catching it prevents Next.js from performing the navigation',
      'Node.js throws a fatal segmentation fault and terminates the application',
      'The user is redirected to an error 500 page instead of the requested URL',
      'The browser executes a recursive redirect loop indefinitely',
    ],
    correctOption: 0,
    answerInFull: `In Next.js, redirect() does not return a response; it intentionally throws an internal exception (NEXT_REDIRECT) that Next.js catches to handle navigation:

    'use server'
    import { redirect } from 'next/navigation'

    export async function saveProfile() {
      try {
        await db.save()
        redirect('/dashboard') // THROWS an internal NEXT_REDIRECT error!
      } catch (err) {
        // BUG: Catches NEXT_REDIRECT and suppresses the redirect!
        return { error: 'Failed' }
      }
    }

To fix this, call redirect() outside the try/catch block, or re-throw the error if it is a Next.js redirect.`,
    explanation: `Next.js relies on thrown control-flow errors for redirect() and notFound(). Swallowing all exceptions in a catch block prevents the redirect from taking effect.`,
    hints: ['How does Next.js interrupt component or action execution to trigger a redirect?'],
    tags: ['nextjs', 'redirect', 'error-handling', 'debugging'],
  },
]
