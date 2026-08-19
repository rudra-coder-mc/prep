/**
 * How many links are currently mid-navigation. Next reports pending state per
 * link, but the progress bar is global, so the counts are collected here.
 */
let pending = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToNavigation(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isNavigating() {
  return pending > 0
}

/** Always false on the server: a request that is still rendering is not a navigation. */
export function isNavigatingOnServer() {
  return false
}

export function startNavigation() {
  pending += 1
  emit()
}

export function endNavigation() {
  pending = Math.max(0, pending - 1)
  emit()
}

/** Test seam. Nothing in the app resets the counter. */
export function resetNavigation() {
  pending = 0
  listeners.clear()
}
