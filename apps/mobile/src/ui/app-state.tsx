import type { ArchiveContent } from '@prep/content/archive/types'
import type { Tier } from '@prep/core'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AppState as NativeAppState } from 'react-native'
import { readArchiveContent } from '../archive/content'
import { createFileStore } from '../archive/expo'
import type { FileStore } from '../archive/files'
import { installedVersion } from '../archive/install'
import { refreshArchive, type RefreshResult } from '../archive/refresh'
import { openDatabase } from '../db/expo'
import { migrate } from '../db/migrate'
import { readTrackTiers } from '../db/progress'
import type { Database } from '../db/sqlite'
import { readDeviceIdentity } from '../device/expo'
import type { DeviceIdentity } from '../device/identity'
import { pickTrackTier } from '../library/learn'
import { createServerClient, type ServerClient } from '../server/client'
import { createSecretStore } from '../session/expo'
import { restoreSession, signIn, signOut, type StoredSession } from '../session/session'
import { syncProgress, type SyncOutcome } from '../sync/sync'

/**
 * Everything the app holds, opened once and kept for as long as it runs.
 *
 * Starting up touches the network for nothing. The database, the archive and the
 * session are all local, so a phone opened with the server switched off reaches
 * a working screen exactly as fast as one opened beside it. That is the whole
 * point of the design. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */

type Stores = { db: Database; files: FileStore }

export type AppState = {
  /** `starting` until the local stores are open, and never longer than that. */
  status: 'starting' | 'signed-out' | 'ready'
  session: StoredSession | null
  device: DeviceIdentity | null
  /** The curriculum this device holds, or null until a refresh has brought one. */
  content: ArchiveContent | null
  tiers: Map<string, Tier>
  db: Database | null
  /** The device's storage, which holds the archive and the audio library. */
  files: FileStore | null
  /** The client for this session, or null while signed out. */
  client: ServerClient | null
  refreshing: boolean
  syncing: boolean
  /**
   * Bumped whenever an exchange brought something in. A screen reading the
   * progress tables watches it, or the answers given on the laptop sit in
   * SQLite until something else happens to make it read them again.
   */
  progressRevision: number
  /** The last thing that went wrong, shown once and cleared by the next action. */
  problem: string | null
  signIn(address: string, email: string, password: string): Promise<void>
  signOut(): Promise<void>
  refresh(): Promise<RefreshResult | null>
  /** Null when it could not be done, which is not a failure worth reporting. */
  sync(): Promise<SyncOutcome | null>
  /**
   * Picks the tier for a track, which changes what is on the path and enrols
   * what is already learned up to it. It lives here rather than in the screen
   * that offers it because every screen reads the pick out of `tiers`.
   */
  pickTier(technology: string, tier: Tier): Promise<void>
}

const AppStateContext = createContext<AppState | null>(null)

/** Closures over the keystore, made once. Nothing native happens until one is called. */
const secrets = createSecretStore()

export function useApp(): AppState {
  const state = useContext(AppStateContext)
  if (!state) throw new Error('useApp was called outside the provider')
  return state
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppState['status']>('starting')
  const [session, setSession] = useState<StoredSession | null>(null)
  const [device, setDevice] = useState<DeviceIdentity | null>(null)
  const [content, setContent] = useState<ArchiveContent | null>(null)
  const [tiers, setTiers] = useState<Map<string, Tier>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [progressRevision, setProgressRevision] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)

  // State rather than a ref, because every screen reads the database out of
  // here and a ref filled during start-up would not re-render one.
  const [stores, setStores] = useState<Stores | null>(null)

  /**
   * Reads the archive back into memory, which is where every screen reads it
   * from. A device that has not refreshed yet holds nothing, and that is a
   * state rather than a failure: it is what the first run looks like.
   */
  const loadLocal = useCallback(async ({ db, files }: Stores) => {
    setTiers(await readTrackTiers(db))

    if (!(await installedVersion(db))) {
      setContent(null)
      return
    }

    try {
      setContent(await readArchiveContent(db, files))
    } catch (error) {
      // The version says an archive is installed and it cannot be read, which
      // is a device that needs a refresh rather than one that should not start.
      setContent(null)
      setProblem(describe(error))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const db = await openDatabase()
        await migrate(db)
        const opened: Stores = { db, files: createFileStore() }
        if (cancelled) return
        setStores(opened)

        setDevice(await readDeviceIdentity(db))
        const restored = await restoreSession({ db, secrets })
        if (cancelled) return

        setSession(restored)
        await loadLocal(opened)
        if (cancelled) return
        setStatus(restored ? 'ready' : 'signed-out')
      } catch (error) {
        if (cancelled) return
        setProblem(describe(error))
        setStatus('signed-out')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadLocal])

  // One client per session rather than one per action, so a screen that
  // downloads a track for a minute is not rebuilding it between recordings.
  const client = useMemo(
    () =>
      session
        ? createServerClient({ baseUrl: session.address, token: session.token, fetch })
        : null,
    [session],
  )

  /**
   * The exchange of progress, which the app starts and never requires. It fails
   * silently: there is nothing for somebody to do about a server that is
   * switched off, and everything the app does works without one. A device that
   * has gone quiet shows up on the web dashboard instead. See
   * docs/decisions/0047-the-phone-syncs-when-it-can.md.
   */
  const running = useRef<Promise<SyncOutcome | null> | null>(null)

  const sync = useCallback(async (): Promise<SyncOutcome | null> => {
    if (!stores || !client || !device || !content) return null
    // Launch, foreground and the end of a session can all land at once, and one
    // exchange answers all three.
    if (running.current) return running.current

    const exchange = (async () => {
      setSyncing(true)
      try {
        const outcome = await syncProgress({ db: stores.db, content, client, device })

        const { attempts, learned, tiers: picks, exercises } = outcome.received
        if (attempts + learned + picks + exercises > 0) {
          setTiers(await readTrackTiers(stores.db))
          setProgressRevision((revision) => revision + 1)
        }
        return outcome
      } catch {
        return null
      } finally {
        setSyncing(false)
        running.current = null
      }
    })()

    running.current = exchange
    return exchange
  }, [stores, client, device, content])

  // On launch, as soon as there is something to exchange and something to
  // exchange it against. A device that signs in before it downloads the
  // curriculum syncs when the download lands rather than not at all.
  const syncedOnLaunch = useRef(false)
  const ready = status === 'ready' && Boolean(stores && client && device && content)

  useEffect(() => {
    if (!ready || syncedOnLaunch.current) return
    syncedOnLaunch.current = true
    void sync()
  }, [ready, sync])

  // And on coming back to it, which is the moment a phone carried around all day
  // is most likely to be on the tailnet again.
  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', (next) => {
      if (next === 'active') void sync()
    })

    return () => subscription.remove()
  }, [sync])

  const value = useMemo<AppState>(
    () => ({
      status,
      session,
      device,
      content,
      tiers,
      db: stores?.db ?? null,
      files: stores?.files ?? null,
      client,
      refreshing,
      syncing,
      progressRevision,
      problem,
      sync,

      async signIn(address, email, password) {
        if (!stores) throw new Error('The app has not finished starting')

        setProblem(null)
        const client = createServerClient({ baseUrl: address, token: null, fetch })
        const signedIn = await client.signIn(email, password)

        await signIn({ db: stores.db, secrets }, { address, session: signedIn })
        // Read back rather than assembled here, so what the app runs on is what
        // the next launch will restore.
        setSession(await restoreSession({ db: stores.db, secrets }))
        await loadLocal(stores)
        setStatus('ready')
      },

      async signOut() {
        if (!stores) return

        await signOut({ db: stores.db, secrets })
        setSession(null)
        setProblem(null)
        setStatus('signed-out')
      },

      async pickTier(technology, tier) {
        if (!stores || !content) return

        setProblem(null)
        await pickTrackTier(stores.db, content, technology, tier, new Date())
        setTiers(await readTrackTiers(stores.db))
        // The pick enrolled questions, so the day's queue has moved under any
        // screen already showing a count from before it.
        setProgressRevision((revision) => revision + 1)
      },

      async refresh() {
        if (!stores || !client) return null

        setRefreshing(true)
        setProblem(null)
        try {
          const result = await refreshArchive({ ...stores, client })
          await loadLocal(stores)
          return result
        } catch (error) {
          setProblem(describe(error))
          return null
        } finally {
          setRefreshing(false)
        }
      },
    }),
    [
      status,
      session,
      device,
      content,
      tiers,
      refreshing,
      syncing,
      progressRevision,
      problem,
      stores,
      client,
      loadLocal,
      sync,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

/** A ServerError is an Error, and its message is already the useful sentence. */
function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
