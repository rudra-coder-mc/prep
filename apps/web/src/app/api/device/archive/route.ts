import { openArchive } from '@/lib/archive'
import { auth } from '@/lib/auth'

/**
 * The content archive, in one download.
 *
 * A device replaces what it holds whole rather than in parts, because half a
 * refresh is questions from one version beside lesson pages from another and
 * nothing downstream could tell. One file also means an interrupted refresh is
 * an absent file rather than a directory somebody has to reason about. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  const archive = await openArchive()
  if (!archive) return problem(503, 'No content archive has been built on this server')

  return new Response(archive.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': String(archive.bytes),
      // One URL serves every version, so nothing between here and the device
      // may hold on to an answer.
      'Cache-Control': 'no-store',
      // A device asks for the version, decides, and then downloads. A rebuild
      // in between would hand it an archive it never asked for, and the URL
      // cannot tell it apart from the one it wanted.
      'X-Content-Version': archive.manifest.version,
    },
  })
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
