'use client'

import { useEffect } from 'react'

import type { ReactNode } from 'react'

import { usePageNav } from '@/context/PageNavContext'

/**
 * Custom hook to set page-specific navigation content
 * This hook automatically cleans up the navigation content when the component unmounts
 *
 * IMPORTANT: To prevent infinite re-renders, wrap your content in useMemo() when calling this hook:
 *
 * const navContent = useMemo(() => <YourComponent />, [dependencies])
 * usePageNavContent(navContent)
 */
export const usePageNavContent = (content: ReactNode | null) => {
  const { setNavContent } = usePageNav()

  useEffect(() => {
    // Set the navigation content
    setNavContent(content)

    // Clean up navigation content when component unmounts
    return () => {
      setNavContent(null)
    }
  }, [content, setNavContent])
}

export default usePageNavContent
