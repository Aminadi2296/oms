'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { useSession } from 'next-auth/react'

import { useApi } from './useApi'
import type { Order } from '@/types/order'

const PER_PAGE = 100 // API maximum
const MAX_PAGES = 20 // safety net (2.000 orders)

/**
 * Fetches ALL orders of the current company (the API is paginated, max 100 per page).
 * The API has no server-side filters yet, so `clientId` is applied here.
 *
 * `loading` is only true on the first load: later refetches are silent so the board does not flash.
 * `setOrders` allows optimistic updates (drag & drop).
 */
export function useOrders(filters?: { clientId?: number }) {
  const { data: session } = useSession()
  const { fetchApi } = useApi()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadedOnce = useRef(false)

  const clientId = filters?.clientId

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) return
    if (!loadedOnce.current) setLoading(true)
    setError(null)
    try {
      const all: Order[] = []
      let page = 1
      let pages = 1

      do {
        const raw = await fetchApi<any>(`orders?page=${page}&per_page=${PER_PAGE}`)
        const list: Order[] = Array.isArray(raw) ? raw : (raw?.orders ?? raw?.data ?? [])

        all.push(...list)
        pages = Array.isArray(raw) ? 1 : (raw?.pages ?? raw?.meta?.last_page ?? 1)
        page++
      } while (page <= pages && page <= MAX_PAGES)

      setOrders(clientId ? all.filter(o => o.customerId === clientId) : all)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar pedidos')
      setOrders([])
    } finally {
      loadedOnce.current = true
      setLoading(false)
    }
  }, [session, fetchApi, clientId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, setOrders, loading, error, refetch: fetchOrders }
}
