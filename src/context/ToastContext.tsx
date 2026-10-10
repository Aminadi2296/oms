'use client'

import type { ReactNode } from 'react'
import React, { createContext, useCallback, useContext } from 'react'

import { toast, ToastContainer } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'

type ToastContextType = {
  showToastAlert: (message: string, onClick?: () => void) => void
}

const ToastContext = createContext<ToastContextType>({
  showToastAlert: () => {}
})

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToastAlert = useCallback((message: string, onClick = () => {}) => {
    toast(message, {
      icon: <i className='ri-error-warning-line' style={{ color: '#d32f2f' }} />,
      onClick: onClick,
      autoClose: false,
      closeOnClick: true,
      pauseOnHover: true,
      style: {
        background: '#F5F5F7',
        color: '#3c3c3c',
        fontWeight: 600,
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToastAlert }}>
      <ToastContainer position='top-right' newestOnTop closeOnClick draggable pauseOnHover theme='light' />
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
