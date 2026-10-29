'use client'

import { useState, useEffect, useCallback } from 'react'

import { useSession } from 'next-auth/react'

import { useApi } from './useApi'
import type { Order } from '@/types/order'

/**
 * Fetches all orders for the current company, with optional filters.
 */
export function useOrders(filters?: { clientId?: number; stageId?: number; assignedUserId?: number }) {
  const { data: session } = useSession()
  const { fetchApi } = useApi()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters?.clientId) params.set('client_id', String(filters.clientId))
      if (filters?.stageId) params.set('stage_id', String(filters.stageId))
      if (filters?.assignedUserId) params.set('assigned_user_id', String(filters.assignedUserId))

      const qs = params.toString()
      const url = `orders${qs ? `?${qs}` : ''}`
      const raw = await fetchApi<any>(url)

      // API may return { orders: [...] } or { data: [...] } or just [...]
      const list: Order[] = Array.isArray(raw) ? raw : (raw?.orders ?? raw?.data ?? [])

      setOrders(list)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar pedidos')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [session, fetchApi, filters?.clientId, filters?.stageId, filters?.assignedUserId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}
