import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrate'
import { readSetting, writeSetting } from './settings'
import { createTestDatabase } from '../../test-support/database'

let db: ReturnType<typeof createTestDatabase>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

describe('the settings a device remembers', () => {
  it('has nothing to say about a key never written', async () => {
    expect(await readSetting(db, 'server-address')).toBeNull()
  })

  it('reads back what was written', async () => {
    await writeSetting(db, 'server-address', 'https://work')

    expect(await readSetting(db, 'server-address')).toBe('https://work')
  })

  it('replaces a value rather than collecting a second one', async () => {
    await writeSetting(db, 'server-address', 'https://work')
    await writeSetting(db, 'server-address', 'http://192.168.1.5:3000')

    expect(await readSetting(db, 'server-address')).toBe('http://192.168.1.5:3000')
  })
})
