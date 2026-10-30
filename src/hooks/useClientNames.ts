'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import { getClientName } from '@/utils/orderUi'

const PER_PAGE = 100
const MAX_PAGES = 10

/**
 * id -> display name for every client of the company.
 * (The orders API returns only `customerId`, so names are resolved on the client.)
 */
export function useClientNames() {
  const { fetchApi } = useApi()
  const [names, setNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)

  const fetchNames = useCallback(async () => {
    setLoading(true)
    try {
      const map: Record<number, string> = {}
      let page = 1
      let pages = 1

      do {
        const raw = await fetchApi<any>(`clients?page=${page}&per_page=${PER_PAGE}`)
        const list: any[] = Array.isArray(raw) ? raw : (raw?.clients ?? raw?.data ?? [])

        list.forEach(c => {
          map[c.id] = getClientName(c)
        })
        pages = Array.isArray(raw) ? 1 : (raw?.pages ?? raw?.meta?.last_page ?? 1)
        page++
      } while (page <= pages && page <= MAX_PAGES)

      setNames(map)
    } catch {
      setNames({})
    } finally {
      setLoading(false)
    }
  }, [fetchApi])

  useEffect(() => {
    fetchNames()
  }, [fetchNames])

  return { names, loading, refetch: fetchNames }
}
