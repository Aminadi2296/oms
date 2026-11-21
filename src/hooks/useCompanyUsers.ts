'use client'

import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import type { CompanyUser } from '@/types/order'

/**
 * Fetches all members of the company (`GET /companies/{companyId}/users`).
 * Falls back to `auth/me` if the company list endpoint fails.
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
      const raw = await fetchApi<CompanyUser[] | { users?: CompanyUser[]; data?: CompanyUser[] }>(
        `companies/${companyId}/users`
      )

      const list: CompanyUser[] = Array.isArray(raw) ? raw : (raw?.users ?? raw?.data ?? [])

      setUsers(list)
    } catch (err: any) {
      try {
        const me = await fetchApi<any>('auth/me')

        setUsers(
          me?.id
            ? [
                {
                  id: me.id,
                  company_id: me.company_id,
                  full_name: me.full_name,
                  email: me.email,
                  role: me.role,
                  job_title: me.job_title,
                  phone: me.phone,
                  avatar_url: me.avatar_url,
                  is_active: me.is_active
                }
              ]
            : []
        )
      } catch {
        setError(err?.message || 'Error al cargar miembros del equipo')
        setUsers([])
      }
    } finally {
      setLoading(false)
    }
  }, [companyId, fetchApi])

  useEffect(() => {
    if (companyId) fetchUsers()
  }, [companyId, fetchUsers])

  return { users, setUsers, loading, error, refetch: fetchUsers }
}
