'use client'

import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// Types
interface PageNavContextType {
  navContent: ReactNode | null
  setNavContent: (content: ReactNode | null) => void
}

interface PageNavProviderProps {
  children: ReactNode
}

// Create context
const PageNavContext = createContext<PageNavContextType | undefined>(undefined)

// Provider component
export const PageNavProvider: React.FC<PageNavProviderProps> = ({ children }) => {
  const [navContent, setNavContent] = useState<ReactNode | null>(null)

  return <PageNavContext.Provider value={{ navContent, setNavContent }}>{children}</PageNavContext.Provider>
}

// Custom hook to use the context
export const usePageNav = (): PageNavContextType => {
  const context = useContext(PageNavContext)

  if (context === undefined) {
    throw new Error('usePageNav must be used within a PageNavProvider')
  }

  return context
}

export default PageNavContext
