/**
 * Unit tests for src/lib/mutationQueue.ts
 *
 * Covers:
 *  1. enqueue adds a mutation to the queue
 *  2. dequeue returns and removes the oldest mutation
 *  3. dequeue returns null when the queue is empty
 *  4. flushQueue calls apiClient for each mutation and removes on success
 *  5. flushQueue re-enqueues with incremented retryCount on failure
 */

// ---------------------------------------------------------------------------
// expo-sqlite mock
// ---------------------------------------------------------------------------
// We mock expo-sqlite with a simple in-memory implementation so tests run in
// the Node.js environment without native binaries.

type Row = Record<string, unknown>

class InMemoryDb {
  private tables: Record<string, Row[]> = {}

  execSync(sql: string): void {
    // Handle CREATE TABLE IF NOT EXISTS
    const createMatch = sql.match(
      /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([^)]+)\)/is
    )
    if (createMatch) {
      const tableName = createMatch[1]
      if (!this.tables[tableName]) {
        this.tables[tableName] = []
      }
    }
  }

  runSync(sql: string, params: unknown[] = []): void {
    const trimmed = sql.trim().toUpperCase()

    if (trimmed.startsWith('INSERT INTO')) {
      const tableMatch = sql.match(/INSERT INTO (\w+)/i)
      if (!tableMatch) return
      const tableName = tableMatch[1]
      const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i)
      if (!colMatch) return
      const cols = colMatch[1].split(',').map((c) => c.trim())
      const row: Row = {}
      cols.forEach((col, i) => {
        row[col] = params[i]
      })
      if (!this.tables[tableName]) this.tables[tableName] = []
      this.tables[tableName].push(row)
      return
    }

    if (trimmed.startsWith('DELETE FROM')) {
      const tableMatch = sql.match(/DELETE FROM (\w+)/i)
      if (!tableMatch) return
      const tableName = tableMatch[1]
      const whereMatch = sql.match(/WHERE (\w+)\s*=\s*\?/i)
      if (!whereMatch) return
      const col = whereMatch[1]
      this.tables[tableName] = (this.tables[tableName] ?? []).filter(
        (row) => row[col] !== params[0]
      )
    }
  }

  getFirstSync<T = Row>(sql: string): T | null {
    const rows = this._query(sql)
    return rows.length > 0 ? (rows[0] as T) : null
  }

  getAllSync<T = Row>(sql: string): T[] {
    return this._query(sql) as T[]
  }

  private _query(sql: string): Row[] {
    const tableMatch = sql.match(/FROM (\w+)/i)
    if (!tableMatch) return []
    const tableName = tableMatch[1]
    const rows = [...(this.tables[tableName] ?? [])]

    // ORDER BY createdAt ASC
    if (/ORDER BY createdAt ASC/i.test(sql)) {
      rows.sort((a, b) =>
        String(a['createdAt']).localeCompare(String(b['createdAt']))
      )
    }

    // LIMIT
    const limitMatch = sql.match(/LIMIT (\d+)/i)
    if (limitMatch) {
      return rows.slice(0, parseInt(limitMatch[1], 10))
    }

    return rows
  }

  /** Test helper: return all rows in a table */
  _getAll(tableName: string): Row[] {
    return [...(this.tables[tableName] ?? [])]
  }
}

let mockDbInstance: InMemoryDb

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    mockDbInstance = new InMemoryDb()
    return mockDbInstance
  }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the module singleton so each test gets a fresh DB */
const resetModule = (): void => {
  jest.resetModules()
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  // Re-require the mock so openDatabaseSync is called fresh each test
  const sqlite = jest.requireMock<{ openDatabaseSync: jest.Mock }>(
    'expo-sqlite'
  )
  sqlite.openDatabaseSync.mockImplementation(() => {
    mockDbInstance = new InMemoryDb()
    return mockDbInstance
  })
  // Reset the module-level singleton inside mutationQueue.ts
  resetModule()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mutationQueue', () => {
  // -------------------------------------------------------------------------
  // 1. enqueue adds a mutation to the queue
  // -------------------------------------------------------------------------
  it('enqueue adds a mutation to the SQLite queue', async () => {
    // Re-import after module reset so the singleton is fresh
    const { enqueue: enq, dequeue: deq } = await import('../mutationQueue')

    await enq({
      type: 'create',
      resource: '/plants',
      payload: { name: 'Basil' },
    })

    const mutation = await deq()
    expect(mutation).not.toBeNull()
    expect(mutation?.type).toBe('create')
    expect(mutation?.resource).toBe('/plants')
    expect(mutation?.payload).toEqual({ name: 'Basil' })
    expect(mutation?.retryCount).toBe(0)
    expect(mutation?.id).toBeDefined()
    expect(mutation?.createdAt).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // 2. dequeue returns and removes the oldest mutation
  // -------------------------------------------------------------------------
  it('dequeue returns the oldest mutation and removes it from the queue', async () => {
    const { enqueue: enq, dequeue: deq } = await import('../mutationQueue')

    // Enqueue two mutations with a small delay to ensure ordering
    await enq({
      type: 'create',
      resource: '/gardens',
      payload: { name: 'Bed A' },
    })
    // Ensure createdAt differs by bumping the clock slightly
    await new Promise((r) => setTimeout(r, 5))
    await enq({
      type: 'update',
      resource: '/gardens/1',
      payload: { name: 'Bed B' },
    })

    const first = await deq()
    expect(first?.type).toBe('create')
    expect(first?.resource).toBe('/gardens')

    const second = await deq()
    expect(second?.type).toBe('update')
    expect(second?.resource).toBe('/gardens/1')
  })

  // -------------------------------------------------------------------------
  // 3. dequeue returns null when the queue is empty
  // -------------------------------------------------------------------------
  it('dequeue returns null when the queue is empty', async () => {
    const { dequeue: deq } = await import('../mutationQueue')

    const result = await deq()
    expect(result).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 4. flushQueue calls apiClient for each mutation and removes on success
  // -------------------------------------------------------------------------
  it('flushQueue calls apiClient.request for each mutation and removes them on success', async () => {
    const { enqueue: enq, flushQueue: flush } = await import('../mutationQueue')

    await enq({
      type: 'create',
      resource: '/plants',
      payload: { name: 'Mint' },
    })
    await enq({ type: 'delete', resource: '/plants/42', payload: null })

    const mockRequest = jest.fn().mockResolvedValue({})
    await flush({ request: mockRequest })

    expect(mockRequest).toHaveBeenCalledTimes(2)
    expect(mockRequest).toHaveBeenCalledWith('POST', '/plants', {
      name: 'Mint',
    })
    expect(mockRequest).toHaveBeenCalledWith('DELETE', '/plants/42', null)

    // Queue should be empty after successful flush
    const { dequeue: deq } = await import('../mutationQueue')
    const remaining = await deq()
    expect(remaining).toBeNull()
  })

  // -------------------------------------------------------------------------
  // 5. flushQueue re-enqueues with incremented retryCount on failure
  // -------------------------------------------------------------------------
  it('flushQueue re-enqueues the mutation with incremented retryCount when apiClient throws', async () => {
    // Override sleep to avoid real delays in tests
    jest.useFakeTimers()

    const {
      enqueue: enq,
      flushQueue: flush,
      dequeue: deq,
    } = await import('../mutationQueue')

    await enq({
      type: 'update',
      resource: '/gardens/99',
      payload: { name: 'Patch' },
    })

    const mockRequest = jest.fn().mockRejectedValue(new Error('Network error'))

    // Run flush — the sleep inside will be controlled by fake timers
    const flushPromise = flush({ request: mockRequest })
    // Advance timers past the backoff delay (base 1 s for retryCount=0)
    jest.advanceTimersByTime(2_000)
    await flushPromise

    jest.useRealTimers()

    // The mutation should be back in the queue with retryCount = 1
    const requeued = await deq()
    expect(requeued).not.toBeNull()
    expect(requeued?.retryCount).toBe(1)
    expect(requeued?.resource).toBe('/gardens/99')
    expect(requeued?.payload).toEqual({ name: 'Patch' })
  })
})
