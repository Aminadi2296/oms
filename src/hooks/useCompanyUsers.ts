'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import type { CompanyUser } from '@/types/order'

/**
 * Members of the company that can be assigned to an order.
 *
 * TODO(equipo): the API does not expose a "list company users" endpoint yet, so for now the only
 * assignable person is the logged-in user (`auth/me`). When the backend adds something like
 * `GET /companies/{id}/users`, replace the body of `fetchUsers` — nothing else needs to change.
 */
export function useCompanyUsers(companyId: number | null) {
  const { fetchApi } = useApi()

  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await fetchApi<any>('auth/me')

      setUsers(
        me?.id ? [{ id: me.id, full_name: me.full_name, email: me.email, role: me.role, is_active: me.is_active }] : []
      )
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [fetchApi])

  useEffect(() => {
    if (companyId) fetchUsers()
  }, [companyId, fetchUsers])

  return { users, loading, error, refetch: fetchUsers }
}
