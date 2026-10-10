'use client'

import React from 'react'

import { Snackbar, Alert, type AlertProps, type SnackbarProps } from '@mui/material'

import type { SnackbarState } from '@/context/SnackBarContext'

export interface CommonSnackbarProps {
  snackbar: SnackbarState

  /** Callback when snackbar closes */
  onClose: () => void

  /** Auto hide duration in milliseconds @default 6000 */
  autoHideDuration?: number

  /** Snackbar position default { vertical: 'bottom', horizontal: 'right' } */
  anchorOrigin?: SnackbarProps['anchorOrigin']

  /** Alert variant @default 'filled' */
  variant?: AlertProps['variant']

  /** Custom Alert props */
  alertProps?: Partial<AlertProps>

  /** Custom Snackbar props */
  snackbarProps?: Partial<SnackbarProps>
}

/**
 * Reusable Snackbar component with consistent styling and behavior
 *
 * @example
 * const { snackbar, showSuccess, hideSnackbar } = useSnackbar()
 *
 * return (
 *   <>
 *     <Button onClick={() => showSuccess('Success!')}>
 *       Show Success
 *     </Button>
 *
 *     <CommonSnackbar
 *       snackbar={snackbar}
 *       onClose={hideSnackbar}
 *     />
 *   </>
 * )
 */
const CommonSnackbar: React.FC<CommonSnackbarProps> = ({
  snackbar,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  variant = 'filled',
  alertProps = {},
  snackbarProps = {}
}) => {
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    // Don't close on clickaway to prevent accidental dismissal
    if (reason === 'clickaway') {
      return
    }

    onClose()
  }

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      {...snackbarProps}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        variant={variant}
        sx={{
          width: '100%',
          minWidth: '300px',
          ...alertProps.sx
        }}
        {...alertProps}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  )
}

export default CommonSnackbar
