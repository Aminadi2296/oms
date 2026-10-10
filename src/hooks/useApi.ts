'use client'

import { useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { useSession, signOut } from 'next-auth/react'

import { ROUTES } from '@/constants/routes'

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | unknown[] | FormData
}

export const useApi = (): {
  fetchApi: <T = unknown>(endpoint: string, options?: ApiOptions) => Promise<T>
  uploadFile: <T = unknown>(endpoint: string, file: File, params: Record<string, string>) => Promise<T>
} => {
  const { data: session } = useSession()
  const router = useRouter()

  const fetchApi = useCallback(
    async <T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
      const { body, ...restOptions } = options
      const isExternalUrl = endpoint.startsWith('http')
      const normalizedEndpoint = isExternalUrl ? endpoint : endpoint.replace(/^\/+/, '')
      const apiUrl = isExternalUrl ? endpoint : `/api/proxy/${normalizedEndpoint}`

      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(restOptions.headers as Record<string, string>)
      }

      // Solo poner Content-Type si hay body y no es FormData
      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`
      }

      const requestOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
        ...restOptions
      }

      if (body) {
        requestOptions.body = body instanceof FormData ? body : JSON.stringify(body)
      }

      try {
        const response = await fetch(apiUrl, requestOptions)

        if (!response.ok) {
          let errorData: string | Record<string, unknown> = 'An unknown error occurred.'

          try {
            const responseText = await response.text()

            try {
              errorData = JSON.parse(responseText) as Record<string, unknown>
            } catch {
              errorData = responseText
            }
          } catch (err) {
            errorData = 'Failed to read error response'
          }

          const errorMessage =
            typeof errorData === 'object' && errorData !== null
              ? (errorData.detail as string) || (errorData.message as string) || JSON.stringify(errorData)
              : String(errorData)

          if (response.status === 401) {
            await signOut({ redirect: false })
            router.push(ROUTES.LOGIN)
            throw new Error('Authentication failed. Please sign in again.')
          }

          throw new Error(`HTTP error! status: ${response.status}, error: ${errorMessage}`)
        }

        if (response.status === 204 || response.status === 205) {
          return undefined as T
        }

        const contentType = response.headers.get('content-type') || ''

        if (!contentType.toLowerCase().includes('application/json')) {
          const json = await response.json()

          if (!json) return undefined as T

          return json as unknown as T
        }

        const json = await response.json()

        if (!json) return undefined as T

        return json as T
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw error
        }

        throw new Error(`Unknown error occurred: ${String(error)}`)
      }
    },
    [session, router]
  )

  const uploadFile = useCallback(
    async <T = unknown>(endpoint: string, file: File, params: Record<string, string> = {}): Promise<T> => {
      const isExternalUrl = endpoint.startsWith('http')
      const normalizedEndpoint = isExternalUrl ? endpoint : endpoint.replace(/^\/+/, '')
      const query = new URLSearchParams(params).toString()
      const apiUrl = `${isExternalUrl ? endpoint : `/api/proxy/${normalizedEndpoint}`}?${query}`

      const formData = new FormData()

      formData.append('file', file)

      const headers: Record<string, string> = {
        Accept: 'application/json'
      }

      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers
      })

      if (!response.ok) {
        let errorData: string | Record<string, unknown> = 'An unknown error occurred.'

        try {
          const responseText = await response.text()

          try {
            errorData = JSON.parse(responseText) as Record<string, unknown>
          } catch {
            errorData = responseText
          }
        } catch (err) {
          errorData = 'Failed to read error response'
        }

        const errorMessage =
          typeof errorData === 'object' && errorData !== null
            ? (errorData as any).detail || (errorData as any).message || JSON.stringify(errorData)
            : String(errorData)

        if (response.status === 401) {
          await signOut({ redirect: false })
          router.push(ROUTES.LOGIN)
          throw new Error('Authentication failed. Please sign in again.')
        }

        throw new Error(`HTTP error! status: ${response.status}, error: ${errorMessage}`)
      }

      if (response.status === 204 || response.status === 205) {
        return undefined as T
      }

      const json = await response.json()

      if (!json) return undefined as T

      return json as T
    },
    [session, router]
  )

  return { fetchApi, uploadFile }
}
