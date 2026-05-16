/**
 * Unit tests for src/lib/apiClient.ts
 *
 * Covers:
 *  1. GET requests attach Authorization header with JWT token
 *  2. POST requests attach Authorization header and serialize body
 *  3. PUT requests attach Authorization header and serialize body
 *  4. DELETE requests attach Authorization header
 *  5. Requests work without a token (unauthenticated fallback)
 *  6. Non-OK responses throw an error with method and status
 *  7. Query params are appended to the URL correctly
 *  8. Content-Type header is always set to application/json
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any imports
// ---------------------------------------------------------------------------

const mockGetAccessToken = jest.fn()

jest.mock('@/src/lib/amplify', () => ({
  getAccessToken: (...args: unknown[]) => mockGetAccessToken(...args),
}))

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { apiClient } from '../apiClient'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockJsonResponse = (data: unknown, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockGetAccessToken.mockResolvedValue('test-jwt-token')
})

describe('apiClient.get', () => {
  it('attaches Authorization header with Bearer token', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({ items: [] }))

    await apiClient.get('/gardens')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('returns typed data and status on success', async () => {
    const mockData = { id: '1', name: 'My Garden' }
    mockFetch.mockReturnValue(mockJsonResponse(mockData))

    const result = await apiClient.get<typeof mockData>('/gardens/1')

    expect(result.data).toEqual(mockData)
    expect(result.status).toBe(200)
  })

  it('appends query params to the URL', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({ temp: 72 }))

    await apiClient.get('/weather', {
      queryParams: { zip: '90210', units: 'imperial' },
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('zip=90210')
    expect(calledUrl).toContain('units=imperial')
  })

  it('throws an error when response is not ok', async () => {
    mockFetch.mockReturnValue(mockJsonResponse(null, 401))

    await expect(apiClient.get('/gardens')).rejects.toThrow(
      'GET /gardens failed with status 401'
    )
  })

  it('omits Authorization header when no token is available', async () => {
    mockGetAccessToken.mockResolvedValue(null)
    mockFetch.mockReturnValue(mockJsonResponse([]))

    await apiClient.get('/gardens')

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
    expect(headers['Content-Type']).toBe('application/json')
  })
})

describe('apiClient.post', () => {
  it('attaches Authorization header and serializes body as JSON', async () => {
    const body = { name: 'Tomato', species: 'Solanum lycopersicum' }
    mockFetch.mockReturnValue(mockJsonResponse({ id: '2', ...body }, 201))

    await apiClient.post('/plants', body)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
        body: JSON.stringify(body),
      })
    )
  })

  it('returns typed data and status on success', async () => {
    const responseData = { id: '3', name: 'Basil' }
    mockFetch.mockReturnValue(mockJsonResponse(responseData, 201))

    const result = await apiClient.post<typeof responseData>('/plants', {
      name: 'Basil',
    })

    expect(result.data).toEqual(responseData)
    expect(result.status).toBe(201)
  })

  it('throws an error when response is not ok', async () => {
    mockFetch.mockReturnValue(mockJsonResponse(null, 500))

    await expect(apiClient.post('/plants', {})).rejects.toThrow(
      'POST /plants failed with status 500'
    )
  })

  it('handles undefined body gracefully', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({ ok: true }))

    await apiClient.post('/photos/presign')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.body).toBeUndefined()
  })
})

describe('apiClient.put', () => {
  it('attaches Authorization header and serializes body as JSON', async () => {
    const body = { name: 'Updated Garden' }
    mockFetch.mockReturnValue(mockJsonResponse({ id: '1', ...body }))

    await apiClient.put('/gardens/1', body)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
        body: JSON.stringify(body),
      })
    )
  })

  it('throws an error when response is not ok', async () => {
    mockFetch.mockReturnValue(mockJsonResponse(null, 403))

    await expect(apiClient.put('/gardens/1', {})).rejects.toThrow(
      'PUT /gardens/1 failed with status 403'
    )
  })
})

describe('apiClient.delete', () => {
  it('attaches Authorization header without a body', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({}, 204))

    await apiClient.delete('/plants/5')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token',
        }),
      })
    )

    // DELETE should not have a body
    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.body).toBeUndefined()
  })

  it('throws an error when response is not ok', async () => {
    mockFetch.mockReturnValue(mockJsonResponse(null, 404))

    await expect(apiClient.delete('/plants/99')).rejects.toThrow(
      'DELETE /plants/99 failed with status 404'
    )
  })
})

describe('cross-cutting concerns', () => {
  it('always includes Content-Type: application/json', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({}))

    await apiClient.get('/gardens')
    await apiClient.post('/gardens', {})
    await apiClient.put('/gardens/1', {})
    await apiClient.delete('/gardens/1')

    for (const call of mockFetch.mock.calls) {
      const headers = call[1].headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    }
  })

  it('merges extra headers from options', async () => {
    mockFetch.mockReturnValue(mockJsonResponse({}))

    await apiClient.get('/gardens', {
      headers: { 'X-Custom-Header': 'custom-value' },
    })

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['X-Custom-Header']).toBe('custom-value')
    expect(headers['Authorization']).toBe('Bearer test-jwt-token')
  })
})
