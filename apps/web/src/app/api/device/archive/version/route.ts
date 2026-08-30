import { readArchiveManifest } from '@/lib/archive'
import { auth } from '@/lib/auth'

/**
 * What a device asks before it decides to refresh.
 *
 * The version is a hash of the files the archive was built from, so comparing it
 * to the one held is the whole of the decision. The size comes with it because a
 * refresh is a megabyte over a phone connection and the app says what it is
 * about to spend before it spends it.
 *
 * It reports the version of the archive that exists, which is not necessarily
 * the version of what is in `content/`: an edit nobody rebuilt is not something
 * a device can be handed. See
 * docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  const manifest = await readArchiveManifest()
  if (!manifest) return problem(503, 'No content archive has been built on this server')

  const { version, topics, questions, exercises, narrationSections } = manifest

  return Response.json(
    { version, bytes: manifest.archive.bytes, topics, questions, exercises, narrationSections },
    // A device asks this on every launch and the answer changes whenever the
    // archive is rebuilt, so anything cached here is a refresh that never runs.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
