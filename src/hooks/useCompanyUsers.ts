'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import type { CompanyUser } from '@/types/order'

/**
 * Fetches the list of employees of a company (for assignment selector).
 */
export function useCompanyUsers(companyId: number | null) {
  const { fetchApi } = useApi()

  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)

    try {
      const raw = await fetchApi<any>(`companies/${companyId}/users`)
      const list: CompanyUser[] = Array.isArray(raw) ? raw : (raw?.users ?? raw?.data ?? [])

      setUsers(list)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [companyId, fetchApi])

  useEffect(() => {
    if (companyId) fetchUsers()
  }, [companyId, fetchUsers])

  return { users, loading, error, refetch: fetchUsers }
}
