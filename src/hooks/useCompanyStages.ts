'use client'

import { useState, useEffect, useCallback } from 'react'

import { useSession } from 'next-auth/react'

import { useApi } from './useApi'
import type { CompanyStage } from '@/types/order'

/**
 * Fetches and manages the stages for the current user's company.
 */
export function useCompanyStages() {
  const { data: session } = useSession()
  const { fetchApi } = useApi()

  const [stages, setStages] = useState<CompanyStage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)

  // Resolve companyId: first try session, then fall back to auth/me
  useEffect(() => {
    if (session?.user?.companyId) {
      setCompanyId(Number(session.user.companyId))
    } else if (session?.accessToken) {
      // Fallback: fetch company_id from /auth/me
      fetchApi<any>('auth/me')
        .then(me => {
          const id = me?.company_id ?? me?.companyId
          if (id) setCompanyId(Number(id))
        })
        .catch(() => {})
    }
  }, [session, fetchApi])

  const fetchStages = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApi<CompanyStage[] | { stages: CompanyStage[] }>(`companies/${companyId}/stages`)
      const list = Array.isArray(data) ? data : ((data as any)?.stages ?? (data as any)?.data ?? [])
      // Sort by position
      list.sort((a: CompanyStage, b: CompanyStage) => a.position - b.position)
      setStages(list)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar etapas')
      setStages([])
    } finally {
      setLoading(false)
    }
  }, [companyId, fetchApi])

  useEffect(() => {
    if (companyId) fetchStages()
  }, [companyId, fetchStages])

  return { stages, loading, error, companyId, refetch: fetchStages }
}
