'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import { useApi } from '@/hooks/useApi'

const useProfileData = () => {
  const { data: session } = useSession()
  const { fetchApi } = useApi()
  const isAuthenticated = !!session?.accessToken
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchApi('auth/me')

      setProfileData(data)
    } catch (err) {
      setError('Failed to fetch profile data')
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  return {
    profileData,
    isAuthenticated,
    loading,
    error
  }
}

export default useProfileData
