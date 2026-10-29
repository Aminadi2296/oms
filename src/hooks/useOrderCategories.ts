'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import type { OrderCategory } from '@/types/order'

/**
 * Fetches the order categories already created for a company
 * (used by the "Nuevo Pedido" category selector).
 */
export function useOrderCategories(companyId: number | null) {
  const { fetchApi } = useApi()

  const [categories, setCategories] = useState<OrderCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async (): Promise<OrderCategory[]> => {
    if (!companyId) return []
    setLoading(true)
    setError(null)
    try {
      const raw = await fetchApi<any>(`companies/${companyId}/categories`)
      const list: OrderCategory[] = Array.isArray(raw) ? raw : (raw?.categories ?? raw?.data ?? [])

      setCategories(list)

      return list
    } catch (err: any) {
      setError(err?.message || 'Error al cargar categorías')
      setCategories([])

      return []
    } finally {
      setLoading(false)
    }
  }, [companyId, fetchApi])

  useEffect(() => {
    if (companyId) fetchCategories()
  }, [companyId, fetchCategories])

  /**
   * Creates a category and returns it (so the caller can select it right away).
   * Throws on API errors so the caller can show the message.
   */
  const createCategory = useCallback(
    async (name: string): Promise<OrderCategory | null> => {
      if (!companyId) return null

      const created = await fetchApi<any>(`companies/${companyId}/categories`, {
        method: 'POST',
        body: { name: name.trim() }
      })

      const list = await fetchCategories()
      const createdId = created?.id ?? created?.category?.id ?? created?.data?.id

      return (
        list.find(c => c.id === createdId) ??
        list.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase()) ??
        null
      )
    },
    [companyId, fetchApi, fetchCategories]
  )

  return { categories, loading, error, refetch: fetchCategories, createCategory }
}
