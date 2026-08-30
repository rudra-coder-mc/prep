import * as SecureStore from 'expo-secure-store'
import type { SecretStore } from './secrets'

/**
 * The keystore, which is `expo-secure-store` behind ./secrets.ts. It holds one
 * value: the session token, which is a credential good for thirty days.
 */
export function createSecretStore(): SecretStore {
  return {
    get: (key) => SecureStore.getItemAsync(key),
    set: (key, value) => SecureStore.setItemAsync(key, value),
    remove: (key) => SecureStore.deleteItemAsync(key),
  }
}
