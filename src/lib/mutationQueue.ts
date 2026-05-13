import * as SQLite from 'expo-sqlite'
import { IMutation, IMutationApiClient } from '../types/TMutation'

/**
 * Offline mutation queue backed by SQLite.
 *
 * Stores pending create/update/delete mutations when the device is offline.
 * On reconnect, `flushQueue` processes all queued mutations with exponential
 * backoff retry (base 1 s, 2× multiplier, max 5 retries).
 */

/** Lazily-opened database handle (singleton per process) */
let _db: SQLite.SQLiteDatabase | null = null

const getDb = (): SQLite.SQLiteDatabase => {
  if (!_db) {
    _db = SQLite.openDatabaseSync('mutation_queue.db')
  }
  return _db
}

/** Ensure the mutations table exists */
const initTable = (): void => {
  const db = getDb()
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mutations (
      id         TEXT PRIMARY KEY,
      type       TEXT NOT NULL,
      resource   TEXT NOT NULL,
      payload    TEXT NOT NULL,
      retryCount INTEGER NOT NULL DEFAULT 0,
      createdAt  TEXT NOT NULL
    );
  `)
}

/** Generate a simple UUID v4 */
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Sleep for `ms` milliseconds.
 * Extracted so tests can override it without touching the module internals.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// ---------------------------------------------------------------------------
// Exponential backoff constants
// ---------------------------------------------------------------------------

const BACKOFF_BASE_MS = 1_000 // 1 second
const BACKOFF_MULTIPLIER = 2
const MAX_RETRIES = 5

const backoffDelay = (retryCount: number): number =>
  BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount)

/**
 * Add a mutation to the SQLite queue.
 *
 * Automatically assigns a UUID, sets `retryCount` to 0, and records
 * `createdAt` as the current ISO 8601 timestamp.
 */
const enqueue = (
  mutation: Omit<IMutation, 'id' | 'retryCount' | 'createdAt'>
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      initTable()
      const db = getDb()
      const id = generateId()
      const createdAt = new Date().toISOString()
      const payloadJson = JSON.stringify(mutation.payload)

      db.runSync(
        `INSERT INTO mutations (id, type, resource, payload, retryCount, createdAt)
         VALUES (?, ?, ?, ?, 0, ?);`,
        [id, mutation.type, mutation.resource, payloadJson, createdAt]
      )

      resolve()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Retrieve and remove the oldest mutation from the queue (FIFO).
 *
 * Returns `null` when the queue is empty.
 */
const dequeue = (): Promise<IMutation | null> => {
  return new Promise<IMutation | null>((resolve, reject) => {
    try {
      initTable()
      const db = getDb()

      const row = db.getFirstSync<{
        id: string
        type: string
        resource: string
        payload: string
        retryCount: number
        createdAt: string
      }>(
        `SELECT id, type, resource, payload, retryCount, createdAt
         FROM mutations
         ORDER BY createdAt ASC
         LIMIT 1;`
      )

      if (!row) {
        resolve(null)
        return
      }

      db.runSync(`DELETE FROM mutations WHERE id = ?;`, [row.id])

      const mutation: IMutation = {
        id: row.id,
        type: row.type as IMutation['type'],
        resource: row.resource,
        payload: JSON.parse(row.payload),
        retryCount: row.retryCount,
        createdAt: row.createdAt,
      }

      resolve(mutation)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Process all queued mutations in FIFO order.
 *
 * For each mutation:
 * - Calls `apiClient.request(method, resource, payload)` where `method` maps
 *   from the mutation type (`create` → `POST`, `update` → `PUT`,
 *   `delete` → `DELETE`).
 * - On success: the mutation is already removed by `dequeue` and is not
 *   re-enqueued.
 * - On failure: waits for an exponential backoff delay, increments
 *   `retryCount`, and re-enqueues the mutation if `retryCount < MAX_RETRIES`.
 *   Mutations that have exhausted all retries are dropped.
 */
const flushQueue = async (apiClient: IMutationApiClient): Promise<void> => {
  initTable()

  const methodMap: Record<IMutation['type'], string> = {
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  }

  // Drain the queue snapshot-by-snapshot so newly re-enqueued items (after
  // failure) are not processed in the same flush pass.
  const db = getDb()
  const rows = db.getAllSync<{
    id: string
    type: string
    resource: string
    payload: string
    retryCount: number
    createdAt: string
  }>(
    `SELECT id, type, resource, payload, retryCount, createdAt
     FROM mutations
     ORDER BY createdAt ASC;`
  )

  // Remove all fetched rows upfront; failures will be re-enqueued below.
  for (const row of rows) {
    db.runSync(`DELETE FROM mutations WHERE id = ?;`, [row.id])
  }

  for (const row of rows) {
    const mutation: IMutation = {
      id: row.id,
      type: row.type as IMutation['type'],
      resource: row.resource,
      payload: JSON.parse(row.payload),
      retryCount: row.retryCount,
      createdAt: row.createdAt,
    }

    const method = methodMap[mutation.type]

    try {
      await apiClient.request(method, mutation.resource, mutation.payload)
      // Success — mutation already removed, nothing more to do.
    } catch {
      const nextRetryCount = mutation.retryCount + 1

      if (nextRetryCount <= MAX_RETRIES) {
        // Apply exponential backoff before re-enqueuing.
        await sleep(backoffDelay(mutation.retryCount))

        // Re-enqueue with incremented retryCount, preserving original id and
        // createdAt so ordering is maintained.
        db.runSync(
          `INSERT INTO mutations (id, type, resource, payload, retryCount, createdAt)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            mutation.id,
            mutation.type,
            mutation.resource,
            JSON.stringify(mutation.payload),
            nextRetryCount,
            mutation.createdAt,
          ]
        )
      }
      // If retries exhausted, the mutation is silently dropped.
    }
  }
}

export { dequeue, enqueue, flushQueue }
