import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'The file system as the routing engine',
    heading: 'Why this matters',
    script: `In traditional React single-page applications, you configure
      routes imperatively in code, matching URL strings to component imports
      and wiring up lazy loading manually.

      Next.js replaces that manual setup by turning your folder structure into
      the routing system. With the App Router, every folder inside the app
      directory becomes a URL segment, and special file conventions define how
      that segment renders.

      In an entry-level interview, interviewers do not just test if you know
      what page dot tsx does. They test whether you understand the structural
      behavior: how nested layouts share user interface without re-rendering,
      why client state is preserved during route transitions, how templates
      differ from layouts, and why the Next.js Link component feels instant.`,
  },
  {
    title: 'Folders define routes, files define UI',
    heading: 'File-system conventions',
    script: `In the App Router, URL paths mirror your folder tree directly. A
      folder only becomes a publicly reachable web page if it contains a file
      named page dot tsx. If a folder contains components or utilities without a
      page file, it stays private and cannot be addressed by URL.

      Next.js uses reserved file names inside any segment folder to handle UI
      responsibilities. A layout file wraps the current segment and all of its
      children. A loading file automatically wraps the page in a React Suspense
      boundary so users see an immediate placeholder while data streams in.
      An error file acts as an error boundary to isolate failures without
      crashing the entire application.

      At the root of the app directory, a root layout is mandatory. It is the
      one place that renders the opening HTML and body tags for your entire
      application.`,
  },
  {
    title: 'Preserving UI and state across page switches',
    heading: 'Layouts preserve state',
    script: `A layout is a component that accepts children and wraps them in a
      shared frame, such as a top navigation bar or an account sidebar.

      The defining superpower of a Next.js layout is that it does not unmount or
      re-render when you navigate between child pages.

      When a user moves from an analytics page to a settings page inside a
      dashboard, the dashboard layout stays mounted. If the user has typed into a
      search input in the sidebar, or has an audio player playing in the header,
      that state is never lost. Only the child route segment inside the layout
      is replaced.

      This eliminates unnecessary network fetches, prevents layout shifts, and
      keeps the user experience smooth and continuous.`,
  },
  {
    title: 'When you need a clean slate on transition',
    heading: 'Templates versus Layouts',
    script: `Most of the time you want layouts to preserve their state across
      navigation. But occasionally you need the opposite: you want state to
      reset and lifecycle effects to fire again whenever the user visits a new
      page.

      This is what template dot tsx is for. A template accepts children just
      like a layout, but on every single navigation, Next.js creates a brand
      new instance of the template component.

      When a new instance mounts, all internal state resets to its initial
      values, and any useEffect hooks run fresh.

      Use a layout when you want shared navigation, preserved search filters, or
      audio players to survive page changes. Use a template when you need to log
      page views on every visit or trigger entrance animations on every route.`,
  },
  {
    title: 'Instant transitions and background prefetching',
    heading: 'Navigation and prefetching',
    script: `To move between pages in Next.js, you should always use the Link
      component from next slash link rather than a standard HTML anchor tag.

      Standard anchor tags trigger a full browser reload, discarding all client
      memory and re-fetching the HTML document from scratch.

      The Link component intercepts clicks and performs a fast client-side
      transition, requesting only the specific data needed for the new page.

      Even better, in production Next.js automatically prefetches links in the
      background as soon as they appear in the user's viewport. By the time a
      user actually clicks the link, the destination data is already waiting in
      the local cache, making the page transition feel instantaneous.`,
  },
]
