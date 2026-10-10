import { useState, useEffect, useCallback } from 'react'

import { useApi } from './useApi'
import type { Client } from '@/types/client'

interface FollowUpType {
  id: number
  name: string
}

interface UseFollowUpTypesReturn {
  followUpTypes: FollowUpType[]
  loading: boolean
  error: string | null
}

interface FollowUpRecord {
  id: number
  subject: string
  reminder_date: string
  description: string
  assigned_to: number
  assigned_by: number
  type_id: number
  status: boolean
  created_at?: string
  updated_at?: string
  assigned_to_name?: string
  assigned_by_name?: string
  type_name?: string
}

export type CreateFollowUpPromise = (
  followUpData: Omit<FollowUpRecord, 'id' | 'created_at' | 'updated_at'>
) => Promise<FollowUpRecord>
interface UseClientReturn {
  data: Client | null
  followUpTypes: FollowUpType[]
  followUpRecords: FollowUpRecord[]
  isLoading: boolean
  error: string | null
  createFollowUp: CreateFollowUpPromise
  updateFollowUpStatus: (followUpId: number, status: boolean) => Promise<void>
  refreshFollowUps: () => Promise<void>
  refreshClient: () => Promise<void>
}

export const useClient = (clientId: string): UseClientReturn => {
  const [data, setData] = useState<Client | null>(null)
  const [followUpTypes, setFollowUpTypes] = useState<FollowUpType[]>([])
  const [followUpRecords, setFollowUpRecords] = useState<FollowUpRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchApi } = useApi()

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setData(null)
      setIsLoading(false)

      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch client data, follow-up types, and follow-up records in parallel
      const [clientData, followUpTypesData, followUpRecordsData] = await Promise.all([
        fetchApi<Client>(`clients/${clientId}`),
        fetchApi<FollowUpType[]>('follow-up-types'),
        fetchApi<FollowUpRecord[]>(`clients/${clientId}/follow-up`)
      ])

      setData(clientData)
      setFollowUpTypes(followUpTypesData)
      setFollowUpRecords(followUpRecordsData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos')
      setData(null)
      setFollowUpTypes([])
      setFollowUpRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId, fetchApi])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createFollowUp = async (
    followUpData: Omit<FollowUpRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FollowUpRecord> => {
    try {
      const newFollowUp = await fetchApi<FollowUpRecord>(`clients/${clientId}/follow-up`, {
        method: 'POST',
        body: followUpData
      })

      // Add the new follow-up to the local state and set previous to false
      setFollowUpRecords(prev => [newFollowUp, ...prev.map(record => ({ ...record, status: false }))])

      return newFollowUp
    } catch (err: any) {
      throw new Error(err.message || 'Error al crear el seguimiento')
    }
  }

  const updateFollowUpStatus = async (followUpId: number, status: boolean): Promise<void> => {
    try {
      await fetchApi(`clients/${clientId}/follow-up/${followUpId}/status`, {
        method: 'PATCH',
        body: { status }
      })

      setFollowUpRecords(prev =>
        prev.map(record => {
          if (record.id === followUpId) {
            return { ...record, status }
          }

          return { ...record }
        })
      )
    } catch (err: any) {
      throw new Error(err.message || 'Error al actualizar el estado del seguimiento')
    }
  }

  const refreshFollowUps = async (): Promise<void> => {
    try {
      const followUpRecordsData = await fetchApi<FollowUpRecord[]>(`clients/${clientId}/follow-up`)

      setFollowUpRecords(followUpRecordsData)
    } catch (err: any) {
      console.error('Error refreshing follow-ups:', err)
    }
  }

  return {
    data,
    followUpTypes,
    followUpRecords,
    isLoading,
    error,
    createFollowUp,
    refreshFollowUps,
    updateFollowUpStatus,
    refreshClient: fetchData
  }
}

export const useFollowUpTypes = (): UseFollowUpTypesReturn => {
  const [followUpTypes, setFollowUpTypes] = useState<FollowUpType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchApi } = useApi()

  useEffect(() => {
    const fetchFollowUpTypes = async () => {
      try {
        setLoading(true)
        setError(null)
        const followUpTypes = await fetchApi<FollowUpType[]>('follow-up-types')

        setFollowUpTypes(followUpTypes)
      } catch (err) {
        setError('Error al cargar los tipos de gestión')
      } finally {
        setLoading(false)
      }
    }

    fetchFollowUpTypes()
  }, [fetchApi])

  return { followUpTypes, loading, error }
}
