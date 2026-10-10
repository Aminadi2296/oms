'use client'

import React from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { signOut } from 'next-auth/react'

import { useSessionExpired } from '@/context/SessionExpiredContext'

const SessionExpiredModal = () => {
  const { open, closeModal } = useSessionExpired()
  const router = useRouter()

  const handleClose = async () => {
    closeModal()
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby='session-expired-title' maxWidth='xs' fullWidth>
      <DialogTitle id='session-expired-title'>Session Expired</DialogTitle>
      <DialogContent>
        <Typography>Your session has expired. Please log in again.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='primary' variant='contained' autoFocus>
          Go to Login
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SessionExpiredModal
