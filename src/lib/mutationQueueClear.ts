/**
 * Helper to clear the SQLite mutation queue.
 *
 * Separated from mutationQueue.ts to avoid circular dependencies and
 * to provide a focused interface for the sign-out flow.
 *
 * Requirements: 7.5
 */

import * as SQLite from 'expo-sqlite'

/**
 * Clears all pending mutations from the SQLite queue.
 * Used during sign-out to ensure no user-specific mutations remain.
 */
const clearMutationQueue = async (): Promise<void> => {
  try {
    const db = SQLite.openDatabaseSync('mutation_queue.db')
    db.execSync(`DELETE FROM mutations;`)
  } catch {
    // Table may not exist yet if no mutations were ever enqueued.
    // This is safe to ignore during sign-out.
  }
}

export { clearMutationQueue }
