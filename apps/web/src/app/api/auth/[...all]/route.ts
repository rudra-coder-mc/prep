import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

const handler = toNextJsHandler(auth.handler)

/**
 * The browser's endpoints. Its session lives in an httpOnly cookie so that no
 * script on the page can read the token, and the bearer plugin's habit of
 * copying that token into a header any script can read would give it back. A
 * device gets its token from `/api/device/session` instead.
 */
function browserOnly(route: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const response = await route(request)
    response.headers.delete('set-auth-token')
    return response
  }
}

export const GET = browserOnly(handler.GET)
export const POST = browserOnly(handler.POST)
