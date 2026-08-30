import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { archiveDirectory, workspaceRoot } from './location'

describe('archiveDirectory', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('follows CONTENT_ARCHIVE_DIR when the stack sets it', () => {
    vi.stubEnv('CONTENT_ARCHIVE_DIR', '/archive')
    expect(archiveDirectory()).toBe('/archive')
  })

  it('falls back to a directory git ignores, for a run outside the stack', () => {
    vi.stubEnv('CONTENT_ARCHIVE_DIR', undefined)
    expect(archiveDirectory()).toBe(path.join(workspaceRoot(), '.content-archive'))
  })

  it('anchors a relative setting at the repository root rather than the caller', () => {
    vi.stubEnv('CONTENT_ARCHIVE_DIR', '.content-archive-e2e')
    expect(archiveDirectory()).toBe(path.join(workspaceRoot(), '.content-archive-e2e'))
  })

  /**
   * The build runs from the repository root and the app runs from apps/web.
   * Resolving the default against the caller would give them two directories,
   * and the app would serve an archive no build had written into.
   */
  it('finds the same root from a workspace member as from the repository root', () => {
    vi.stubEnv('CONTENT_ARCHIVE_DIR', undefined)
    const fromRoot = archiveDirectory()

    vi.spyOn(process, 'cwd').mockReturnValue(path.join(workspaceRoot(), 'apps', 'web'))
    expect(archiveDirectory()).toBe(fromRoot)
  })
})
