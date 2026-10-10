import { useEffect, useState } from 'react'

import type { Client } from '@/types/client'
import { useApi } from './useApi'

interface SearchResponse {
  clients: Client[]
  total: number
  page: number
  per_page: number
  pages: number
}

export function useClientSearch(query: string, page: number = 1, perPage: number = 10, enabled: boolean) {
  const { fetchApi } = useApi()
  const [results, setResults] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const main = async () => {
      if (!enabled || !query.trim()) {
        setResults([])
        setTotal(0)
        setTotalPages(1)

        return
      }

      const searchParams = new URLSearchParams({
        query: query,
        page: page.toString(),
        per_page: perPage.toString()
      })

      try {
        setLoading(true)
        setError(null)

        const signal = controller.signal
        const data = await fetchApi<SearchResponse>(`clients/search?${searchParams.toString()}`, { signal })

        setResults(data.clients || [])
        setTotal(data.total || 0)
        setTotalPages(data.pages || 1)
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'name' in err && (err as any).name !== 'AbortError') {
          setError((err as any).message || 'Error al buscar clientes')
        }
      } finally {
        setLoading(false)
      }
    }

    main()

    return () => controller.abort()
  }, [query, page, perPage, enabled, fetchApi])

  return { results, total, totalPages, loading, error }
}
