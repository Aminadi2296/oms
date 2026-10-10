'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

import CommonSnackbar from '@/components/common/CommonSnackbar'

export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

export interface SnackbarContextValue {
  snackbar: SnackbarState
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void
  hideSnackbar: () => void
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined)

export interface SnackbarProviderProps {
  children: ReactNode
  defaultSeverity?: SnackbarSeverity
}

/**
 * Provider component for global snackbar state management
 *
 * @example
 * // In your app root or layout
 * <SnackbarProvider>
 *   <App />
 * </SnackbarProvider>
 *
 * // In any component
 * const { showSnackbar } = useSnackbarContext()
 * showSnackbar('success', 'Operation completed!')
 */
export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children, defaultSeverity = 'info' }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: defaultSeverity
  })

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = defaultSeverity) => {
      setSnackbar({
        open: true,
        message,
        severity
      })
    },
    [defaultSeverity]
  )

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  const value: SnackbarContextValue = {
    snackbar,
    showSnackbar,
    hideSnackbar
  }

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <CommonSnackbar snackbar={snackbar} onClose={hideSnackbar} />
    </SnackbarContext.Provider>
  )
}

/**
 * Hook to access snackbar context
 *
 * @throws Error if used outside of SnackbarProvider
 *
 * @example
 * const { snackbar, showSuccess, hideSnackbar } = useSnackbarContext()
 *
 * // Show notifications
 * showSuccess('Success message!')
 * showError('Error message!')
 *
 * // Access state for rendering
 * <CommonSnackbar snackbar={snackbar} onClose={hideSnackbar} />
 */
export const useSnackbarContext = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext)

  if (context === undefined) {
    throw new Error('useSnackbarContext must be used within a SnackbarProvider')
  }

  return context
}

export default SnackbarContext
