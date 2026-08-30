import { beforeEach, describe, expect, it, vi } from 'vitest'
import { narrate } from './narrate'
import { warmRecording } from './warming'

vi.mock('./narrate', () => ({ narrate: vi.fn() }))

const synthesise = vi.mocked(narrate)

/** A recording that finishes only when the test says so. */
function held() {
  let finish!: () => void
  let fail!: (error: unknown) => void
  const work = new Promise<never>((resolve, reject) => {
    finish = () => resolve(undefined as never)
    fail = reject
  })

  synthesise.mockReturnValueOnce(work)
  return { finish, fail }
}

beforeEach(() => {
  vi.clearAllMocks()
  synthesise.mockResolvedValue({ audio: new Uint8Array(), key: 'k', source: 'engine' })
})

describe('warmRecording', () => {
  it('records the script it was given', async () => {
    await expect(warmRecording('the first section')).resolves.toBe('recorded')
    expect(synthesise).toHaveBeenCalledWith('the first section')
  })

  it('makes one recording at a time rather than starting the second alongside', async () => {
    const first = held()
    const running = warmRecording('one')
    const waiting = warmRecording('two')

    expect(synthesise).toHaveBeenCalledTimes(1)

    first.finish()
    await expect(running).resolves.toBe('recorded')
    await expect(waiting).resolves.toBe('recorded')
    expect(synthesise).toHaveBeenNthCalledWith(2, 'two')
  })

  it('keeps only the newest waiting script, since the reader has left the rest behind', async () => {
    const first = held()
    const running = warmRecording('one')
    const dropped = warmRecording('two')
    const newest = warmRecording('three')

    await expect(dropped).resolves.toBe('superseded')

    first.finish()
    await expect(running).resolves.toBe('recorded')
    await expect(newest).resolves.toBe('recorded')

    // Never made: by the time there was a turn free, nobody was near it.
    expect(synthesise).not.toHaveBeenCalledWith('two')
  })

  it('reports a failure to the request that asked, and takes the next one anyway', async () => {
    const first = held()
    const failing = warmRecording('one')
    const following = warmRecording('two')

    first.fail(new Error('the engine is down'))

    await expect(failing).rejects.toThrow('the engine is down')
    await expect(following).resolves.toBe('recorded')
  })

  it('takes a new script after the queue has emptied', async () => {
    await warmRecording('one')

    await expect(warmRecording('two')).resolves.toBe('recorded')
    expect(synthesise).toHaveBeenCalledTimes(2)
  })
})
