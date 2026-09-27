# Future Curriculum: Advanced React & Next.js Topics

This document tracks planned topics for higher tiers (SWE-2, Senior, and Staff) for the **React** and **Next.js** learning tracks.

---

## 1. React (Advanced & Senior Tracks)

### Planned SWE-2 Topics

1. **`use-reducer-and-complex-state`**
   - State transition modeling, action dispatch patterns, reducer purity, state machines.
   - Decoupling action dispatch from render logic.
2. **`use-callback-and-use-memo`**
   - Referential equality vs computational memoization, dependency array gotchas, closure stale state.
   - Measuring before optimizing, `React.memo` prop comparison caveats.
3. **`custom-hooks-architecture`**
   - Extracting reusable domain logic, composing primitive hooks, hook return signatures (tuples vs objects).
   - Invariant verification and cleanup encapsulation.
4. **`transitions-and-suspense`**
   - Concurrent React, `useTransition`, `startTransition`, non-blocking UI updates.
   - `Suspense` boundaries, fallback states, coordinating multi-step loading.

### Planned Senior / Staff Topics

5. **`performance-profiling-and-optimization`**
   - React DevTools Profiler, flame charts, ranked charts, commit phases vs render phases.
   - Windowing and virtualization of long lists (`tanstack-virtual`, `react-window`).
   - Resolving unnecessary re-render waterfalls.
6. **`state-management-ecosystem`**
   - External store subscription (`useSyncExternalStore`), tearing prevention.
   - Client state (Zustand, Redux Toolkit) vs Server Cache (TanStack Query, SWR).
7. **`error-boundaries-and-resilience`**
   - Component tree isolation, error recovery fallbacks, reset keys, logging integrations.
8. **`react-19-modern-features`**
   - React Actions, `useActionState`, `useOptimistic`, server functions, ref as prop.

---

## 2. Next.js (Advanced & Senior Tracks)

### Planned SWE-2 Topics

1. **`middleware-and-edge-routing`**
   - `middleware.ts` matchers, request/response rewriting, HTTP redirects.
   - Cookie inspection, auth token verification at the Edge.
2. **`route-handlers-and-apis`**
   - `GET`, `POST`, `PUT`, `DELETE` route handlers in App Router (`route.ts`).
   - Request streaming, JSON validation, error handling, SSE (Server-Sent Events).
3. **`advanced-caching-and-isr`**
   - `unstable_cache`, on-demand tag revalidation (`revalidateTag`), route revalidation (`revalidatePath`).
   - Route segment options (`dynamic`, `dynamicParams`, `revalidate`, `fetchCache`).
4. **`parallel-and-intercepting-routes`**
   - Parallel slots (`@modal`, `@sidebar`), default fallbacks (`default.tsx`).
   - Intercepting routes (`(.)`, `(..)`, `(...)`) for modal URLs and shareable links.

### Planned Senior / Staff Topics

5. **`authentication-and-authorization-patterns`**
   - Session management, JWT vs database sessions, cookie security (`httpOnly`, `sameSite`, `secure`).
   - Protecting nested layouts, server-side RBAC (Role-Based Access Control).
6. **`web-vitals-and-asset-optimization`**
   - `next/image` layout shifting elimination, WebP/AVIF generation, remote patterns.
   - `next/font` zero-layout-shift self-hosting, `next/script` loading strategies (`beforeInteractive`, `afterInteractive`).
   - Bundle analyzer (`@next/bundle-analyzer`), code splitting.
7. **`resilience-and-error-architecture`**
   - Nested error boundaries (`error.tsx`), route segment errors, root layout errors (`global-error.tsx`).
   - Not found pages (`notFound()`, `not-found.tsx`).
8. **`production-architecture-and-docker`**
   - Standalone output (`output: 'standalone'`), multi-stage Docker builds.
   - Build-time vs run-time environment variables, health checks, zero-downtime restarts.
