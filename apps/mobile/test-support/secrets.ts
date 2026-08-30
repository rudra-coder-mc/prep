import type { SecretStore } from '../src/session/secrets'

/** A store backed by a map, for tests and for nothing else. */
export function createMemorySecretStore(initial: Record<string, string> = {}): SecretStore {
  const values = new Map(Object.entries(initial))

  return {
    async get(key) {
      return values.get(key) ?? null
    },
    async set(key, value) {
      values.set(key, value)
    },
    async remove(key) {
      values.delete(key)
    },
  }
}
