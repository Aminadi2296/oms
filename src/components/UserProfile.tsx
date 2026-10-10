'use client'

import { useState, useEffect } from 'react'

import { useSession, signOut } from 'next-auth/react'

import { Card, CardContent, Typography, Button, CircularProgress, Alert } from '@mui/material'

import { useApi } from '@/hooks/useApi'

const UserProfile = () => {
  const { data: session } = useSession()
  const { fetchApi } = useApi()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')

    try {
      // Example API call to get user profile
      // Replace 'users/profile' with your actual DS API endpoint
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
    if (session) {
      fetchProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (!session) {
    return (
      <Card>
        <CardContent>
          <Typography variant='h6' color='error'>
            Please log in to view your profile
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' gutterBottom>
          User Profile
        </Typography>

        <Typography variant='body1' gutterBottom>
          <strong>Name:</strong> {session?.user?.name}
        </Typography>

        <Typography variant='body1' gutterBottom>
          <strong>Email:</strong> {session?.user?.email}
        </Typography>

        <Typography variant='body1' gutterBottom>
          <strong>Username:</strong> {session?.user?.username}
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <CircularProgress />
          </div>
        ) : profileData ? (
          <div style={{ marginTop: 16 }}>
            <Typography variant='h6' gutterBottom>
              Profile Data from API:
            </Typography>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        ) : null}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button variant='contained' onClick={fetchProfile} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Profile'}
          </Button>

          <Button variant='outlined' color='error' onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserProfile
