'use client'

import type { ReactNode } from 'react'
import React, { createContext, useContext, useState, useCallback } from 'react'

interface SessionExpiredContextType {
  open: boolean
  showModal: () => void
  closeModal: () => void
}

const SessionExpiredContext = createContext<SessionExpiredContextType | undefined>(undefined)

export const useSessionExpired = () => {
  const context = useContext(SessionExpiredContext)

  if (!context) {
    throw new Error('useSessionExpired must be used within a SessionExpiredProvider')
  }

  return context
}

export const SessionExpiredProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)

  const showModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])

  return (
    <SessionExpiredContext.Provider value={{ open, showModal, closeModal }}>{children}</SessionExpiredContext.Provider>
  )
}
