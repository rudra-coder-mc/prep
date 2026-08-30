import path from 'node:path'

/**
 * Absolute, because Playwright runs from the repository root while the suite
 * belongs to this app. A relative path would put the signed-in state outside
 * apps/web, where nothing ignores it.
 */
export const STORAGE_STATE = path.join(import.meta.dirname, '.auth', 'user.json')
export const SIGNED_OUT_STATE = { cookies: [], origins: [] }
