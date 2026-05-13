/**
 * Typed API client stub.
 *
 * This module provides a minimal typed wrapper around fetch that attaches the
 * Cognito JWT automatically (once auth is wired up in task 4.1). For now it
 * performs plain fetch calls against the configured API base URL.
 *
 * Replace the internals here when `src/lib/amplify.ts` is implemented in
 * task 4.1 — the exported `apiClient` interface must remain stable.
 */

import { API_BASE_URL } from '@/src/constants/api'
import { IApiResponse } from '../types/TResponse'

const getAuthHeaders = (): Record<string, string> => {
  // TODO (task 4.1): retrieve Cognito JWT from Amplify Auth and attach here
  return {
    'Content-Type': 'application/json',
  }
}

const get = async <T = unknown>(path: string): Promise<IApiResponse<T>> => {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const post = async <T = unknown>(
  path: string,
  body: unknown
): Promise<IApiResponse<T>> => {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const put = async <T = unknown>(
  path: string,
  body: unknown
): Promise<IApiResponse<T>> => {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`PUT ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

const del = async <T = unknown>(path: string): Promise<IApiResponse<T>> => {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`DELETE ${path} failed with status ${response.status}`)
  }

  const data = (await response.json()) as T
  return { data, status: response.status }
}

export const apiClient = { get, post, put, delete: del }
