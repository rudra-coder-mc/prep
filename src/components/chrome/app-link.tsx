'use client'

import Link, { useLinkStatus } from 'next/link'
import { useEffect } from 'react'
import { endNavigation, startNavigation } from './navigation-store'

/**
 * Reports its own link's pending state to the global store. It has to live
 * inside the Link it belongs to, which is why it renders nothing.
 */
function NavigationBeacon() {
  const { pending } = useLinkStatus()

  useEffect(() => {
    if (!pending) return
    startNavigation()
    return endNavigation
  }, [pending])

  return null
}

/**
 * The only internal link the app uses. Every navigation therefore shows up in
 * the progress bar, which is the difference between "nothing happened" and
 * "this is loading".
 */
export function AppLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavigationBeacon />
    </Link>
  )
}
