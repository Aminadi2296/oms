'use client'

import { useEffect, useState } from 'react'

import { useApi } from './useApi'
import type { Client } from '@/types/client'

/**
 * Client options for async selectors (Autocomplete).
 * - Empty query  -> first page of `clients` (so the list is useful as soon as it opens)
 * - With a query -> `clients/search`
 */
export function useClientOptions(query: string, enabled: boolean, perPage = 10) {
  const { fetchApi } = useApi()

  const [options, setOptions] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    const run = async () => {
      setLoading(true)
      try {
        const q = query.trim()

        const url = q
          ? `clients/search?${new URLSearchParams({ query: q, page: '1', per_page: String(perPage) }).toString()}`
          : `clients?page=1&per_page=${perPage}`

        const raw = await fetchApi<any>(url, { signal: controller.signal })

        setOptions(Array.isArray(raw) ? raw : (raw?.clients ?? raw?.data ?? []))
      } catch (err: any) {
        if (err?.name !== 'AbortError') setOptions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    run()

    return () => controller.abort()
  }, [query, enabled, perPage, fetchApi])

  return { options, loading }
}
