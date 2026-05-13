interface IMutation {
  /** UUID generated at enqueue time */
  id: string
  /** Operation type */
  type: 'create' | 'update' | 'delete'
  /** API resource path, e.g. "/gardens" or "/plants/abc-123" */
  resource: string
  /** Request payload (serialised to JSON in SQLite) */
  payload: unknown
  /** Number of failed flush attempts so far */
  retryCount: number
  /** ISO 8601 timestamp when the mutation was enqueued */
  createdAt: string
}

/** Minimal API client interface required by `flushQueue` */
interface IMutationApiClient {
  request: (
    method: string,
    resource: string,
    payload: unknown
  ) => Promise<unknown>
}

export type { IMutation, IMutationApiClient }
