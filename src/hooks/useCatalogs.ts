import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'

interface BaseModel {
  id: number
  name: string
}
export interface CatalogRiskVariable {
  id: number
  code: string
  description: string
}

export interface CatalogsResponse {
  agents: BaseModel[]
  business_activities: BaseModel[]
  cities: BaseModel[]
  client_branches: BaseModel[]
  client_categories: BaseModel[]
  client_groups: BaseModel[]
  client_occupations: BaseModel[]
  client_professions: BaseModel[]
  executives: BaseModel[]
  offices: BaseModel[]
  risk_variables: BaseModel[]
  zones: BaseModel[]
}

export function useCatalogs(enabled = true) {
  const { fetchApi } = useApi()

  const [catalogs, setCatalogs] = useState<CatalogsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalogs = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetchApi<CatalogsResponse>('catalogs')

      setCatalogs(response)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar catálogos.')
      setCatalogs(null)
    } finally {
      setLoading(false)
    }
  }, [fetchApi, enabled])

  useEffect(() => {
    if (enabled) {
      fetchCatalogs()
    }
  }, [enabled, fetchCatalogs])

  return {
    catalogs,
    loading,
    error,
    refetch: fetchCatalogs
  }
}
