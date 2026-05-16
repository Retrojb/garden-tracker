/**
 * Typed API client wrapper.
 *
 * Provides GET, POST, PUT, DELETE methods that automatically attach the
 * Cognito JWT access token to every request via the Authorization header.
 *
 * All methods return a typed `IApiResponse<T>` containing `data` and `status`.
 */

import { API_BASE_URL } from '@/src/constants/api'
import { getAccessToken } from '@/src/lib/amplify'
import type { IApiRequestOptions } from '@/src/types/TAmplify'
import type { IApiResponse } from '@/src/types/TResponse'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds the request headers including the Cognito JWT when available.
 */
const getAuthHeaders = async (
  extra?: Record<string, string>
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }

  const token = await getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Builds a full URL from a path and optional query params.
 */
const buildRequestUrl = (
  path: string,
  queryParams?: Record<string, string>
): string => {
  const base = `${API_BASE_URL}${path}`
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return base
  }
  const qs = new URLSearchParams(queryParams).toString()
  return `${base}?${qs}`
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

const get = async <T = unknown>(
  path: string,
  options?: IApiRequestOptions
): Promise<IApiResponse<T>> => {
  const url = buildRequestUrl(path, options?.queryParams)
  const headers = await getAuthHeaders(options?.headers)

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const post = async <T = unknown>(
  path: string,
  body?: unknown,
  options?: IApiRequestOptions
): Promise<IApiResponse<T>> => {
  const url = buildRequestUrl(path, options?.queryParams)
  const headers = await getAuthHeaders(options?.headers)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const put = async <T = unknown>(
  path: string,
  body?: unknown,
  options?: IApiRequestOptions
): Promise<IApiResponse<T>> => {
  const url = buildRequestUrl(path, options?.queryParams)
  const headers = await getAuthHeaders(options?.headers)

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const del = async <T = unknown>(
  path: string,
  options?: IApiRequestOptions
): Promise<IApiResponse<T>> => {
  const url = buildRequestUrl(path, options?.queryParams)
  const headers = await getAuthHeaders(options?.headers)

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

export const apiClient = { get, post, put, delete: del }
