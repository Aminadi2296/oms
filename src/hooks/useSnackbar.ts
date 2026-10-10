import { useCallback } from 'react'

import { useSnackbarContext } from '@/context/SnackBarContext'

/**
 * Custom hook for displaying snackbars with different message types.
 *
 * Provides convenience methods to show success, info, warning, and error snackbars,
 * as well as a method to hide the snackbar.
 *
 * @returns An object containing the following methods:
 * - `showSuccess(message: string)`: Shows a success snackbar with the provided message.
 * - `showInfo(message: string)`: Shows an info snackbar with the provided message.
 * - `showWarning(message: string)`: Shows a warning snackbar with the provided message.
 * - `showError(message: string)`: Shows an error snackbar with the provided message.
 * - `hideSnackbar()`: Hides the currently displayed snackbar.
 */
export const useSnackbar = () => {
  const { showSnackbar, hideSnackbar } = useSnackbarContext()

  const showSuccess = useCallback(
    (message: string) => {
      showSnackbar(message, 'success')
    },
    [showSnackbar]
  )

  const showInfo = useCallback(
    (message: string) => {
      showSnackbar(message, 'info')
    },
    [showSnackbar]
  )

  const showWarning = useCallback(
    (message: string) => {
      showSnackbar(message, 'warning')
    },
    [showSnackbar]
  )

  const showError = useCallback(
    (message: string) => {
      showSnackbar(message, 'error')
    },
    [showSnackbar]
  )

  return { showSuccess, showInfo, showWarning, showError, hideSnackbar }
}

export default useSnackbar
